import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Editor, { OnMount } from "@monaco-editor/react";

import { codeWs } from "../../services/wsCode";
import { connectRunSocket, sendRunRequest } from "../../services/wsRun";
import { CodeEditMessage, RunCodeBroadcastMessage } from "../../types/wsTypes";
import { startSession } from "../../services/session";
import { MonacoLanguageClient } from 'monaco-languageclient';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
}

type CodeEditorProps = {
  filePath: string | null;
  content: string;
  onChange: (value: string) => void;
  runSignal: number;
  onRunResult: (output: string, exitCode: number | null) => void;
  tabSize?: number;
  fontSize?: number;
  fontFamily?: string;
  minimap?: boolean;
  wordWrap?: "on" | "off";
  autoSave?: boolean;
};

export default function CodeEditor({
  filePath,
  content,
  onChange,
  runSignal,
  onRunResult,
  tabSize = 2,
  fontSize = 14,
  fontFamily = "'Fira Code', 'JetBrains Mono', Consolas, monospace",
  minimap = true,
  wordWrap = "on",
  autoSave = true,
}: CodeEditorProps) {
  const { projectId } = useParams();

  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("unknown-user");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<any>(null);
  const decorationsCollection = useRef<any>(null);

  const runTimeoutRef = useRef<number | null>(null);
  const runSocketConnected = useRef(false);

  // Use a ref for filePath so the WebSocket callback always sees the current path
  // without needing to re-subscribe/re-bind.
  const filePathRef = useRef(filePath);

  useEffect(() => {
    filePathRef.current = filePath;
  }, [filePath]);

  // --------------------------------------------------
  // Decode JWT
  // --------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserId(decoded.sub || "unknown-user");
    } catch {
      setUserId("invalid-token");
    }
  }, []);

  // --------------------------------------------------
  // Fetch Comments
  // --------------------------------------------------
  useEffect(() => {
    if (!projectId || !filePath) return;
    fetch(`http://localhost:8080/api/projects/${projectId}/comments?filePath=${encodeURIComponent(filePath)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
    })
    .then(r => r.json())
    .then(data => setComments(data))
    .catch(console.error);
  }, [projectId, filePath]);

  // --------------------------------------------------
  // Render Comment Decorations
  // --------------------------------------------------
  useEffect(() => {
    if (!monacoInstance || !editorInstance) return;
    const decs = comments.map(c => ({
      range: new monacoInstance.Range(c.lineNumber, 1, c.lineNumber, 1),
      options: {
        isWholeLine: true,
        className: 'bg-yellow-500/20',
        hoverMessage: { value: `**Comment:** ${c.content}\n\n*(Press Ctrl+M on a line to add a comment)*` }
      }
    }));
    
    if (decorationsCollection.current) {
      decorationsCollection.current.set(decs);
    } else {
      decorationsCollection.current = editorInstance.createDecorationsCollection(decs);
    }
  }, [comments, monacoInstance, editorInstance]);

  // --------------------------------------------------
  // Start execution session
  // --------------------------------------------------
  useEffect(() => {
    if (!projectId) return;

    const start = async () => {
      try {
        setSessionStarting(true);
        setSessionReady(false);

        await startSession(projectId);

        setSessionReady(true);
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Failed to start execution session");
      } finally {
        setSessionStarting(false);
      }
    };

    start();
  }, [projectId]);

  // --------------------------------------------------
  // Code WebSocket
  // --------------------------------------------------
  useEffect(() => {
    if (!projectId) return;

    codeWs.connect(projectId, (msg: CodeEditMessage) => {
      // Ignore my own edits
      if (msg.userId === userId) return;

      // Only apply if it matches current open file
      if (msg.path === filePathRef.current) {
        onChange(msg.content);
      }
    });

    return () => {
      codeWs.disconnect();
    };
  }, [projectId, userId, onChange]);

  // --------------------------------------------------
  // Run WebSocket (ONE TIME)
  // --------------------------------------------------
  useEffect(() => {
    if (!projectId || runSocketConnected.current) return;

    runSocketConnected.current = true;

    const buffer = { current: "" };

    connectRunSocket(projectId, (msg: RunCodeBroadcastMessage) => {
      if (runTimeoutRef.current) {
        clearTimeout(runTimeoutRef.current);
        runTimeoutRef.current = null;
      }

      if (msg.type === "RUN_STARTED") {
        buffer.current = "";
        onRunResult("(Running...)", null);
        return;
      }

      if (msg.type === "RUN_OUTPUT") {
        buffer.current += (msg.output ?? "") + "\n";
        onRunResult(buffer.current.trimEnd(), null);
        return;
      }

      if (msg.type === "RUN_FINISHED") {
        const finalOut =
          msg.output?.trimEnd() ||
          buffer.current.trimEnd() ||
          "(No output)";

        onRunResult(finalOut, msg.exitCode ?? null);

        if (msg.exitCode && msg.exitCode !== 0) {
          setError(`Process exited with code ${msg.exitCode}`);
        } else {
          setError(null);
        }
        return;
      }

      if (msg.type === "RUN_ERROR") {
        onRunResult(buffer.current.trimEnd(), msg.exitCode ?? -1);
        setError(`Execution Error: ${msg.output || "Unknown error"}`);
        return;
      }
    });
  }, [projectId, onRunResult]);

  // --------------------------------------------------
  // Run trigger
  // --------------------------------------------------
  useEffect(() => {
    if (!runSignal) return;
    if (!filePath) return;
    if (!sessionReady) return;

    setError(null);

    sendRunRequest(projectId!, {
      projectId,
      userId,
      filename: filePath,
      timeoutSeconds: 10,
    });

    runTimeoutRef.current = window.setTimeout(() => {
      setError(
        "No output received from execution engine. Try refreshing or disabling browser extensions."
      );
    }, 12000);
  }, [runSignal]);

  // --------------------------------------------------
  // Constants & Theme
  // --------------------------------------------------

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    onChange(val);

    if (projectId && filePath && userId !== "unknown-user") {
      codeWs.sendEdit(projectId, {
        projectId,
        userId,
        path: filePath,
        content: val
      });
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme("Parallax-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "D4D4D4" },
        { token: "keyword", foreground: "C586C0", fontStyle: "bold" },
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
        { token: "variable", foreground: "9CDCFE" },
        { token: "constant", foreground: "4FC1FF" },
      ],
      colors: {
        "editor.background": "#000000",
        "editor.foreground": "#D4D4D4",
        "editorCursor.foreground": "#D4AF37",
        "editor.lineHighlightBackground": "#1A1A1A",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#D4AF37",
      },
    });
    monaco.editor.setTheme("Parallax-dark");
    
    // Explicitly set language on the model
    const model = editor.getModel();
    if (model) {
      if (filePath) {
        const lang = getLanguageFromPath(filePath);
        monaco.editor.setModelLanguage(model, lang);
      }
      // Apply tab settings
      model.updateOptions({ 
        tabSize: tabSize, 
        insertSpaces: true 
      });
    }

    // Apply other settings directly to editor instance
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: fontFamily,
      minimap: { enabled: minimap },
      wordWrap: wordWrap,
    });

    setEditorInstance(editor);
    setMonacoInstance(monaco);

    // Add Comment Action
    editor.addAction({
      id: "add-comment",
      label: "Add Inline Comment",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM],
      contextMenuGroupId: "navigation",
      run: function (ed: any) {
        const position = ed.getPosition();
        if (!position) return;
        const text = prompt("Enter your comment for line " + position.lineNumber);
        if (text) {
          fetch(`http://localhost:8080/api/projects/${projectId}/comments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({
              filePath: filePathRef.current,
              lineNumber: position.lineNumber,
              content: text
            })
          })
          .then(r => r.json())
          .then(newComment => {
            setComments(prev => [...prev, newComment]);
          })
          .catch(console.error);
        }
      }
    });

    // Language Client Setup
    if (projectId && filePath) {
      const lang = getLanguageFromPath(filePath);
      const token = localStorage.getItem("access_token");
      if (token) {
        const wsUrl = `ws://localhost:8080/ws/lsp/${projectId}/${lang}?token=${token}`;
        const socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          const socketConnection = toSocket(socket);
          const reader = new WebSocketMessageReader(socketConnection);
          const writer = new WebSocketMessageWriter(socketConnection);
          
          const languageClient = new MonacoLanguageClient({
            name: `${lang} Language Client`,
            clientOptions: {
              documentSelector: [lang]
            },
            connectionProvider: {
              get: () => Promise.resolve({ reader, writer })
            }
          });
          
          languageClient.start().catch(err => console.error("LSP Start Error:", err));
          
          editor.onDidDispose(() => {
            languageClient.dispose();
            socket.close();
          });
        };
      }
    }
  };

  if (!filePath) {
    return (
      <div className="flex h-full items-center justify-center text-white/40 text-sm">
        Select a file to start editing
      </div>
    );
  }

  // --------------------------------------------------
  // Helper: Get language from extension
  // --------------------------------------------------
  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case "js": return "javascript";
      case "jsx": return "javascript";
      case "ts": return "typescript";
      case "tsx": return "typescript";
      case "css": return "css";
      case "html": return "html";
      case "json": return "json";
      case "py": return "python";
      case "java": return "java";
      case "c": return "c";
      case "cpp": return "cpp";
      case "md": return "markdown";
      case "sql": return "sql";
      case "xml": return "xml";
      case "yaml": return "yaml";
      case "yml": return "yaml";
      case "sh": return "shell";
      case "go": return "go";
      case "rs": return "rust";
      case "php": return "php";
      default: return "plaintext";
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {error && (
        <div className="px-4 py-2 bg-[#EF6461]/20 text-[#D4AF37] text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 p-4">
        <div className="flex flex-col h-full rounded-xl overflow-hidden border border-white/10 bg-[#09090B]">
          <div className="px-4 py-2 text-xs text-[#A1A1AA] border-b border-white/10">
            Editing: {filePath} <span className="ml-2 opacity-50">({getLanguageFromPath(filePath)})</span>
          </div>

          <Editor
            key={filePath} // FORCE REMOUNT on file change to ensure language/content load correctly
            height="100%"
            path={filePath} // Helps Monaco with intellisense model URI
            defaultLanguage="plaintext"
            language={getLanguageFromPath(filePath)}
            value={content}
            onChange={handleEditorChange}
            theme="Parallax-dark"
            onMount={handleEditorMount}
            options={{
              fontSize: fontSize,
              tabSize: tabSize,
              insertSpaces: true,
              fontFamily: fontFamily,
              fontLigatures: true,
              minimap: { enabled: minimap },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: wordWrap,
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              formatOnType: true,
              formatOnPaste: true,
              suggest: {
                showWords: true,
                showSnippets: true,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
