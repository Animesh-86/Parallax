import { useState, useEffect, useRef } from 'react';
import { jwtDecode } from "jwt-decode";
import { Users, UserPlus, MessageCircle, Mail, Search, Send, MoreVertical, Hash, AtSign } from 'lucide-react';
import { collabApi } from '../services/collabApi';
import { useCollab } from '../context/CollaborationContext';
import { apiBaseUrl } from '../services/env';
import { useLocation } from 'react-router-dom';
import { directChatWsClient, GenericChatMessage } from '../services/wsChatClient';

type Friend = {
    userId: string;
    name: string;
    email: string;
    status: 'online' | 'offline' | 'pending';
    avatar: string;
    color: string;
    avatarUrl?: string;
};

export default function Friends() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [messages, setMessages] = useState<GenericChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [currentUserName, setCurrentUserName] = useState<string>("");
    
    const location = useLocation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helpers
    const getColor = (str: string) => {
        const colors = ['#D4AF37', '#A1A1AA', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
        return colors[hash % colors.length];
    };
    const getAvatar = (email: string) => email.substring(0, 2).toUpperCase();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            let myId = "";
            let myName = "";
            if (token) {
                const decoded: any = jwtDecode(token);
                myId = decoded.userId || decoded.sub;
                myName = decoded.fullName || decoded.username || "Me";
                setCurrentUserId(myId);
                setCurrentUserName(myName);
            }

            const res = await fetch(`${apiBaseUrl}/api/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;

            const projects = await res.json();
            const uniqueFriends = new Map<string, Friend>();

            for (const project of projects) {
                try {
                    const collabs = await collabApi.getProjectCollaborators(project.id);
                    collabs.forEach(c => {
                        // Include all collaborators regardless of status to match Dashboard logic
                        // if (c.status !== 'ACCEPTED') return;

                        const realId = c.id || c.userId || c.email || c.nameOrEmail;
                        if (realId && realId !== myId && !uniqueFriends.has(realId)) {
                            // Robust name derivation
                            const pAny = c as any;
                            let rawName = c.name || c.fullName || c.displayName || c.username || pAny.username;

                            if (!rawName && c.nameOrEmail) {
                                if (!c.nameOrEmail.includes('@')) {
                                    rawName = c.nameOrEmail;
                                } else {
                                    rawName = c.nameOrEmail.split('@')[0];
                                }
                            }

                            if (!rawName && c.email) rawName = c.email.split('@')[0];
                            if (!rawName) rawName = "User";
                            
                            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                            const displayEmail = c.email || (c.nameOrEmail && c.nameOrEmail.includes('@') ? c.nameOrEmail : "") || "";

                            uniqueFriends.set(realId, {
                                userId: realId,
                                email: displayEmail,
                                name: displayName,
                                status: c.status === 'PENDING' ? 'pending' : (c.isOnline || (c as any).online ? 'online' : 'offline'),
                                avatar: getAvatar(displayEmail || displayName),
                                color: getColor(displayEmail || displayName),
                                avatarUrl: c.avatarUrl
                            });
                        }
                    });
                } catch (e) {}
            }
            const friendsList = Array.from(uniqueFriends.values());
            setFriends(friendsList);

            // Handle selection from navigation state
            const state = location.state as { selectedFriendId?: string };
            if (state?.selectedFriendId) {
                const friend = friendsList.find(f => f.userId === state.selectedFriendId);
                if (friend) {
                    setSelectedFriend(friend);
                }
            }

        } catch (error) {
            console.error("Error loading friends", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChatHistory = async (friendId: string) => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${apiBaseUrl}/api/chat/direct/${friendId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching chat history", error);
        }
    };

    useEffect(() => {
        fetchFriends();
        
        // Poll for status updates every 30s to keep presence relatively fresh
        const interval = setInterval(fetchFriends, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle selection when location state changes
    useEffect(() => {
        const state = location.state as { selectedFriendId?: string };
        if (state?.selectedFriendId && friends.length > 0) {
            const friend = friends.find(f => f.userId === state.selectedFriendId);
            if (friend) {
                setSelectedFriend(friend);
            }
        }
    }, [location.state, friends]);

    useEffect(() => {
        if (selectedFriend) {
            setMessages([]);
            fetchChatHistory(selectedFriend.userId);
            
            // Connect WebSocket
            directChatWsClient.connect(
                selectedFriend.userId,
                "DIRECT",
                (msg) => {
                    // Only add if it belongs to the current conversation
                    if (msg.senderId === selectedFriend.userId || msg.senderId === currentUserId) {
                        setMessages(prev => [...prev, msg]);
                    }
                },
                (history) => {
                    // History is handled by REST call for initial load, 
                    // but we can use this if needed.
                }
            );
        }

        return () => {
            // We might not want to disconnect every time if we want background notifications,
            // but for this UI, we'll keep it simple.
            directChatWsClient.disconnect();
        };
    }, [selectedFriend]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedFriend) return;

        directChatWsClient.sendMessage(newMessage, selectedFriend.userId);
        setNewMessage("");
    };

    const filteredFriends = friends.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#09090B] overflow-hidden">
            {/* Left Sidebar - Friends List */}
            <aside className="w-80 border-r border-white/5 flex flex-col bg-[#09090B] relative z-20">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white/90">Friends</h2>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white">
                        <UserPlus className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#D4AF37] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find or start a conversation" 
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                    {loading ? (
                        <div className="p-4 text-center text-white/30 text-sm">Loading friends...</div>
                    ) : filteredFriends.length === 0 ? (
                        <div className="p-4 text-center text-white/30 text-sm">
                            {searchQuery ? "No results found" : "No friends yet"}
                        </div>
                    ) : (
                        filteredFriends.map(friend => (
                            <button
                                key={friend.userId}
                                onClick={() => setSelectedFriend(friend)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                                    selectedFriend?.userId === friend.userId 
                                    ? 'bg-white/10 text-white shadow-lg shadow-black/20' 
                                    : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                                }`}
                            >
                                <div className="relative">
                                    {friend.avatarUrl ? (
                                        <img src={friend.avatarUrl} alt={friend.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                    ) : (
                                        <div 
                                            className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm"
                                            style={{ backgroundColor: `${friend.color}20`, color: friend.color }}
                                        >
                                            {friend.avatar}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#09090B] ${
                                        friend.status === 'online' ? 'bg-emerald-500' : 
                                        friend.status === 'pending' ? 'bg-[#F59E0B]' : 'bg-zinc-600'
                                    }`} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-medium truncate">{friend.name}</div>
                                    <div className="text-[10px] opacity-40 truncate">
                                        {friend.status === 'online' ? 'Online' : 
                                         friend.status === 'pending' ? 'Invitation Pending' : 'Offline'}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Current User Bar (Discord-like) */}
                <div className="p-3 bg-[#0c0c0e] border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-xs uppercase">
                        {currentUserName.substring(0, 2)}
                    </div>
                    <div className="flex-1 truncate">
                        <div className="text-sm font-semibold text-white/90 truncate">{currentUserName}</div>
                        <div className="text-[10px] text-white/40 truncate">#{currentUserId.substring(0, 4)}</div>
                    </div>
                </div>
            </aside>

            {/* Right Panel - Chat Area */}
            <main className="flex-1 flex flex-col bg-[#09090B] relative overflow-hidden">
                {!selectedFriend ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle className="w-12 h-12 text-white/10" />
                        </div>
                        <h3 className="text-xl font-bold text-white/80 mb-2">Select a Friend</h3>
                        <p className="text-white/40 max-w-xs">Start a conversation with your collaborators. Share ideas, code, and more.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <AtSign className="w-5 h-5 text-white/30" />
                                <div className="font-bold text-white/90">{selectedFriend.name}</div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
                                <span className="text-xs text-white/30 font-medium">Online</span>
                            </div>
                            <div className="flex items-center gap-4 text-white/40">
                                <button className="hover:text-white transition-colors"><Users className="w-5 h-5" /></button>
                                <button className="hover:text-white transition-colors"><Mail className="w-5 h-5" /></button>
                                <div className="w-px h-6 bg-white/10 mx-2" />
                                <button className="hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </header>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* History Start Marker */}
                            <div className="flex flex-col items-start pt-10 pb-8 border-b border-white/5 mb-8">
                                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-3xl font-bold mb-4">
                                    {selectedFriend.avatar}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedFriend.name}</h2>
                                <p className="text-white/40">This is the beginning of your direct message history with <span className="text-white/60 font-medium">@{selectedFriend.name}</span>.</p>
                            </div>

                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUserId;
                                return (
                                    <div key={idx} className="group flex items-start gap-4 hover:bg-white/5 -mx-6 px-6 py-2 transition-colors">
                                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                                            isMe ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/10 text-white/60'
                                        }`}>
                                            {msg.senderName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-bold text-sm ${isMe ? 'text-[#D4AF37]' : 'text-white/90'}`}>
                                                    {msg.senderName}
                                                </span>
                                                <span className="text-[10px] text-white/20">
                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-white/80 leading-relaxed break-words whitespace-pre-wrap">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-6 pt-2">
                            <form 
                                onSubmit={handleSendMessage}
                                className="relative flex items-center"
                            >
                                <input 
                                    type="text" 
                                    placeholder={`Message @${selectedFriend.name}`}
                                    className="w-full bg-[#121214] border border-white/5 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:border-[#D4AF37]/30 transition-all text-white/90 placeholder:text-white/20 shadow-2xl"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-4 p-2 bg-[#D4AF37] hover:bg-[#B8962E] disabled:bg-white/5 disabled:text-white/10 text-black rounded-xl transition-all shadow-lg"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                            <div className="mt-3 flex items-center gap-4 text-[10px] text-white/20 font-medium uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><Hash className="w-3 h-3" /> Code Snippet</span>
                                <span className="flex items-center gap-1.5"><AtSign className="w-3 h-3" /> Mention</span>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
