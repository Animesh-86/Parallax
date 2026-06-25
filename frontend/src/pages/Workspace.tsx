import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";

import { IntegrationsSidebar } from "../components/workspace/IntegrationsSidebar";
import { FileExplorer } from "../components/workspace/FileExplorer";
import { EditorTabs } from "../components/workspace/EditorTabs";
import CodeEditor from "../components/workspace/CodeEditor";
import React, { useMemo } from "react";
const Terminal = React.lazy(() => import("../components/workspace/Terminal").then(m => ({ default: m.Terminal })));
const VideoPanel = React.lazy(() => import("../components/workspace/VideoPanel").then(m => ({ default: m.VideoPanel })));
const AiChatPanel = React.lazy(() => import("../components/chat/AiChatPanel").then(m => ({ default: m.AiChatPanel })));
const BrowserPreviewPanel = React.lazy(() => import("../components/workspace/BrowserPreviewPanel").then(m => ({ default: m.BrowserPreviewPanel })));
import { projectChatWs } from "../services/wsChatClient";
import { ActivityPanel } from "../components/workspace/ActivityPanel";
import { versioningApi, ProjectBranch } from "../services/versioningApi";
import { MessageCircle, Video, Users, Bot, Settings, GitBranch, Puzzle, X, Play, Globe } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { apiBaseUrl } from "../services/env";
import { ProjectSettingsPanel } from "../components/workspace/ProjectSettingsPanel";
import { ExtensionsPanel } from "../components/workspace/ExtensionsPanel";
import { IdeSettingsPanel } from "../components/workspace/IdeSettingsPanel";
import { UnifiedChatPanel } from "../components/chat/UnifiedChatPanel";
import { ParticipantsList } from "../components/workspace/ParticipantsList";

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
  type LeftTool = "explorer" | "git" | "extensions" | "settings" | "ide-settings" | null;
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
  const [expandedFileTree, setExpandedFileTree] = useState<Record<string, boolean>>({});
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [runSignal, setRunSignal] = useState(0);
  const [runOutput, setRunOutput] = useState("");
  const [runExitCode, setRunExitCode] = useState<number | null>(null);

  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  /* Versioning State */
  const [activeBranch, setActiveBranch] = useState<ProjectBranch | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [projectSettings, setProjectSettings] = useState<any>(null);


  /* Right Panel Tools State */
  type RightTool = "video" | "chat" | "collaborators" | "ai" | "activity";
  const [activeRightTools, setActiveRightTools] = useState<RightTool[]>(["collaborators"]);
  
  const toggleRightTool = (tool: RightTool) => {
    setActiveRightTools((prev) => 
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  /* Global IDE Settings */
  const [ideSettings, setIdeSettings] = useState({
    tabSize: 2,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
    minimap: true,
    wordWrap: "on" as "on" | "off",
    autoSave: true,
    formatOnSave: true,
    enableAiReview: true,
    enableAiChat: true,
  });

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

  const bootstrapWorkspace = async () => {
    if (!projectId) return;
    try {
      setLoadingName(true);
      setLoadingTree(true);
      
      const res = await api.get(`/workspace/${projectId}/bootstrap`);
      const data = res.data;

      // 1. Project details
      if (data.project) {
        setProjectName(data.project.name);
        setProjectSettings(data.project);
        if (data.project.teamId) {
          setTeamId(data.project.teamId);
          setTeamName(data.project.teamName || 'Team');
        }
      }

      // 2. IDE Settings
      if (data.ideSettings) {
        try {
          setIdeSettings(JSON.parse(data.ideSettings));
        } catch (e) {
          console.error("Failed to parse IDE settings", e);
        }
      }

      // 3. File tree
      if (data.fileTree) {
        setFileTree(data.fileTree);
      }

      // 4. Branches
      if (data.mainBranch && data.branches) {
        const savedBranchId = localStorage.getItem(`activeBranch_${projectId}`);
        let targetBranch = data.mainBranch;
        if (savedBranchId) {
          const found = data.branches.find((b: any) => b.id === savedBranchId);
          if (found) targetBranch = found;
        }
        setActiveBranch(targetBranch);
      }
    } catch (err) {
      console.error("Failed to bootstrap workspace", err);
      setProjectName("Parallax Workspace");
    } finally {
      setLoadingName(false);
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    bootstrapWorkspace();
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
    // Server-side debounced save handled by WebSocket.
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

  const editorSettings = useMemo(() => {
    try {
      const s = JSON.parse(projectSettings?.settingsJson || '{}');
      return {
        tabSize: s.tabSize || 2,
        fontSize: s.fontSize || 14,
        fontFamily: s.fontFamily || "'Fira Code', 'JetBrains Mono', Consolas, monospace",
        minimap: s.minimap !== undefined ? s.minimap : true,
        wordWrap: s.wordWrap || "on",
        autoSave: s.autoSave !== undefined ? s.autoSave : true,
      };
    } catch {
      return { tabSize: 2, fontSize: 14, fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace", minimap: true, wordWrap: "on", autoSave: true };
    }
  }, [projectSettings?.settingsJson]);

  return (
    <div className="min-h-screen bg-[#09090B] text-white overflow-hidden relative">
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
                <div className={activeLeftTool === "explorer" ? "flex flex-col h-full" : "hidden"}>
                  {loadingTree ? (
                    <div className="space-y-3 p-4">
                      <Skeleton className="h-6 w-2/3 bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-5/6 bg-white/10" />
                      <Skeleton className="h-4 w-3/4 bg-white/10" />
                    </div>
                  ) : (
                    <FileExplorer
                      tree={fileTree}
                      expanded={expandedFileTree}
                      setExpanded={setExpandedFileTree}
                      onSelect={openFile}
                      onCreate={createEntry}
                      onDelete={deleteEntry}
                      onClose={() => setActiveLeftTool(null)}
                    />
                  )}
                </div>

                {projectId && (
                  <div className={activeLeftTool === "git" ? "flex flex-col h-full w-full" : "hidden"}>
                    <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
                      <span className="text-xs font-semibold tracking-wide text-white/60">SOURCE CONTROL</span>
                      <button onClick={() => setActiveLeftTool(null)} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4 text-white/60" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <ActivityPanel
                        projectId={projectId}
                        activeBranchId={activeBranch?.id || null}
                        onBranchChange={async (b) => {
                          setActiveBranch(b);
                          localStorage.setItem(`activeBranch_${projectId}`, b.id);
                          try {
                            await versioningApi.checkoutBranch(projectId, b.name);
                            // Refresh file tree if we switch branches
                            await loadTree();
                            
                            // Reload active file content if one is open
                            if (activeFile) {
                              await openFile(activeFile);
                            }
                          } catch (e) {
                            console.error('Failed to checkout branch:', e);
                          }
                        }}
                        githubRepoUrl={projectSettings?.githubRepoUrl}
                      />
                    </div>
                  </div>
                )}

                {projectId && (
                  <div className={activeLeftTool === "extensions" ? "flex flex-col h-full w-full" : "hidden"}>
                    <ExtensionsPanel projectId={projectId} />
                  </div>
                )}



                {activeLeftTool === "settings" && projectId && (
                  <ProjectSettingsPanel 
                    projectId={projectId} 
                    onClose={() => setActiveLeftTool(null)} 
                    onUpdate={() => bootstrapWorkspace()}
                  />
                )}
                
                {activeLeftTool === "ide-settings" && (
                  <IdeSettingsPanel 
                    onClose={() => setActiveLeftTool(null)} 
                    onSettingsChange={(newSettings) => setIdeSettings(newSettings)}
                  />
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
              onOpenPreview={() => {
                if (!openFiles.includes("browser-preview")) {
                  setOpenFiles(prev => [...prev, "browser-preview"]);
                }
                setActiveFile("browser-preview");
              }}
              teamId={teamId}
              teamName={teamName}
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
              {activeFile === "browser-preview" ? (
                <React.Suspense fallback={<div className="p-4 text-white/50">Loading preview...</div>}>
                  <BrowserPreviewPanel projectId={projectId!} />
                </React.Suspense>
              ) : (
                <CodeEditor
                  filePath={activeFile}
                  content={fileContent}
                  onChange={saveFile}
                  runSignal={runSignal}
                  onRunResult={(out, code) => {
                    setRunOutput(out);
                    setRunExitCode(code);
                  }}
                  {...editorSettings}
                  ideSettings={ideSettings}
                  onAiAction={(prompt: string) => {
                    if (!activeRightTools.includes("ai")) {
                      toggleRightTool("ai");
                    }
                    window.dispatchEvent(new CustomEvent("trigger-ai-chat", { detail: prompt }));
                  }}
                />
              )}
            </div>

            <React.Suspense fallback={null}>
              <Terminal
                isOpen={terminalOpen}
                onToggle={() => setTerminalOpen(!terminalOpen)}
                output={runOutput}
                exitCode={runExitCode}
                projectId={projectId}
              />
            </React.Suspense>
          </div>
        </div>

        {activeRightTools.length > 0 && (
          <div
            className="w-1 cursor-col-resize bg-white/5 hover:bg-white/20 active:bg-[#D4AF37]/30 transition-colors"
            onMouseDown={handleRightDragMouseDown}
          />
        )}

        {/* Right Panel Content */}
        {activeRightTools.length > 0 && (
          <div
            className="flex flex-col h-full flex-shrink-0 bg-[#09090B] border-l border-white/5"
            style={{ width: rightPanelWidth }}
          >
            {activeRightTools.map((tool, index) => (
              <div 
                key={tool} 
                className={`flex-1 overflow-hidden flex flex-col min-h-[250px] ${index > 0 ? 'border-t border-white/10' : ''}`}
              >
                {tool === "video" && (
                  <React.Suspense fallback={<div className="p-4 text-white/50">Loading video...</div>}>
                    <VideoPanel mode="video" onModeChange={() => { }} onClose={() => toggleRightTool("video")} />
                  </React.Suspense>
                )}
                
                {tool === "chat" && projectId && (
                  <UnifiedChatPanel 
                    contextId={projectId} 
                    contextType="PROJECT" 
                    contextName={projectName}
                    wsClient={projectChatWs}
                    onClose={() => toggleRightTool("chat")} 
                  />
                )}
                
                {tool === "collaborators" && <ParticipantsList onClose={() => toggleRightTool("collaborators")} />}
                
                {tool === "ai" && (
                  <div className="flex flex-col h-full w-full">
                    <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 shrink-0">
                      <span className="text-xs font-semibold tracking-wide text-white/60">AI ASSISTANT</span>
                      <button onClick={() => toggleRightTool("ai")} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4 text-white/60" /></button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {ideSettings.enableAiChat && (
                        <React.Suspense fallback={<div className="p-4 text-white/50">Loading AI...</div>}>
                          <AiChatPanel activeFileContent={fileContent} activeFileName={activeFile || undefined} />
                        </React.Suspense>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


        {/* Right Panel Icons (Always Visible) */}
        <div className="flex flex-col items-center gap-4 w-14 py-4 border-l border-white/10 bg-[#09090B]">
          <button
            onClick={() => toggleRightTool("collaborators")}
            title="Collaborators"
            className={`p-2 rounded-xl transition-all ${activeRightTools.includes("collaborators") ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => toggleRightTool("chat")}
            title="Chat"
            className={`p-2 rounded-xl transition-all ${activeRightTools.includes("chat") ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <MessageCircle size={20} />
          </button>
          <button
            onClick={() => toggleRightTool("video")}
            title="Video Call"
            className={`p-2 rounded-xl transition-all ${activeRightTools.includes("video") ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <Video size={20} />
          </button>
          <button
            onClick={() => toggleRightTool("ai")}
            title="AI Assistant"
            className={`p-2 rounded-xl transition-all ${activeRightTools.includes("ai") ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <Bot size={20} />
          </button>
          
        </div>
      </div>
    </div>
  );
}
