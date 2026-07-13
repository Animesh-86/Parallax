import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { apiBaseUrl, wsBaseUrl } from '../../services/env';
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
  ideSettings?: { enableAiAutocomplete: boolean; enableAiChat: boolean };
  onAiAction?: (prompt: string) => void;
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
  ideSettings = { enableAiAutocomplete: true, enableAiChat: true },
  onAiAction,
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

  useEffect(() => {
    return () => {
      if (editorInstance) {
        editorInstance.dispose();
      }
    };
  }, [editorInstance]);

  const runTimeoutRef = useRef<number | null>(null);
  const runSocketConnected = useRef(false);

  // Use a ref for filePath so the WebSocket callback always sees the current path
  // without needing to re-subscribe/re-bind.
  const filePathRef = useRef(filePath);

  useEffect(() => {
    filePathRef.current = filePath;
    filePathRef.current = filePath;
    if (editorInstance && monacoInstance && filePath) {
      const uri = monacoInstance.Uri.parse(`file:///${filePath}`);
      let model = monacoInstance.editor.getModel(uri);
      const lang = getLanguageFromPath(filePath);
      
      if (!model) {
        model = monacoInstance.editor.createModel(content, lang, uri);
      } else if (model.getValue() !== content) {
        // Only set value if it's different to preserve undo stack
        model.setValue(content);
      }
      editorInstance.setModel(model);
      monacoInstance.editor.setModelLanguage(model, lang);
    }
  }, [filePath, editorInstance, monacoInstance]);

  // Update model content if it changes externally
  useEffect(() => {
    if (editorInstance && filePath) {
      const model = editorInstance.getModel();
      if (model && model.getValue() !== content) {
        model.setValue(content);
      }
    }
  }, [content, editorInstance, filePath]);

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
    const token = localStorage.getItem("access_token");
    fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/comments?filePath=${encodeURIComponent(filePath)}`, {
      headers: { Authorization: `Bearer ${token}` }
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

  const isApplyingRemoteEditRef = useRef(false);

  // --------------------------------------------------
  // Code WebSocket
  // --------------------------------------------------
  const handleIncomingMessageRef = useRef<((msg: CodeEditMessage) => void) | null>(null);

  useEffect(() => {
    handleIncomingMessageRef.current = (msg: CodeEditMessage) => {
      // Ignore my own edits
      if (msg.userId === userId) return;

      // Only apply if it matches current open file
      if (msg.path === filePathRef.current) {
        if (msg.isDelta && msg.changes && editorInstance && monacoInstance) {
          isApplyingRemoteEditRef.current = true;
          editorInstance.executeEdits('remote-sync', msg.changes.map((c: any) => ({
            range: new monacoInstance.Range(
              c.range.startLineNumber, 
              c.range.startColumn, 
              c.range.endLineNumber, 
              c.range.endColumn
            ),
            text: c.text,
            forceMoveMarkers: true
          })));
          onChange(editorInstance.getValue());
          isApplyingRemoteEditRef.current = false;
        } else if (!msg.isDelta && msg.content !== undefined) {
          isApplyingRemoteEditRef.current = true;
          onChange(msg.content);
          // Assuming model swap handles the new content gracefully
          isApplyingRemoteEditRef.current = false;
        }
      }
    };
  }, [userId, editorInstance, monacoInstance, onChange]);

  useEffect(() => {
    if (!projectId) return;

    codeWs.connect(projectId, (msg: CodeEditMessage) => {
      if (handleIncomingMessageRef.current) {
        handleIncomingMessageRef.current(msg);
      }
    });

    return () => {
      codeWs.disconnect();
    };
  }, [projectId]);

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

  const handleEditorChange = (value: string | undefined, ev: any) => {
    if (isApplyingRemoteEditRef.current) return;
    
    const val = value || "";
    onChange(val);

    if (projectId && filePath && userId !== "unknown-user") {
      codeWs.sendEdit(projectId, {
        projectId,
        userId,
        path: filePath,
        content: val,
        isDelta: true,
        changes: ev.changes
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
          fetch(`${apiBaseUrl}/api/v1/projects/${projectId}/comments`, {
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

    // Add Explain Code Action
    editor.addAction({
      id: "ai-explain-code",
      label: "✨ Explain this Code",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: function (ed: any) {
        const selection = ed.getSelection();
        const text = ed.getModel()?.getValueInRange(selection);
        if (text && onAiAction) {
          onAiAction(`Explain this code:\n\`\`\`\n${text}\n\`\`\``);
        }
      }
    });

    // Add Find Bugs Action
    editor.addAction({
      id: "ai-find-bugs",
      label: "✨ Find Bugs",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.6,
      run: function (ed: any) {
        const selection = ed.getSelection();
        const text = ed.getModel()?.getValueInRange(selection);
        if (text && onAiAction) {
          onAiAction(`Find bugs in this code:\n\`\`\`\n${text}\n\`\`\``);
        }
      }
    });

    // Language Client Setup
    if (projectId && filePath) {
      const lang = getLanguageFromPath(filePath);
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const wsUrl = `${wsBaseUrl}/ws/lsp/${projectId}/${lang}?token=${token}`;
          const socket = new WebSocket(wsUrl);
          
          socket.onerror = (err) => {
            console.warn("LSP WebSocket error (non-fatal):", err);
          };

          socket.onclose = () => {
            console.log("LSP WebSocket closed for", lang);
          };

          socket.onopen = () => {
            try {
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
              
              languageClient.start().catch(err => console.warn("LSP Start Error (non-fatal):", err));
              
              editor.onDidDispose(() => {
                languageClient.dispose().catch(() => {});
                socket.close();
              });
            } catch (err) {
              console.warn("LSP client setup failed (non-fatal):", err);
              socket.close();
            }
          };
        } catch (err) {
          console.warn("LSP connection failed (non-fatal):", err);
        }
      }
    }

    // Register Inline Autocomplete Provider
    if (ideSettings.enableAiAutocomplete) {
      let autocompleteDebounceTimer: number;
      const provider = monaco.languages.registerInlineCompletionsProvider('*', {
        provideInlineCompletions: async (model: any, position: any) => {
          return new Promise((resolve) => {
            clearTimeout(autocompleteDebounceTimer);
            autocompleteDebounceTimer = window.setTimeout(async () => {
              try {
                // Get prefix and suffix text around cursor
                const textUntilPosition = model.getValueInRange({
                  startLineNumber: 1,
                  startColumn: 1,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column
                });
                
                const textAfterPosition = model.getValueInRange({
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: model.getLineCount(),
                  endColumn: model.getLineMaxColumn(model.getLineCount())
                });

                // Dynamically import aiApi here or at the top of file
                // I will assume it's imported or I can use fetch directly. 
                // Let's use fetch directly to avoid import issues for now
                const res = await api.post('/api/v1/ai/autocomplete', {
                  prefix: textUntilPosition,
                  suffix: textAfterPosition
                });
                
                if (res.status === 200) {
                  const data = res.data;
                  if (data.completion) {
                    resolve({
                      items: [{
                        insertText: data.completion,
                        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                      }]
                    });
                    return;
                  }
                }
                resolve({ items: [] });
              } catch (e) {
                console.error("Autocomplete failed:", e);
                resolve({ items: [] });
              }
            }, 500); // 500ms debounce
          });
        },
        freeInlineCompletions: () => {}
      });

      editor.onDidDispose(() => {
        provider.dispose();
      });
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
            height="100%"
            path={filePath} // Helps Monaco with intellisense model URI
            defaultLanguage="plaintext"
            language={getLanguageFromPath(filePath)}
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
