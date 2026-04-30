import { X, Split, Play, LogOut, GitBranch, Users } from 'lucide-react';
import { useNavigate } from "react-router-dom";
type EditorTabsProps = {
  projectName: string;
  files: string[];
  activeFile: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onRun: () => void;
  teamId?: string | null;
  teamName?: string | null;
  activeBranch?: { name: string } | null;
};

export function EditorTabs({
  projectName,
  files,
  activeFile,
  onSelect,
  onClose,
  onRun,
  teamId,
  teamName,
  activeBranch,
}: EditorTabsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#09090B] border-b border-white/5">
      {/* Header with Project Info and Badges */}
      <div className="px-4 py-2 flex items-center border-b border-white/5 bg-[#0D0D0F]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {teamId && (
            <a
              href={`/team/${teamId}`}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-md text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all truncate max-w-[120px]"
            >
              <Users className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{teamName}</span>
            </a>
          )}
          {activeBranch && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/50 truncate max-w-[120px]">
              <GitBranch className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{activeBranch.name}</span>
            </span>
          )}
        </div>

        <div className="flex-[2] text-center">
          <h2 className="text-sm md:text-lg font-bold bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] bg-clip-text text-transparent font-serif italic truncate px-2">
            {projectName}
          </h2>
        </div>

        <div className="flex-1 flex justify-end">
          {/* Potential right-side header items */}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        {/* Open file tabs */}
        <div className="flex items-center gap-1">
          {files.map((file) => {
            const isActive = file === activeFile;
            // Get simplified name (basename)
            const fileName = file.split('/').pop() || file;

            return (
              <div
                key={file}
                onClick={() => onSelect(file)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all cursor-pointer group flex-shrink-0 ${isActive
                    ? 'bg-[#09090B] text-white border-t border-x border-white/10'
                    : 'bg-transparent text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
              >
                <span className="text-sm whitespace-nowrap">{fileName}</span>
                {/* {tab.modified && <div className="w-1.5 h-1.5 rounded-full bg-[#A1A1AA]" />} */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(file);
                  }}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5 ${isActive ? 'opacity-100' : ''}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {/* Run Code Button - VS Code style */}
          <button
            className="group px-3 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:shadow-lg hover:shadow-[#D4AF37]/30 rounded-lg transition-all duration-300 flex items-center gap-2 text-black"
            title="Run Code"
            onClick={onRun}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-bold uppercase tracking-wider">Run</span>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Exit
          </button>


          {/* Split editor control */}
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
            title="Split Editor"

          >
            <Split className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}
