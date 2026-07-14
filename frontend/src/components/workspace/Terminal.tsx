import { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { wsBaseUrl } from '../../services/env';

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  output: string;
  exitCode: number | null;
  projectId?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Terminal({ isOpen, onToggle, output, exitCode, projectId, activeTab, onTabChange }: TerminalProps) {
  const [internalTab, setInternalTab] = useState(activeTab || 'terminal');
  const [height, setHeight] = useState(250);

  useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const tabs = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'problems', label: 'Problems', count: 0 },
    { id: 'output', label: 'Output' },
    { id: 'debug', label: 'Debug Console' },
  ];

  // Initialize xterm
  useEffect(() => {
    if (!isOpen || internalTab !== 'terminal' || !terminalRef.current || !projectId) return;

    if (!xtermRef.current) {
      const term = new XTerm({
        theme: {
          background: '#09090B',
          foreground: '#A1A1AA',
          cursor: '#D4AF37',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        cursorBlink: true,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();
      xtermRef.current = term;

      const token = localStorage.getItem("access_token");
      const ws = new WebSocket(`${wsBaseUrl}/ws/terminal/${projectId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        term.writeln('\x1b[1;32m[Parallax Interactive Terminal Attached]\x1b[0m');
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onclose = () => {
        term.writeln('\r\n\x1b[1;31m[Terminal Disconnected]\x1b[0m');
      };

      term.onData(data => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      const handleResize = () => {
        fitAddon.fit();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        ws.close();
        term.dispose();
        xtermRef.current = null;
      };
    }
  }, [isOpen, internalTab, projectId]);

  // Adjust xterm on resize
  useEffect(() => {
    if (xtermRef.current) {
      // Small delay to allow container layout to update
      setTimeout(() => {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }, 50);
    }
  }, [height, internalTab, isOpen]);


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
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${internalTab === tab.id
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

      <div className="flex-1 overflow-auto p-4 font-mono text-sm relative">
        {internalTab === 'terminal' && (
          <div className="absolute inset-0 p-2" ref={terminalRef} />
        )}

        {internalTab === 'output' && (
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

        {internalTab === 'problems' && (
          <div className="text-white/60 text-center py-8">
            No problems detected
          </div>
        )}


        {internalTab === 'debug' && (
          <div className="text-white/60 text-center py-8">
            Debug console ready. Start debugging to see output.
          </div>
        )}
      </div>

    </div>
  );
}
