import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Smile, Send } from 'lucide-react';
import { chatWs, ChatMessage } from '../../services/wsChat';

export function ChatPanel() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'reactions', label: 'Reactions', icon: Smile },
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to WebSocket
  useEffect(() => {
    if (!projectId) return;

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleHistory = (history: ChatMessage[]) => {
      setMessages([...history].reverse());
    };

    chatWs.connect(projectId, handleNewMessage, handleHistory);

    return () => {
      chatWs.disconnect();
    };
  }, [projectId]);

  const handleSend = () => {
    if (!input.trim()) return;
    chatWs.sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#060910] h-full">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 bg-[#060910]">
        <span className="text-xs font-semibold tracking-wide text-white/60">PROJECT CHAT</span>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-white/5 flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors relative ${activeTab === tab.id
                ? 'text-white'
                : 'text-white/60 hover:text-white/90'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'chat' ? (
          <div className="p-4 space-y-4">
            {messages.map((msg, idx) => {
              const isSystem = msg.type === "SYSTEM";
              const isMe = msg.senderName === localStorage.getItem("username");

              if (isSystem) {
                return (
                  <div key={msg.id || idx} className="flex justify-center my-2">
                    <div className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                      {msg.content}
                    </div>
                  </div>
                )
              }

              const colorHash = msg.senderName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const colors = ['#2DD4BF', '#38BDF8', '#2DD4BF', '#EF6461', '#4ADE80'];
              const userColor = colors[colorHash % colors.length];
              const avatar = msg.senderName.substring(0, 2).toUpperCase();

              return (
                <div key={msg.id || idx} className="group">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 border"
                      style={{
                        backgroundColor: `${userColor}20`,
                        borderColor: userColor,
                        color: userColor,
                      }}
                    >
                      {avatar}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm text-white/90">{msg.senderName}</span>
                        <span className="text-xs text-white/40">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="text-sm text-white/80 break-words whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="p-10 text-center text-white/40">
            Reactions coming soon...
          </div>
        )}
      </div>

      {/* Message input (only for chat tab) */}
      {activeTab === 'chat' && (
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-[#0C1220] border border-white/10 rounded-xl text-sm text-white/90 placeholder-white/40 focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-xl transition-all hover:shadow-lg hover:shadow-[#38BDF8]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}