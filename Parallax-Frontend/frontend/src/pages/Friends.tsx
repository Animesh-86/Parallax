import { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { Users, UserPlus, MessageCircle, Mail } from 'lucide-react';
import { CosmicStars } from "../components/workspace/CosmicStars";
import { DashboardHeader } from "../components/DashboardHeader";
import { collabApi } from '../services/collabApi';
import { useCollab } from '../context/CollaborationContext';

type Friend = {
    userId: string;
    name: string;
    email: string;
    status: 'online' | 'offline';
    avatar: string;
    color: string;
    avatarUrl?: string;
};

export default function Friends() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);

    // Helpers (Reused)
    const getColor = (str: string) => {
        const colors = ['#38BDF8', '#94A3B8', '#94A3B8', '#7DD3FC', '#F472B6', '#1E293B'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
        return colors[hash % colors.length];
    };
    const getAvatar = (email: string) => email.substring(0, 2).toUpperCase();

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            let myId = "";
            if (token) {
                const decoded: any = jwtDecode(token);
                myId = decoded.userId || decoded.sub;
            }

            // Fetch recent projects first
            // Note: Ideally we'd have a specific /friends API, but we're aggregating from projects as per Dashboard logic
            const res = await fetch("http://localhost:8080/api/projects", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return; // Handle quietly on this page for now

            const projects = await res.json();
            // Sort by updated/created
            projects.sort((a: any, b: any) => {
                const dA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const dB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return dB - dA;
            });

            const projectsToCheck = projects.slice(0, 10); // Check top 10 projects

            const uniqueFriends = new Map<string, Friend>();

            for (const project of projectsToCheck) {
                try {
                    const collabs = await collabApi.getProjectCollaborators(project.id);
                    collabs.forEach(c => {
                        // FIX: Only show ACCEPTED collaborators as friends
                        console.log("Checking friend candidate:", c.email || c.username, "Status:", c.status);
                        if (c.status !== 'ACCEPTED') return;

                        const realId = c.id || c.userId || c.email || c.nameOrEmail;
                        if (realId && realId !== myId && !uniqueFriends.has(realId)) {
                            // Robust name derivation
                            const pAny = c as any;
                            // Check all possible fields from backend (User entity has fullName/username, Profile has displayName)
                            let rawName = c.name || c.fullName || c.displayName || c.username || pAny.username;

                            // If no explicit name fields, check nameOrEmail
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

                            // Determine email for display/avatar
                            const displayEmail = c.email || (c.nameOrEmail && c.nameOrEmail.includes('@') ? c.nameOrEmail : "") || "User";

                            uniqueFriends.set(realId, {
                                userId: realId,
                                email: displayEmail,
                                name: displayName,
                                status: 'offline',
                                avatar: getAvatar(displayEmail),
                                color: getColor(displayEmail),
                                avatarUrl: c.avatarUrl
                            });
                        }
                    });
                } catch (e) {
                    // Ignore project errors
                }
            }
            setFriends(Array.from(uniqueFriends.values()));

        } catch (error) {
            console.error("Error loading friends", error);
        } finally {
            setLoading(false);
        }
    };

    const { lastUpdate } = useCollab();

    useEffect(() => {
        fetchFriends();
    }, [lastUpdate]);

    return (
        <main className="pt-24 pb-16 px-6 max-w-[1200px] mx-auto relative z-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Friends & Collaborators</h1>
                    <p className="text-white/50">People you have coded with recently</p>
                </div>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Add Friend
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-white/40">Loading network...</div>
            ) : friends.length === 0 ? (
                <div className="bg-[#060910] border border-white/5 rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                    <div className="text-white/40 font-medium text-lg">No friends found yet</div>
                    <div className="text-sm text-white/20">Collaborate in projects to add friends automatically</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => {
                        return (
                            <div
                                key={friend.userId || friend.email}
                                className="bg-[#060910] border border-white/5 rounded-2xl p-5 hover:border-[#F472B6]/30 transition-all duration-300 group hover:shadow-xl hover:shadow-[#F472B6]/5"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {friend.avatarUrl ? (
                                                <img
                                                    src={friend.avatarUrl}
                                                    alt={friend.name}
                                                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                                                />
                                            ) : (
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg uppercase"
                                                    style={{ backgroundColor: `${friend.color}20`, color: friend.color }}
                                                >
                                                    {friend.avatar}
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#060910] ${friend.status === 'online' ? 'bg-[#4ADE80]' : 'bg-[#64748B]'}`} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white/90">
                                                {friend.name}
                                            </div>
                                            <div className="text-xs text-white/40 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {friend.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                                        <MessageCircle className="w-4 h-4 text-white/60" />
                                        Message
                                    </button>
                                    <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white">
                                        <Users className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
