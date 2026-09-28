import { Play, Pause, Square, ChevronRight, ChevronDown, Bug, Trash2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface DebugVariable {
  name: string;
  value: string;
  type?: string;
}

interface DebugFrame {
  id: number;
  name: string;
  line: number;
  source?: {
    path: string;
    name?: string;
  };
}

interface DebuggerPanelProps {
  activeFile: string | null;
  language: string | undefined;
  debugState: 'inactive' | 'running' | 'paused';
  allBreakpoints: Record<string, number[]>;
  variables: Record<string, DebugVariable[]>; // Keyed by scope name (e.g., 'Locals')
  callStack: DebugFrame[];
  onStartDebug: () => void;
  onStopDebug: () => void;
  onContinue: () => void;
  onPause: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onToggleBreakpoint: (filePath: string, line: number) => void;
  onSelectFrame: (frameId: number) => void;
  onClose: () => void;
}

export function DebuggerPanel({
  activeFile,
  language,
  debugState,
  allBreakpoints,
  variables,
  callStack,
  onStartDebug,
  onStopDebug,
  onContinue,
  onPause,
  onStepOver,
  onStepInto,
  onStepOut,
  onToggleBreakpoint,
  onSelectFrame,
  onClose
}: DebuggerPanelProps) {
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({
    variables: true,
    callstack: true,
    breakpoints: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasBreakpoints = Object.values(allBreakpoints).some(lines => lines.length > 0);
  const isPython = language?.toLowerCase() === 'python';

  return (
    <div className="flex flex-col h-full w-full bg-[#09090B] text-white">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-semibold tracking-wide text-white/60">RUN AND DEBUG</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded text-white/40 hover:text-white">
          <span className="text-xs">Close</span>
        </button>
      </div>

      {/* Debug Control Toolbar */}
      <div className="p-2 border-b border-white/5 bg-[#121214] flex gap-1 justify-center items-center">
        {debugState === 'inactive' ? (
          <button
            onClick={onStartDebug}
            disabled={!activeFile || !isPython}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 border border-[#D4AF37]/50 disabled:opacity-40 disabled:hover:bg-[#D4AF37]/20 text-white rounded text-xs font-medium w-full justify-center transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
            Start Debugging (Python)
          </button>
        ) : (
          <div className="flex gap-2 w-full justify-around">
            {debugState === 'paused' ? (
              <button onClick={onContinue} className="p-1.5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 rounded transition-colors" title="Continue (F5)">
                <Play className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button onClick={onPause} className="p-1.5 hover:bg-white/10 text-amber-400 hover:text-amber-300 rounded transition-colors" title="Pause">
                <Pause className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={onStepOver}
              disabled={debugState !== 'paused'}
              className="p-1.5 hover:bg-white/10 text-blue-400 hover:text-blue-300 disabled:opacity-30 rounded transition-colors"
              title="Step Over (F10)"
            >
              {/* Step Over Custom representation: arrow over bar */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5v14" />
              </svg>
            </button>

            <button
              onClick={onStepInto}
              disabled={debugState !== 'paused'}
              className="p-1.5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 rounded transition-colors"
              title="Step Into (F11)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6H5" />
              </svg>
            </button>

            <button
              onClick={onStepOut}
              disabled={debugState !== 'paused'}
              className="p-1.5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 rounded transition-colors"
              title="Step Out (Shift+F11)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19h14" />
              </svg>
            </button>

            <button onClick={onStopDebug} className="p-1.5 hover:bg-[#EF6461]/20 text-[#EF6461] rounded transition-colors" title="Stop (Shift+F5)">
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        )}
      </div>

      {!isPython && debugState === 'inactive' && (
        <div className="p-4 flex flex-col items-center justify-center text-center gap-3 text-white/40 flex-1">
          <ShieldAlert className="w-8 h-8 text-amber-500/60" />
          <span className="text-xs leading-relaxed max-w-[200px]">
            Debugging is currently only configured for **Python (.py)** files. Please open a Python file to start debugging.
          </span>
        </div>
      )}

      {/* Main Content Areas */}
      {isPython && (
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {/* VARIABLES */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('variables')}
              className="flex items-center gap-1.5 px-3 py-1.5 w-full bg-white/[0.01] hover:bg-white/[0.03] text-left text-xs font-semibold text-white/50 border-b border-white/5"
            >
              {expandedSection.variables ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              VARIABLES
            </button>
            {expandedSection.variables && (
              <div className="px-4 py-2 text-xs font-mono max-h-60 overflow-y-auto space-y-1.5">
                {Object.keys(variables).length === 0 || Object.values(variables).every(v => v.length === 0) ? (
                  <span className="text-white/30 italic block">Not paused / No variables</span>
                ) : (
                  Object.entries(variables).map(([scope, vars]) => (
                    <div key={scope} className="space-y-1">
                      <div className="text-white/40 font-semibold text-[10px] tracking-wide mt-1 uppercase">{scope}</div>
                      {vars.map(v => (
                        <div key={v.name} className="flex justify-between pl-2">
                          <span className="text-blue-300">{v.name}</span>
                          <span className="text-[#D4AF37]/90 max-w-[60%] truncate text-right" title={v.value}>{v.value}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* CALL STACK */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('callstack')}
              className="flex items-center gap-1.5 px-3 py-1.5 w-full bg-white/[0.01] hover:bg-white/[0.03] text-left text-xs font-semibold text-white/50 border-b border-white/5"
            >
              {expandedSection.callstack ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              CALL STACK
            </button>
            {expandedSection.callstack && (
              <div className="py-1 text-xs font-mono max-h-48 overflow-y-auto">
                {callStack.length === 0 ? (
                  <span className="px-4 py-2 text-white/30 italic block">Not debugging</span>
                ) : (
                  callStack.map((frame, index) => (
                    <button
                      key={frame.id}
                      onClick={() => onSelectFrame(frame.id)}
                      className={`px-4 py-1.5 w-full text-left flex justify-between items-center hover:bg-white/5 ${index === 0 ? 'bg-[#D4AF37]/10 text-white font-medium border-l-2 border-[#D4AF37]' : 'text-white/60'}`}
                    >
                      <span className="truncate max-w-[70%]">{frame.name}</span>
                      <span className="text-white/40 text-[10px]">{frame.source?.name || 'unknown'}:{frame.line}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* BREAKPOINTS */}
          <div className="flex flex-col">
            <button
              onClick={() => toggleSection('breakpoints')}
              className="flex items-center gap-1.5 px-3 py-1.5 w-full bg-white/[0.01] hover:bg-white/[0.03] text-left text-xs font-semibold text-white/50 border-b border-white/5"
            >
              {expandedSection.breakpoints ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              BREAKPOINTS
            </button>
            {expandedSection.breakpoints && (
              <div className="py-1 text-xs font-mono max-h-48 overflow-y-auto">
                {!hasBreakpoints ? (
                  <span className="px-4 py-2 text-white/30 italic block">No breakpoints set</span>
                ) : (
                  Object.entries(allBreakpoints).map(([file, lines]) =>
                    lines.map(line => (
                      <div key={`${file}:${line}`} className="px-4 py-1.5 flex justify-between items-center group hover:bg-white/5">
                        <div className="flex items-center gap-2 truncate max-w-[80%]">
                          <span className="w-2 h-2 bg-red-600 rounded-full shrink-0" />
                          <span className="text-white/70 truncate">{file.split('/').pop()}</span>
                          <span className="text-white/40 text-[10px]">Line {line}</span>
                        </div>
                        <button
                          onClick={() => onToggleBreakpoint(file, line)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 text-white/40 transition-all"
                          title="Remove Breakpoint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
