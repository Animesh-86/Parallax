import { useState, useEffect } from 'react';
import { PresenceCursor } from './PresenceCursor';

export function CodeEditor() {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  // Simulated code with syntax highlighting
  const codeLines = [
    { line: 1, content: 'import { useState, useEffect } from "react";', indent: 0 },
    { line: 2, content: 'import { CodeAstra } from "./lib/astra";', indent: 0 },
    { line: 3, content: '', indent: 0 },
    { line: 4, content: 'export default function CollabSpace() {', indent: 0 },
    { line: 5, content: '  const [users, setUsers] = useState([]);', indent: 1 },
    { line: 6, content: '  const [isConnected, setIsConnected] = useState(false);', indent: 1 },
    { line: 7, content: '', indent: 0 },
    { line: 8, content: '  useEffect(() => {', indent: 1 },
    { line: 9, content: '    // Connect to Astra collaboration server', indent: 2 },
    { line: 10, content: '    const astra = new CodeAstra({', indent: 2 },
    { line: 11, content: '      room: "project-alpha",', indent: 3 },
    { line: 12, content: '      onUserJoin: (user) => {', indent: 3 },
    { line: 13, content: '        setUsers(prev => [...prev, user]);', indent: 4 },
    { line: 14, content: '      }', indent: 3 },
    { line: 15, content: '    });', indent: 2 },
    { line: 16, content: '', indent: 0 },
    { line: 17, content: '    astra.connect();', indent: 2 },
    { line: 18, content: '    setIsConnected(true);', indent: 2 },
    { line: 19, content: '', indent: 0 },
    { line: 20, content: '    return () => astra.disconnect();', indent: 2 },
    { line: 21, content: '  }, []);', indent: 1 },
    { line: 22, content: '', indent: 0 },
    { line: 23, content: '  return <div>Connected: {isConnected}</div>', indent: 1 },
    { line: 24, content: '}', indent: 0 },
  ];

  // Simulated presence data
  const presenceUsers = [
    { id: 1, name: 'Alex Chen', color: '#0ea5e9', line: 13, avatar: 'AC' },
    { id: 2, name: 'Sarah Kim', color: '#7c3aed', line: 18, avatar: 'SK' },
  ];

  return (
    <div className="h-full bg-[#0a0a0a] flex relative">
      {/* Main editor area */}
      <div className="flex-1 overflow-auto font-mono text-sm">
        <div className="p-4">
          {codeLines.map((line) => {
            const hasPresence = presenceUsers.find(u => u.line === line.line);
            
            return (
              <div
                key={line.line}
                className="flex items-center group hover:bg-white/[0.03] transition-colors rounded"
                onMouseEnter={() => setHoveredLine(line.line)}
                onMouseLeave={() => setHoveredLine(null)}
              >
                {/* Line number */}
                <div className="w-12 text-right pr-4 text-white/30 select-none flex-shrink-0">
                  {line.line}
                </div>

                {/* Code content */}
                <div className="flex-1 relative">
                  <pre className="text-white/90">
                    <code dangerouslySetInnerHTML={{ __html: highlightSyntax(line.content) }} />
                  </pre>

                  {/* Live cursors */}
                  {hasPresence && (
                    <PresenceCursor
                      user={hasPresence}
                      showPopover={hoveredLine === line.line}
                    />
                  )}
                </div>

                {/* Presence avatars */}
                {hasPresence && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: hasPresence.color + '20',
                      border: `1px solid ${hasPresence.color}`,
                      color: hasPresence.color,
                    }}
                  >
                    {hasPresence.avatar}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimap */}
      <div className="w-24 bg-[#0f0f0f] border-l border-white/5 p-2">
        <div className="space-y-0.5">
          {codeLines.map((line) => (
            <div
              key={line.line}
              className={`h-1 rounded ${
                line.content.trim() ? 'bg-white/20' : 'bg-transparent'
              }`}
              style={{
                width: `${Math.min(line.content.length * 2, 100)}%`,
              }}
            />
          ))}
        </div>
        
        {/* Viewport indicator */}
        <div className="absolute top-2 right-2 w-20 h-32 border border-[#7c3aed]/30 rounded pointer-events-none" />
      </div>
    </div>
  );
}

// Simple syntax highlighting
function highlightSyntax(code: string): string {
  return code
    .replace(/(import|export|from|const|let|var|function|return|default|new|useEffect|useState)/g, '<span style="color: #7c3aed">$1</span>')
    .replace(/(".*?")/g, '<span style="color: #06b6d4">$1</span>')
    .replace(/(\/\/.*)/g, '<span style="color: #64748b">$1</span>')
    .replace(/(\d+)/g, '<span style="color: #0ea5e9">$1</span>');
}