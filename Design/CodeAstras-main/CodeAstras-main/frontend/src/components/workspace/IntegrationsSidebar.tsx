import { GitBranch, Play, Puzzle, Settings, Sparkles } from 'lucide-react';

export function IntegrationsSidebar() {
  const integrations = [
    { icon: GitBranch, label: 'Git', active: false },
    { icon: Play, label: 'Run', active: false },
    { icon: Puzzle, label: 'Extensions', active: false },
    { icon: Sparkles, label: 'AI Assist', active: true },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <div className="w-16 bg-[#0f0f0f] border-r border-white/5 flex flex-col items-center py-4 gap-4">
      {integrations.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group relative ${
              item.active
                ? 'bg-gradient-to-br from-[#7c3aed]/20 to-[#0ea5e9]/20 text-[#0ea5e9] shadow-lg shadow-[#7c3aed]/20'
                : 'hover:bg-white/10 text-white/60 hover:text-white'
            }`}
            title={item.label}
          >
            <Icon className="w-5 h-5" />
            {item.active && (
              <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#7c3aed] to-[#0ea5e9] rounded-r" />
            )}
          </button>
        );
      })}
    </div>
  );
}