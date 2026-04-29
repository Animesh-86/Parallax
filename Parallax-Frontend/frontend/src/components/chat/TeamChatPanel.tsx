import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Hash } from 'lucide-react';
import { teamChatWs, TeamChatMessage } from '../../services/wsTeamChat';

interface TeamChatPanelProps {
  teamId: string;
  teamName: string;
}

export function TeamChatPanel({ teamId, teamName }: TeamChatPanelProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    teamChatWs.connect(
      teamId,
      (msg) => {
        setMessages(prev => [...prev, msg]);
        setConnected(true);
      },
      (history) => {
        setMessages(history.reverse());
        setConnected(true);
      }
    );

    return () => {
      teamChatWs.disconnect();
    };
  }, [teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    teamChatWs.sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#09090B] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-[#D4AF37]/20">
          <Hash className="w-4 h-4 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{teamName} — General</h3>
          <p className="text-xs text-white/40">
            {connected ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] inline-block" />
                Connected
              </span>
            ) : 'Connecting...'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-white/30 text-sm">No messages yet</p>
            <p className="text-white/20 text-xs mt-1">Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isSystem = msg.type === 'SYSTEM';
          return (
            <div key={msg.id || i} className={`${isSystem ? 'text-center' : ''}`}>
              {isSystem ? (
                <p className="text-xs text-white/30 italic">{msg.content}</p>
              ) : (
                <div className="group">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-[#D4AF37]">{msg.senderName}</span>
                    <span className="text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">{formatTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{msg.content}</p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10 focus-within:border-[#D4AF37]/40 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Message #${teamName.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </div>
  );
}
