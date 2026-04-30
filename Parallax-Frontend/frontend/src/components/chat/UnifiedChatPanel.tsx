import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Smile, Send, Hash } from 'lucide-react';
import { ChatWebSocketClient, GenericChatMessage } from '../../services/wsChatClient';

interface UnifiedChatPanelProps {
    contextId: string;
    contextType: "PROJECT" | "TEAM";
    contextName?: string;
    wsClient: ChatWebSocketClient;
}

export function UnifiedChatPanel({ contextId, contextType, contextName, wsClient }: UnifiedChatPanelProps) {
    const [activeTab, setActiveTab] = useState('chat');
    const [messages, setMessages] = useState<GenericChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        if (!contextId) return;

        const handleNewMessage = (msg: GenericChatMessage) => {
            setMessages((prev) => [...prev, msg]);
            setConnected(true);
        };

        const handleHistory = (history: GenericChatMessage[]) => {
            setMessages([...history].reverse());
            setConnected(true);
        };

        wsClient.connect(contextId, contextType, handleNewMessage, handleHistory);

        return () => {
            wsClient.disconnect();
            setConnected(false);
        };
    }, [contextId, contextType, wsClient]);

    const handleSend = () => {
        if (!input.trim()) return;
        wsClient.sendMessage(input.trim());
        setInput('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (ts?: string) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex-1 flex flex-col bg-[#09090B] h-full border border-white/5 rounded-2xl overflow-hidden">
            {/* Header */}
            {contextType === 'TEAM' ? (
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
                    <div className="p-2 rounded-lg bg-[#D4AF37]/20">
                        <Hash className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{contextName || "Team"} — General</h3>
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
            ) : (
                <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 bg-[#09090B] shrink-0">
                    <span className="text-xs font-semibold tracking-wide text-white/60">PROJECT CHAT</span>
                </div>
            )}

            {/* Tab bar (Optional: hide for teams if not wanted, but keeping unified is better) */}
            <div className="flex items-center border-b border-white/5 shrink-0">
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
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {activeTab === 'chat' ? (
                    <div className="p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center mt-10">
                                <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
                                <p className="text-white/30 text-sm">No messages yet</p>
                                <p className="text-white/20 text-xs mt-1">Start the conversation!</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isSystem = msg.type === "SYSTEM";

                            if (isSystem) {
                                return (
                                    <div key={msg.id || idx} className="flex justify-center my-2">
                                        <div className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full italic">
                                            {msg.content}
                                        </div>
                                    </div>
                                )
                            }

                            const colorHash = msg.senderName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                            const colors = ['#D4AF37', '#D4AF37', '#D4AF37', '#EF6461', '#4ADE80'];
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
                                                <span className="text-sm font-semibold text-[#D4AF37]">{msg.senderName}</span>
                                                <span className="text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-white/80 break-words whitespace-pre-wrap leading-relaxed">{msg.content}</div>
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

            {/* Message input */}
            {activeTab === 'chat' && (
                <div className="p-3 border-t border-white/5 shrink-0 bg-[#09090B]">
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10 focus-within:border-[#D4AF37]/40 transition-colors">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={contextType === 'TEAM' && contextName ? `Message #${contextName.toLowerCase().replace(/\s+/g, '-')}` : "Type a message..."}
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
            )}
        </div>
    );
}
