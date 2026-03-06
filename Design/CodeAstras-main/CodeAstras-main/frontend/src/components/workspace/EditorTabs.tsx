import { X, Split, Play } from 'lucide-react';

export function EditorTabs() {
  const tabs = [
    { name: 'main.py', active: true, modified: false },
    { name: 'utils.py', active: false, modified: true },
    { name: 'config.json', active: false, modified: false },
  ];

  return (
    <div className="bg-[#0f0f0f] border-b border-white/5">
      {/* Tagline */}
      <div className="px-4 py-2 text-center border-b border-white/5">
        <p className="text-xs">
          <span className="bg-gradient-to-r from-[#0ea5e9] to-[#7c3aed] bg-clip-text text-transparent">
            Code collaboratively. Build astronomically.
          </span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Open file tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <div
              key={tab.name}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all cursor-pointer group ${
                tab.active
                  ? 'bg-[#0a0a0a] text-white border-t border-x border-white/10'
                  : 'bg-transparent text-white/60 hover:bg-white/5 hover:text-white/90'
              }`}
            >
              <span className="text-sm">{tab.name}</span>
              {tab.modified && <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />}
              <button className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Run Code Button - VS Code style */}
          <button
            className="group px-3 py-1.5 bg-gradient-to-r from-[#7c3aed] to-[#0ea5e9] hover:from-[#8b5cf6] hover:to-[#06b6d4] rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-[#7c3aed]/40"
            title="Run Code"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-medium">Run</span>
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