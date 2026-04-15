import { GitBranch, Puzzle, Settings, Sparkles, FolderOpen } from 'lucide-react';

type IntegrationsSidebarProps = {
  activeTool: "explorer" | "git" | "extensions" | "ai" | "settings" | null;
  onSelectTool: (tool: "explorer" | "git" | "extensions" | "ai" | "settings" | null) => void;
};

export function IntegrationsSidebar({ activeTool, onSelectTool }: IntegrationsSidebarProps) {

  const handleToolClick = (tool: "explorer" | "git" | "extensions" | "ai" | "settings") => {
    if (activeTool === tool) {
      onSelectTool(null); // Toggle off
    } else {
      onSelectTool(tool);
    }
  };

  return (
    <div className="w-14 h-full bg-[#09090B] border-r border-white/5 flex flex-col items-center py-4 gap-4">
      {/* Explorer */}
      <button
        onClick={() => handleToolClick('explorer')}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group relative ${activeTool === 'explorer'
            ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 text-[#A1A1AA] shadow-lg shadow-[#D4AF37]/20'
            : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        title="Explorer"
      >
        <FolderOpen className="w-5 h-5" />
        {activeTool === 'explorer' && (
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#A1A1AA] rounded-r" />
        )}
      </button>

      {/* Git */}
      <button
        onClick={() => handleToolClick('git')}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group relative ${activeTool === 'git'
            ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 text-[#A1A1AA] shadow-lg shadow-[#D4AF37]/20'
            : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        title="Git"
      >
        <GitBranch className="w-5 h-5" />
        {activeTool === 'git' && (
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#A1A1AA] rounded-r" />
        )}
      </button>

      {/* Extensions */}
      <button
        onClick={() => handleToolClick('extensions')}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group relative ${activeTool === 'extensions'
            ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 text-[#A1A1AA] shadow-lg shadow-[#D4AF37]/20'
            : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        title="Extensions"
      >
        <Puzzle className="w-5 h-5" />
        {activeTool === 'extensions' && (
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#A1A1AA] rounded-r" />
        )}
      </button>

      {/* AI Assist */}
      <button
        onClick={() => handleToolClick('ai')}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group relative ${activeTool === 'ai'
            ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 text-[#A1A1AA] shadow-lg shadow-[#D4AF37]/20'
            : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        title="AI Assist"
      >
        <Sparkles className={`w-5 h-5 ${activeTool !== 'ai' ? 'group-hover:text-[#D4AF37] transition-colors' : ''}`} />
        {activeTool === 'ai' && (
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#A1A1AA] rounded-r" />
        )}
      </button>

      <div className="mt-auto flex flex-col gap-4">
        {/* Settings */}
        <button
          onClick={() => handleToolClick('settings')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group relative ${activeTool === 'settings'
              ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 text-[#A1A1AA] shadow-lg shadow-[#D4AF37]/20'
              : 'hover:bg-white/10 text-white/60 hover:text-white'
            }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
          {activeTool === 'settings' && (
            <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#A1A1AA] rounded-r" />
          )}
        </button>
      </div>
    </div>
  );
}
