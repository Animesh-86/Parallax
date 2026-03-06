import { useState } from 'react';
import { MessageSquare, Smile, FileCode, Send, Hash } from 'lucide-react';

export function ChatPanel() {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'reactions', label: 'Reactions', icon: Smile },
  ];

  const messages = [
    {
      id: 1,
      user: 'Alex Chen',
      avatar: 'AC',
      color: '#2BCBFF',
      time: '10:23 AM',
      content: 'Hey, can you check line 13? I think we need to handle the error case there.',
    },
    {
      id: 2,
      user: 'You',
      avatar: 'YO',
      color: '#B043FF',
      time: '10:24 AM',
      content: 'Good catch! Let me add that.',
    },
    {
      id: 3,
      user: 'Sarah Kim',
      avatar: 'SK',
      color: '#3DF6FF',
      time: '10:25 AM',
      content: 'Also, I\'ve pushed the new UI components to the repo.',
      hasCode: true,
    },
  ];

  const reactions = [
    { emoji: '👍', count: 5, active: true },
    { emoji: '🎉', count: 3, active: false },
    { emoji: '🚀', count: 8, active: true },
    { emoji: '💡', count: 2, active: false },
    { emoji: '🔥', count: 6, active: false },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f0f]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c3aed] to-[#0ea5e9]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' ? (
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="group">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 border"
                    style={{
                      backgroundColor: `${msg.color}20`,
                      borderColor: msg.color,
                      color: msg.color,
                    }}
                  >
                    {msg.avatar}
                  </div>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm text-white/90">{msg.user}</span>
                      <span className="text-xs text-white/40">{msg.time}</span>
                    </div>
                    <div className="text-sm text-white/80">{msg.content}</div>

                    {/* Code snippet indicator */}
                    {msg.hasCode && (
                      <div className="mt-2 p-3 bg-[#1a1a1a] rounded-lg border border-white/10 hover:border-[#0ea5e9]/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <FileCode className="w-4 h-4" />
                          <span>components/Header.tsx</span>
                          <span className="text-[#0ea5e9]">→ Jump to line 42</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Reactions tab */
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${
                    reaction.active
                      ? 'bg-gradient-to-br from-[#7c3aed]/20 to-[#0ea5e9]/20 border-[#0ea5e9]/50'
                      : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">{reaction.emoji}</div>
                  <div className="text-xs text-white/60">{reaction.count}</div>
                </button>
              ))}
            </div>

            {/* Quick reactions info */}
            <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-white/10">
              <div className="text-xs text-white/60 mb-2">Recent Activity</div>
              <div className="space-y-2">
                <div className="text-xs text-white/80">
                  <span className="text-[#0ea5e9]">Alex Chen</span> reacted with 🚀
                </div>
                <div className="text-xs text-white/80">
                  <span className="text-[#06b6d4]">Sarah Kim</span> reacted with 👍
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message input (only for chat tab) */}
      {activeTab === 'chat' && (
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white/90 placeholder-white/40 focus:outline-none focus:border-[#7c3aed]/50 transition-colors"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && message.trim()) {
                  setMessage('');
                }
              }}
            />
            
            {/* Quick action buttons */}
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Hash className="w-4 h-4 text-white/60" />
            </button>
            
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <FileCode className="w-4 h-4 text-white/60" />
            </button>

            <button
              disabled={!message.trim()}
              className="p-2 bg-gradient-to-r from-[#7c3aed] to-[#0ea5e9] rounded-xl transition-all hover:shadow-lg hover:shadow-[#7c3aed]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}