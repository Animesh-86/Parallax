import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Smile, Send, Hash, Phone, Video, Headphones, X } from 'lucide-react';
import { ChatWebSocketClient, GenericChatMessage } from '../../services/wsChatClient';
import { useVoice } from '../../context/VoiceContext';
import { getAvatarInitials } from '../../services/userUtils';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface UnifiedChatPanelProps {
    contextId: string;
    channelId?: string;
    contextType: "PROJECT" | "TEAM";
    contextName?: string;
    wsClient: ChatWebSocketClient;
    onClose?: () => void;
}

export function UnifiedChatPanel({ contextId, channelId, contextType, contextName, wsClient, onClose }: UnifiedChatPanelProps) {
    const { joinCall } = useVoice();
    const [messages, setMessages] = useState<GenericChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

        wsClient.connect(contextId, contextType, handleNewMessage, handleHistory, channelId);

        return () => {
            wsClient.disconnect();
            setConnected(false);
        };
    }, [contextId, channelId, contextType, wsClient]);

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

    const toggleLocalReaction = (msgId: string, emoji: string) => {
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId && m.createdAt !== msgId) return m; // use createdAt as fallback id
            const currentReactions = m.reactions || [];
            const meIndex = currentReactions.findIndex(r => r.emojiCode === emoji && r.userId === 'local');
            
            let newReactions;
            if (meIndex >= 0) {
                newReactions = currentReactions.filter((_, idx) => idx !== meIndex);
            } else {
                newReactions = [...currentReactions, { id: 'temp', userId: 'local', emojiCode: emoji }];
            }
            return { ...m, reactions: newReactions };
        }));
    };

    return (
        <div className="flex-1 flex flex-col bg-[#09090B] h-full border border-white/5 rounded-2xl overflow-hidden">
            {/* Header */}
            {contextType === 'TEAM' ? (
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#D4AF37]/20">
                            <Hash className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{contextName || "Team"}</h3>
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
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => joinCall(contextId, "team", true, false)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37] text-xs font-medium transition-all"
                            title="Start Huddle"
                        >
                            <Headphones className="w-3.5 h-3.5" />
                            Huddle
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 bg-[#09090B] shrink-0">
                    <span className="text-xs font-semibold tracking-wide text-white/60">PROJECT CHAT</span>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => joinCall(contextId, "project", true, false)}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-emerald-500 transition-all"
                        >
                            <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => joinCall(contextId, "project", true, true)}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-[#D4AF37] transition-all"
                        >
                            <Video className="w-3.5 h-3.5" />
                        </button>
                        {onClose && (
                            <button onClick={onClose} className="ml-1 p-1.5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10" onClick={() => emojiPickerMsgId && setEmojiPickerMsgId(null)}>
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
                            const avatar = getAvatarInitials(msg.senderName);

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
                                        <div className="flex-1 min-w-0 relative">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-sm font-semibold text-[#D4AF37]">{msg.senderName}</span>
                                                <span className="text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-white/80 break-words whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                            
                                            {/* Reactions Display */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {Array.from(new Set(msg.reactions.map(r => r.emojiCode))).map(emoji => {
                                                        const count = msg.reactions!.filter(r => r.emojiCode === emoji).length;
                                                        const me = msg.reactions!.some(r => r.emojiCode === emoji && r.userId === 'local');
                                                        return (
                                                            <button 
                                                                key={emoji}
                                                                onClick={(e) => { e.stopPropagation(); toggleLocalReaction(msg.id || msg.createdAt || '', emoji); }}
                                                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs border transition-colors ${me ? 'bg-[#D4AF37]/20 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20'}`}
                                                            >
                                                                <span>{emoji}</span>
                                                                <span className="font-medium">{count}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Inline Emoji Picker Button */}
                                            <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(msg.id || msg.createdAt || null); }}
                                                    className="p-1.5 bg-[#121214] border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/10 shadow-lg"
                                                >
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                                
                                                {emojiPickerMsgId === (msg.id || msg.createdAt) && (
                                                    <div className="absolute right-0 top-8 z-50 shadow-2xl" onClick={e => e.stopPropagation()}>
                                                        <EmojiPicker 
                                                            theme={Theme.DARK} 
                                                            onEmojiClick={(e) => {
                                                                toggleLocalReaction(msg.id || msg.createdAt || '', e.emoji);
                                                                setEmojiPickerMsgId(null);
                                                            }} 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
            </div>

            {/* Message input */}
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
        </div>
    );
}
