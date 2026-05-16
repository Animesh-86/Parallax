import { useState } from 'react';
import { Terminal as TerminalIcon, X, ChevronUp, ChevronDown } from 'lucide-react';

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  output: string;
  exitCode: number | null;
}

export function Terminal({ isOpen, onToggle, output, exitCode }: TerminalProps) {
  const [activeTab, setActiveTab] = useState('terminal');
  const [height, setHeight] = useState(250);

  const tabs = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'problems', label: 'Problems', count: 0 },
    { id: 'output', label: 'Output' },
    { id: 'debug', label: 'Debug Console' },
  ];


  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-full h-8 bg-[#09090B] border-t border-white/5 hover:bg-[#0D0D0F] transition-colors flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white/90"
      >
        <TerminalIcon className="w-4 h-4" />
        Show Terminal
        <ChevronUp className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className="border-t border-white/5 bg-[#09090B] flex flex-col relative"
      style={{ height: `${height}px` }}
    >
      {/* Drag handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-[#D4AF37]/50 transition-colors group"
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
        <div className="w-full h-0.5 bg-[#D4AF37]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#09090B] border-b border-white/5">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${activeTab === tab.id
                  ? 'bg-[#09090B] text-white'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
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
      {/* Terminal content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {activeTab === 'terminal' && (
          <div className="space-y-2">
            {exitCode !== null && (
              <div className="text-xs text-white/60">
                Exit code:{" "}
                <span
                  className={
                    exitCode === 0
                      ? "text-[#4ADE80] font-semibold"
                      : "text-[#9A3412] font-semibold"
                  }
                >
                  {exitCode}
                </span>
              </div>
            )}

            <pre className="whitespace-pre-wrap text-sm text-[#4ADE80]">
              {output || "No output yet. Press Run to execute your code."}
            </pre>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="text-white/60 text-center py-8">
            No problems detected
          </div>
        )}

        {activeTab === 'output' && (
          <div className="text-white/60">
            <div>Use the Run button to see program output here.</div>
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
