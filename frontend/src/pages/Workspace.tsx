import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";

import { IntegrationsSidebar } from "../components/workspace/IntegrationsSidebar";
import { FileExplorer } from "../components/workspace/FileExplorer";
import { EditorTabs } from "../components/workspace/EditorTabs";
import CodeEditor from "../components/workspace/CodeEditor";
import { Terminal } from "../components/workspace/Terminal";
import { VideoPanel } from "../components/workspace/VideoPanel";
import { ParticipantsList } from "../components/workspace/ParticipantsList";
import { UnifiedChatPanel } from "../components/chat/UnifiedChatPanel";
import { projectChatWs } from "../services/wsChatClient";
import { ActivityPanel } from "../components/workspace/ActivityPanel";
import { versioningApi, ProjectBranch } from "../services/versioningApi";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { MessageCircle, Video, Users, Sparkles, Settings, GitBranch, Puzzle, X, Play } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { apiBaseUrl } from "../services/env";
import { ProjectSettingsPanel } from "../components/workspace/ProjectSettingsPanel";
import { ExtensionsPanel } from "../components/workspace/ExtensionsPanel";

type FileNode = {
  name: string;
  path: string;
  type: "FILE" | "FOLDER";
  children?: FileNode[];
};

/* ✅ FIXED AXIOS INSTANCE (DO NOT REMOVE) */
const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function Workspace() {
  const { projectId } = useParams();

  /* Left Panel Tools State */
  type LeftTool = "explorer" | "git" | "extensions" | "ai" | "settings" | null;
  const [activeLeftTool, setActiveLeftTool] = useState<LeftTool>("explorer");

  const toggleLeftTool = (tool: LeftTool) => {
    if (activeLeftTool === tool) {
      setActiveLeftTool(null); // Toggle off if already active
    } else {
      setActiveLeftTool(tool);
    }
  };

  /* Main Workspace State */
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [runSignal, setRunSignal] = useState(0);
  const [runOutput, setRunOutput] = useState("");
  const [runExitCode, setRunExitCode] = useState<number | null>(null);

  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  /* Versioning State */
  const [activeBranch, setActiveBranch] = useState<ProjectBranch | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [projectSettings, setProjectSettings] = useState<any>(null);


  /* Right Panel Tools State */
  type RightTool = "video" | "chat" | "collaborators" | "ai" | "settings" | null;
  const [activeTool, setActiveTool] = useState<RightTool>("collaborators");

  const toggleRightTool = (tool: RightTool) => {
    if (activeTool === tool) {
      setActiveTool(null);
    } else {
      setActiveTool(tool);
    }
  };

  const templates = [
    { value: 'javascript', label: 'JavaScript', color: '#F7DF1E' },
    { value: 'c', label: 'C', color: '#A8B9CC' },
    { value: 'cpp', label: 'C++', color: '#00599C' },
    { value: 'none', label: 'Empty Project (No Template)', color: '#A1A1AA' },
  ];

  /* Project Name Management */
  const location = useLocation();
  const state = location.state as { projectName?: string } | null;
  const [projectName, setProjectName] = useState<string>(state?.projectName || "");
  const [loadingName, setLoadingName] = useState(!state?.projectName);

  useEffect(() => {
    const fetchProjectName = async () => {
      if (!projectId) return;
      try {
        if (!projectName || !state?.projectName) {
          setLoadingName(true);
          const res = await api.get(`/projects/${projectId}`);
          setProjectName(res.data.name);
          setProjectSettings(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch project details", err);
        setProjectName("Parallax Workspace");
      } finally {
        setLoadingName(false);
      }
    };
    fetchProjectName();
  }, [projectId]);

  /* Initialize versioning main branch */
  useEffect(() => {
    if (!projectId) return;
    const initVersioning = async () => {
      try {
        const mainBranch = await versioningApi.ensureMainBranch(projectId);
        setActiveBranch(mainBranch);
      } catch (err) {
        console.error('Failed to init versioning:', err);
      }
    };

    const fetchTeamContext = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`);
        setProjectSettings(res.data);
        if (res.data.teamId) {
          setTeamId(res.data.teamId);
          setTeamName(res.data.teamName || 'Team');
        }
      } catch (err) {
        // Non-critical
      }
    };

    initVersioning();
    fetchTeamContext();
  }, [projectId]);

  // ---------------- API calls ----------------

  const loadTree = async () => {
    if (!projectId) return;
    try {
      setLoadingTree(true);
      const res = await api.get(`/projects/${projectId}/files/tree`);
      setFileTree(res.data);
    } catch (e) {
      console.error("Tree load fail", e);
    } finally {
      setLoadingTree(false);
    }
  };

  const openFile = async (path: string) => {
    if (!projectId) return;

    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }

    try {
      setLoadingContent(true);
      const res = await api.get(`/projects/${projectId}/file`, {
        params: { path },
      });

      setActiveFile(path);
      setFileContent(res.data.content ?? "");
    } catch (e) {
      console.error("File load fail", e);
    } finally {
      setLoadingContent(false);
    }
  };

  const closeFile = (path: string) => {
    setOpenFiles((prev) => prev.filter((p) => p !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter((p) => p !== path);
      if (remaining.length > 0) {
        openFile(remaining[remaining.length - 1]);
      } else {
        setActiveFile(null);
        setFileContent("");
      }
    }
  };

  const saveFile = async (content: string) => {
    if (!projectId || !activeFile) return;
    setFileContent(content);
    await api.put(
      `/projects/${projectId}/file`,
      content,
      {
        params: { path: activeFile },
        headers: { "Content-Type": "text/plain" },
      }
    );
  };

  const createEntry = async (path: string, type: "FILE" | "FOLDER") => {
    if (!projectId) return;
    await api.post(`/projects/${projectId}/files`, { path, type });
    await loadTree();
  };

  const deleteEntry = async (path: string) => {
    if (!projectId) return;
    await api.delete(`/projects/${projectId}/file`, { params: { path } });
    if (activeFile === path) {
      setActiveFile(null);
      setFileContent("");
    }
    await loadTree();
  };

  useEffect(() => {
    loadTree();
  }, [projectId]);

  // Resize handler - RIGHT
  const handleRightDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;
    document.body.style.cursor = "col-resize";
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX; // Dragging left increases width
      setRightPanelWidth(Math.min(Math.max(startWidth + delta, 260), 600));
    };
    const onUp = () => {
      document.body.style.cursor = "default";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Resize handler - LEFT
  const handleLeftDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    document.body.style.cursor = "col-resize";
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setLeftPanelWidth(Math.min(Math.max(startWidth + delta, 200), 500));
    };
    const onUp = () => {
      document.body.style.cursor = "default";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white overflow-hidden relative">
      <CosmicStars />

      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-1 min-w-0">
          <div className="hidden md:block h-full">
            <IntegrationsSidebar
              activeTool={activeLeftTool}
              onSelectTool={setActiveLeftTool}
            />
          </div>

          {activeLeftTool && (
            <div style={{ width: leftPanelWidth }} className="flex-shrink-0 flex bg-[#09090B] border-r border-white/5">
              <div className="flex-1 overflow-hidden flex flex-col">
                {activeLeftTool === "explorer" && (
                  loadingTree ? (
                    <div className="space-y-3 p-4">
                      <Skeleton className="h-6 w-2/3 bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-5/6 bg-white/10" />
                      <Skeleton className="h-4 w-3/4 bg-white/10" />
                    </div>
                  ) : (
                    <FileExplorer
                      tree={fileTree}
                      onSelect={openFile}
                      onCreate={createEntry}
                      onDelete={deleteEntry}
                      onClose={() => setActiveLeftTool(null)}
                    />
                  )
                )}

                {activeLeftTool === "git" && projectId && (
                  <div className="flex flex-col h-full w-full">
                    <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
                      <span className="text-xs font-semibold tracking-wide text-white/60">SOURCE CONTROL</span>
                      <button onClick={() => setActiveLeftTool(null)} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4 text-white/60" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <ActivityPanel
                        projectId={projectId}
                        activeBranchId={activeBranch?.id || null}
                        onBranchChange={(branch) => setActiveBranch(branch)}
                      />
                    </div>
                  </div>
                )}

                {activeLeftTool === "extensions" && projectId && (
                  <ExtensionsPanel projectId={projectId} />
                )}

                {activeLeftTool === "ai" && (
                  <div className="flex flex-col h-full w-full">
                    <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
                      <span className="text-xs font-semibold tracking-wide text-white/60">AI ASSISTANT</span>
                      <button onClick={() => setActiveLeftTool(null)} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4 text-white/60" /></button>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1 text-center p-6 text-white/60">
                      <Sparkles className="w-12 h-12 mb-4 text-[#D4AF37] animate-pulse" />
                      <h3 className="text-lg font-bold text-white mb-2">Agent Coming Soon</h3>
                      <p className="text-sm">
                        The AI Agent is stuck in traffic.
                        <br />
                        <span className="opacity-50 text-xs block mt-2">(Coming Soon!)</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeLeftTool === "settings" && projectId && (
                  <div className="flex flex-col h-full w-full">
                    <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
                      <span className="text-xs font-semibold tracking-wide text-white/60">PROJECT SETTINGS</span>
                      <button onClick={() => setActiveLeftTool(null)} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4 text-white/60" /></button>
                    </div>
                    <ProjectSettingsPanel projectId={projectId} onUpdate={() => fetchProjectName()} />
                  </div>
                )}
              </div>
              <div
                className="w-1 cursor-col-resize hover:bg-white/20 active:bg-[#D4AF37]/30 transition-colors"
                onMouseDown={handleLeftDragMouseDown}
              />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col pt-6">
            <EditorTabs
              projectName={loadingName ? <Skeleton className="h-5 w-32 inline-block" /> : projectName}
              files={openFiles}
              activeFile={activeFile}
              teamId={teamId}
              teamName={teamName}
              activeBranch={activeBranch}
              onSelect={(path) => {
                setActiveFile(path);
                openFile(path);
              }}
              onClose={closeFile}
              onRun={() => {
                setTerminalOpen(true);
                setRunSignal((v) => v + 1);
              }}
            />

            <div className="flex-1 overflow-hidden relative">
              {loadingContent && (
                <div className="absolute inset-0 z-50 bg-[#09090B]">
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-6 w-1/3 bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-11/12 bg-white/10" />
                    <Skeleton className="h-4 w-10/12 bg-white/10" />
                  </div>
                </div>
              )}
              <CodeEditor
                filePath={activeFile}
                content={fileContent}
                onChange={saveFile}
                runSignal={runSignal}
                onRunResult={(out, code) => {
                  setRunOutput(out);
                  setRunExitCode(code);
                }}
                {...(() => {
                  const s = JSON.parse(projectSettings?.settingsJson || '{}');
                  return {
                    tabSize: s.tabSize || 2,
                    fontSize: s.fontSize || 14,
                    fontFamily: s.fontFamily || "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                    minimap: s.minimap !== undefined ? s.minimap : true,
                    wordWrap: s.wordWrap || "on",
                    autoSave: s.autoSave !== undefined ? s.autoSave : true,
                  };
                })()}
              />
            </div>

            <Terminal
              isOpen={terminalOpen}
              onToggle={() => setTerminalOpen(!terminalOpen)}
              output={runOutput}
              exitCode={runExitCode}
            />
          </div>
        </div>

        {activeTool && (
          <div
            className="w-1 cursor-col-resize bg-white/5 hover:bg-white/20 active:bg-[#D4AF37]/30 transition-colors"
            onMouseDown={handleRightDragMouseDown}
          />
        )}

        {/* Right Panel Content */}
        {activeTool && (
          <div
            className="flex h-full flex-shrink-0 bg-[#09090B] border-l border-white/5"
            style={{ width: rightPanelWidth }}
          >
            <div className="flex-1 overflow-hidden">
              {activeTool === "video" && <VideoPanel mode="video" onModeChange={() => { }} />}
              {activeTool === "chat" && projectId && (
                <UnifiedChatPanel 
                  contextId={projectId} 
                  contextType="PROJECT" 
                  contextName={projectName}
                  wsClient={projectChatWs} 
                />
              )}
              {activeTool === "collaborators" && <ParticipantsList />}
              {activeTool === "ai" && (
                <div className="flex flex-col h-full w-full">
                  <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
                    <span className="text-xs font-semibold tracking-wide text-white/60">AI ASSISTANT</span>
                  </div>
                  <div className="flex flex-col items-center justify-center flex-1 text-center p-6 text-white/60">
                    <Sparkles className="w-12 h-12 mb-4 text-[#D4AF37] animate-pulse" />
                    <h3 className="text-lg font-bold text-white mb-2">Agent Coming Soon</h3>
                    <p className="text-sm">
                      The AI Agent is stuck in traffic.
                      <br />
                      <span className="opacity-50 text-xs block mt-2">(Coming Soon!)</span>
                    </p>
                  </div>
                </div>
              )}
              {activeTool === "settings" && projectId && (
                <div className="flex flex-col h-full w-full">
                  <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
                    <span className="text-xs font-semibold tracking-wide text-white/60">PROJECT SETTINGS</span>
                    <button onClick={() => setActiveTool(null)} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4 text-white/60" /></button>
                  </div>
                  <ProjectSettingsPanel projectId={projectId} onUpdate={() => fetchProjectName()} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel Icons (Always Visible) */}
        <div className="flex flex-col items-center gap-4 w-14 py-4 border-l border-white/10 bg-[#09090B]">
          <button
            onClick={() => toggleRightTool("collaborators")}
            title="Collaborators"
            className={`p-2 rounded-xl transition-all ${activeTool === "collaborators" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => toggleRightTool("chat")}
            title="Chat"
            className={`p-2 rounded-xl transition-all ${activeTool === "chat" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <MessageCircle size={20} />
          </button>
          <button
            onClick={() => toggleRightTool("video")}
            title="Video Call"
            className={`p-2 rounded-xl transition-all ${activeTool === "video" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <Video size={20} />
          </button>
          <button
            onClick={() => toggleRightTool("ai")}
            title="AI Assistant"
            className={`p-2 rounded-xl transition-all ${activeTool === "ai" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <Sparkles size={20} />
          </button>
          <button
            onClick={() => toggleRightTool("settings")}
            title="Settings"
            className={`p-2 rounded-xl transition-all ${activeTool === "settings" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
