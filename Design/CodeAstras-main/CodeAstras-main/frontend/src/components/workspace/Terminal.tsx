import { useState } from 'react';
import { Terminal as TerminalIcon, X, ChevronUp, ChevronDown } from 'lucide-react';

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Terminal({ isOpen, onToggle }: TerminalProps) {
  const [activeTab, setActiveTab] = useState('terminal');
  const [height, setHeight] = useState(250);

  const tabs = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'problems', label: 'Problems', count: 0 },
    { id: 'output', label: 'Output' },
    { id: 'debug', label: 'Debug Console' },
  ];

  const terminalOutput = [
    { type: 'prompt', content: '~/my-astro-app$' },
    { type: 'command', content: 'npm run dev' },
    { type: 'output', content: '' },
    { type: 'success', content: '> astra-app@1.0.0 dev' },
    { type: 'success', content: '> vite' },
    { type: 'output', content: '' },
    { type: 'info', content: '  VITE v5.0.0  ready in 324 ms' },
    { type: 'output', content: '' },
    { type: 'link', content: '  ➜  Local:   http://localhost:5173/' },
    { type: 'link', content: '  ➜  Network: use --host to expose' },
    { type: 'output', content: '' },
    { type: 'prompt', content: '~/my-astro-app$' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-0 left-0 right-0 h-8 bg-[#0f0f0f] border-t border-white/5 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white/90"
      >
        <TerminalIcon className="w-4 h-4" />
        Show Terminal
        <ChevronUp className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className="border-t border-white/5 bg-[#0a0a0a] flex flex-col relative"
      style={{ height: `${height}px` }}
    >
      {/* Drag handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-[#7c3aed]/50 transition-colors group"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startHeight = height;

          const handleMouseMove = (e: MouseEvent) => {
            const delta = startY - e.clientY;
            setHeight(Math.max(150, Math.min(600, startHeight + delta)));
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <div className="w-full h-0.5 bg-[#7c3aed]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f0f] border-b border-white/5">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#0a0a0a] text-white'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#7c3aed]/20 text-[#7c3aed] text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {activeTab === 'terminal' && (
          <div className="space-y-1">
            {terminalOutput.map((line, idx) => (
              <div
                key={idx}
                className={`${
                  line.type === 'prompt'
                    ? 'text-[#0ea5e9]'
                    : line.type === 'command'
                    ? 'text-white'
                    : line.type === 'success'
                    ? 'text-[#06b6d4]'
                    : line.type === 'info'
                    ? 'text-[#7c3aed]'
                    : line.type === 'link'
                    ? 'text-[#0ea5e9] hover:underline cursor-pointer'
                    : 'text-white/60'
                }`}
              >
                {line.content}
                {line.type === 'prompt' && (
                  <span className="ml-1 w-2 h-4 inline-block bg-[#0ea5e9] animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="text-white/60 text-center py-8">
            No problems detected
          </div>
        )}

        {activeTab === 'output' && (
          <div className="text-white/60">
            <div>[Extension Host] Debugger attached.</div>
            <div>[Extension Host] Waiting for connection...</div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="text-white/60">
            Debug console ready. Start debugging to see output.
          </div>
        )}
      </div>
    </div>
  );
}