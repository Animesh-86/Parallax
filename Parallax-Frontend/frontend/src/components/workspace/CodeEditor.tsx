import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Editor, { OnMount } from "@monaco-editor/react";

import { codeWs } from "../../services/wsCode";
import { connectRunSocket, sendRunRequest } from "../../services/wsRun";
import { CodeEditMessage, RunCodeBroadcastMessage } from "../../types/wsTypes";
import { startSession } from "../../services/session";

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
};

export default function CodeEditor({
  filePath,
  content,
  onChange,
  runSignal,
  onRunResult,
}: CodeEditorProps) {
  const { projectId } = useParams();

  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("unknown-user");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);

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
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "C586C0" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
      ],
      colors: {
        "editor.background": "#000000",
      },
    });
    monaco.editor.setTheme("Parallax-dark");
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
        <div className="flex flex-col h-full rounded-xl overflow-hidden border border-[#162032] bg-[#162032]">
          <div className="px-4 py-2 text-xs text-[#A1A1AA] border-b border-[#162032]">
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
              fontSize: 14,
              fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: true },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              formatOnType: true,
              formatOnPaste: true,
              tabSize: 2,
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
