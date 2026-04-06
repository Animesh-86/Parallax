import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
    BarChart3,
    Bell,
    Clock,
    Code2,
    Folder,
    History,
    MessageCircle,
    Play,
    Plus,
    Trash2,
    UserPlus,
    Users,
    Video,
    Zap
} from 'lucide-react';
import { CosmicStars } from "../components/workspace/CosmicStars";
import { QuickCreateModal } from "../components/modals/QuickCreateModal";
import { NotificationBell } from "../components/NotificationBell";
import { collabApi, Collaborator, MeetingRoom } from '../services/collabApi';
import { useCollab } from '../context/CollaborationContext';
import { DashboardHeader } from '../components/DashboardHeader';
import { CreateRoomModal } from '../components/modals/CreateRoomModal';
import { ProjectSkeleton, FriendSkeleton, RoomSkeleton } from '../components/DashboardSkeletons';
import { toast } from "sonner";
import { apiBaseUrl } from '../services/env';

type DashboardProject = {
    id: string;
    name: string;
    language: string;
    updatedAt: string;
};

// UI Type for Friend (Derived from Collaborator)
type Friend = {
    userId: string;
    name: string;
    email: string;
    status: 'online' | 'offline' | 'pending';
    avatar: string;
    color: string;
    avatarUrl?: string;
};



export default function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [projects, setProjects] = useState<DashboardProject[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projectsError, setProjectsError] = useState<string | null>(null);
    const [showAllProjects, setShowAllProjects] = useState(false);

    // Dynamic Rooms State
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);


    // Dynamic Friends State
    const [recentCollaborators, setRecentCollaborators] = useState<Friend[]>([]);
    const [loadingCollaborators, setLoadingCollaborators] = useState(false);

    // Helpers
    const getColor = (str: string) => {
        const colors = ['#38BDF8', '#94A3B8', '#94A3B8', '#7DD3FC', '#F472B6', '#1E293B'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
        return colors[hash % colors.length];
    };

    const getAvatar = (email: string) => email.substring(0, 2).toUpperCase();

    // --- RECENT ACCESS TRACKING ---
    const updateRecentAccess = (projectId: string) => {
        try {
            const raw = localStorage.getItem("recent_projects");
            const data = raw ? JSON.parse(raw) : {};
            data[projectId] = Date.now();
            localStorage.setItem("recent_projects", JSON.stringify(data));
        } catch (e) {
            console.error("Failed to update recent access", e);
        }
    };

    const getRecentAccess = (projectId: string): number => {
        try {
            const raw = localStorage.getItem("recent_projects");
            const data = raw ? JSON.parse(raw) : {};
            return data[projectId] || 0;
        } catch (e) {
            return 0;
        }
    };
    // ----------------------------

    // Fetch Friends (Aggregated from recent projects)
    const fetchRecentCollaborators = async (currentProjects: DashboardProject[]) => {
        try {
            setLoadingCollaborators(true);
            const token = localStorage.getItem("access_token");
            let myId = "";
            if (token) {
                const decoded: any = jwtDecode(token);
                myId = decoded.userId || decoded.sub;
            }

            const uniqueFriends = new Map<string, Friend>();

            // Check top 3 most recent projects for collaborators
            const projectsToCheck = currentProjects.slice(0, 5);

            for (const project of projectsToCheck) {
                try {
                    const collabs = await collabApi.getProjectCollaborators(project.id);
                    console.log(`[Dashboard] Collaborators for project ${project.id}:`, collabs); // DEBUG
                    collabs.forEach(c => {
                        // Exclude self and duplicates
                        // Use c.id (from debug) or c.userId (legacy) or c.email or c.nameOrEmail
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
                                status: c.status === 'PENDING' ? 'pending' : (c.isOnline || (c as any).online ? 'online' : 'offline'),
                                avatarUrl: c.avatarUrl,
                                avatar: getAvatar(displayEmail),
                                color: getColor(displayEmail),
                            });
                        }
                    });
                } catch (e) {
                    console.warn(`Failed to fetch collaborators for project ${project.id}`, e);
                }
            }

            setRecentCollaborators(Array.from(uniqueFriends.values()));

        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setLoadingCollaborators(false);
        }
    };

    const handleCreateProject = async (projectName: string, language: string) => {
        try {
            // 1️⃣ Log where we are
            console.log("🟢 Starting project creation...");
            console.log("📁 Project Name:", projectName);
            console.log("💬 Language:", language);

            // 2️⃣ Get token
            const token = localStorage.getItem("access_token");
            console.log("🔑 Retrieved token:", token ? token.slice(0, 30) + "..." : "❌ No token found");

            // 3️⃣ Check token presence
            if (!token) {
                alert("❌ No access token found in localStorage.\nPlease log in again.");
                throw new Error("User not authenticated");
            }

            // 4️⃣ Make request
            const res = await fetch(`${apiBaseUrl}/api/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: projectName,
                    language,
                }),
            });

            // 5️⃣ Check response status and log details
            console.log("📡 Response status:", res.status);
            console.log("📡 Response status text:", res.statusText);

            const text = await res.text(); // Read raw text to catch non-JSON errors
            console.log("📦 Raw response:", text);

            // Try parsing as JSON (only if valid JSON)
            let jsonResponse = null;
            try {
                jsonResponse = JSON.parse(text);
            } catch (err) {
                console.warn("⚠️ Response was not valid JSON");
            }

            // 6️⃣ Handle different cases clearly
            if (res.status === 401) {
                alert("🚫 Unauthorized (401): Your token may be invalid or expired.\n\n" +
                    "Try logging in again.\n\n" +
                    "Check console for backend response.");
                throw new Error("Unauthorized - token invalid/expired");
            } else if (res.status === 403) {
                alert("🚫 Forbidden (403): You are not allowed to create this project.");
                throw new Error("Forbidden - insufficient permissions");
            } else if (!res.ok) {
                alert(`❌ Failed to create project.\nStatus: ${res.status} ${res.statusText}`);
                throw new Error(`Request failed: ${res.statusText}`);
            }

            // 7️⃣ Success
            const created = jsonResponse || {};
            console.log("✅ Project created successfully:", created);

            updateRecentAccess(created.id); // 🔥 Update access time

            navigate(`/editor/${created.id}`);
        } catch (err: any) {
            // 8️⃣ Final catch-all with detailed console log
            console.error("🔥 Create project error (caught):", err);
            alert(`❌ Project creation failed.\n\n${err.message}`);
        }
    };


    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            setProjectsError(null);

            const token = localStorage.getItem("access_token");
            if (!token) {
                // Sillent failure or redirect? Dashboard is protected so token should exist
                console.error("No access token found in Dashboard");
                setProjectsError("No access token");
                return;
            }

            const res = await fetch(`${apiBaseUrl}/api/projects`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 401) {
                localStorage.removeItem("access_token");
                navigate("/login");
                return;
            }

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Failed to fetch projects (${res.status}): ${text}`);
            }

            const data = await res.json(); // this is List<ProjectResponse>

            // Map backend shape → UI shape
            const mapped: DashboardProject[] = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                language: p.language || "Unknown",
                updatedAt: p.updatedAt || p.updated_at || p.createdAt || p.created_at || "",
            }));

            // sort by newest (local access or server modification)
            mapped.sort((a, b) => {
                const aDate = new Date(a.updatedAt).getTime();
                const bDate = new Date(b.updatedAt).getTime();

                const aTime = Math.max(isNaN(aDate) ? 0 : aDate, getRecentAccess(a.id));
                const bTime = Math.max(isNaN(bDate) ? 0 : bDate, getRecentAccess(b.id));
                return bTime - aTime;
            });

            setProjects(mapped);

            // 🔥 POPULATE FRIENDS LIST
            fetchRecentCollaborators(mapped);

        } catch (err: any) {
            console.error("Fetch projects error:", err);
            setProjectsError(err.message || "Failed to fetch projects");
        } finally {
            setLoadingProjects(false);
        }
    };


    const { lastUpdate } = useCollab();

    const fetchRooms = async () => {
        try {
            setLoadingRooms(true);
            const myRooms = await collabApi.getActiveRooms();
            setRooms(myRooms);
        } catch (err) {
            console.error("Fetch rooms error:", err);
        } finally {
            setLoadingRooms(false);
        }
    };
    
    const handleCreateRoom = async (name: string, collaborationMode: 'INTERVIEW' | 'TEAM') => {
        const newRoom = await collabApi.createRoom(name, collaborationMode);
        // Refresh the rooms list in the background
        fetchRooms();
        // Return data so the modal can show step 2
        return { roomCode: newRoom.roomCode, name: newRoom.name };
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!window.confirm('Delete this room? This cannot be undone.')) return;
        try {
            await collabApi.deleteRoom(roomId);
            fetchRooms();
        } catch (err) {
            console.error('Delete room error:', err);
            toast.error('Failed to delete room');
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchRooms();
    }, [lastUpdate]);


    const teams: any[] = [];
    const createRoomButtonClass = "px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg text-sm hover:shadow-lg hover:shadow-[#38BDF8]/30 transition-all flex items-center gap-2";

    const projectsToShow = showAllProjects ? projects : projects.slice(0, 4);

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };


    return (
        <>
            {/* Main Content */}
            <main className="pt-24 pb-16 px-6 max-w-[1800px] mx-auto relative z-10">
                {/* Hero Panel */}
                <section className="mb-12">
                    <div
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1220] to-[#060910] border border-white/10 p-12">
                        {/* Holographic background effect */}
                        <div className="absolute inset-0 opacity-20">
                            <div
                                className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#38BDF8]/30 via-transparent to-[#94A3B8]/30" />
                            <div
                                className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#38BDF8] rounded-full blur-[100px]" />
                            <div
                                className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#94A3B8] rounded-full blur-[100px]" />
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex-1">
                                <h1 className="text-5xl font-bold mb-3 text-white">
                                    Welcome to Parallax
                                </h1>
                                <p className="text-xl text-white/60 mb-8">
                                    Your collaborative coding workspace in the cloud
                                </p>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIsCreateRoomModalOpen(true)}
                                        className={createRoomButtonClass}>
                                        <Plus className="w-4 h-4" />
                                        Create Room
                                    </button>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                                        <Folder className="w-5 h-5" />
                                        Create Project
                                    </button>
                                    <button
                                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Create Team
                                    </button>
                                </div>
                            </div>

                            {/* Decorative code visualization */}
                            <div className="hidden lg:block">
                                <div className="w-64 h-64 relative">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-[#38BDF8]/20 to-[#94A3B8]/20 rounded-2xl backdrop-blur-sm border border-white/10 p-6">
                                        <div className="space-y-3 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                                                <span className="text-white/40">const</span>
                                                <span className="text-[#94A3B8]">project</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="text-white/40">team:</span>
                                                <span className="text-[#94A3B8]">"collaborative"</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="text-white/40">status:</span>
                                                <span className="text-[#4ADE80]">"active"</span>
                                            </div>
                                            <div className="w-full h-px bg-white/10 my-3" />
                                            <div className="flex items-center gap-2">
                                                <Play className="w-3 h-3 text-[#94A3B8]" />
                                                <span className="text-white/40">Running...</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-[#38BDF8] to-[#94A3B8] rounded-2xl blur-2xl opacity-20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    {/* Your Projects Section */}
                    <section className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold flex items-center gap-3">
                                <Folder className="w-6 h-6 text-[#38BDF8]" />
                                Your Projects
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/my-projects')}
                                    className="px-3 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/5 rounded-lg transition"
                                >
                                    See all
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Project
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loadingProjects && (
                                <>
                                    <ProjectSkeleton />
                                    <ProjectSkeleton />
                                    <ProjectSkeleton />
                                    <ProjectSkeleton />
                                </>
                            )}

                            {projectsError && (
                                <div className="col-span-full text-center py-8 text-[#9A3412] bg-[#EF6461]/10 rounded-xl border border-[#EF6461]/20">
                                    Error loading projects: {projectsError}
                                </div>
                            )}

                            {!loadingProjects && !projectsError && projects.length === 0 && (
                                <div className="col-span-full text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                    <Folder className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/60">No projects yet</p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="mt-4 px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8] rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Create your first project
                                    </button>
                                </div>
                            )}

                            {projectsToShow.map(project => (
                                <div
                                    key={project.id}
                                    className="group relative bg-[#060910] border border-white/5 rounded-2xl p-6 hover:border-[#38BDF8]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#38BDF8]/10 cursor-pointer"
                                    onClick={() => {
                                        updateRecentAccess(project.id);
                                        navigate(`/editor/${project.id}`);
                                    }}
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-1 group-hover:text-[#38BDF8] transition-colors">{project.name}</h3>
                                                <span className="text-xs text-white/40 font-mono px-2 py-0.5 rounded bg-white/5">
                                                    {project.language}
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#38BDF8]/20 transition-colors">
                                                <Code2 className="w-4 h-4 text-white/40 group-hover:text-[#38BDF8]" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-6 text-xs text-white/40">
                                            <div className="flex items-center gap-1.5">
                                                <History className="w-3 h-3" />
                                                {formatDate(project.updatedAt)}
                                            </div>
                                            <div className="font-mono opacity-50">
                                                ID: {project.id.slice(0, 4)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Friends Section */}
                    {/* Friends Section - Dynamically populated from recent collaborators */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold flex items-center gap-3">
                                <Users className="w-6 h-6 text-[#94A3B8]" />
                                Friends
                            </h2>
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <UserPlus className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        <div className="bg-[#060910] border border-white/5 rounded-2xl p-4 space-y-2 min-h-[150px]">
                            {loadingCollaborators && (
                                <div className="space-y-2">
                                    <FriendSkeleton />
                                    <FriendSkeleton />
                                    <FriendSkeleton />
                                </div>
                            )}

                            {!loadingCollaborators && recentCollaborators.length === 0 && (
                                <div className="text-center text-white/40 text-sm py-8 space-y-2">
                                    <div className="opacity-50">No friends found yet</div>
                                    <div className="text-xs text-white/20">Collaborate in projects to add friends automatically</div>
                                </div>
                            )}

                            {!loadingCollaborators && recentCollaborators.map((friend) => {
                                // Fallback for Google Auth users who might not have a display name set yet
                                const displayName = friend.name || friend.email.split('@')[0];
                                const displayEmail = friend.email;

                                return (
                                    <div
                                        key={friend.userId || friend.email}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {friend.avatarUrl ? (
                                                    <img
                                                        src={friend.avatarUrl}
                                                        alt={displayName}
                                                        className="w-10 h-10 rounded-lg object-cover border border-white/10"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm uppercase"
                                                        style={{ backgroundColor: `${friend.color}20`, color: friend.color }}
                                                    >
                                                        {friend.avatar}
                                                    </div>
                                                )}
                                                <div
                                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#060910] ${friend.status === 'online' ? 'bg-[#4ADE80]' : 
                                                        friend.status === 'pending' ? 'bg-[#F59E0B]' : 'bg-[#64748B]'
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white/90">
                                                    {displayName}
                                                </div>
                                                <div className="text-xs text-white/40 capitalize">
                                                    {friend.status === 'online' ? 'Online' : 
                                                     friend.status === 'pending' ? 'Invitation Pending' : 'Offline'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                                            title="Message (Coming Soon)">
                                            <MessageCircle className="w-4 h-4 text-white/60" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                </div>

                {/* Your Rooms Section */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold flex items-center gap-3">
                            <Users className="w-6 h-6 text-[#94A3B8]" />
                            Your Rooms
                        </h2>
                        <button
                            onClick={() => setIsCreateRoomModalOpen(true)}
                            className={createRoomButtonClass}>
                            <Plus className="w-4 h-4" />
                            Create Room
                        </button>
                    </div>

                    {loadingRooms ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <RoomSkeleton />
                            <RoomSkeleton />
                            <RoomSkeleton />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-8 bg-[#060910] border border-white/5 rounded-2xl">
                            No active rooms
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="bg-[#060910] border border-white/5 rounded-2xl p-6 hover:border-[#94A3B8]/30 transition-all duration-300 group hover:shadow-xl hover:shadow-[#94A3B8]/10"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-white/50">
                                                <Users className="w-4 h-4" />
                                                Code: {room.roomCode}
                                            </div>
                                            <div className="mt-2 text-xs text-white/60">
                                                {room.codeOpen ? 'Join by code: Open' : 'Join by code: Invite-only'}
                                            </div>
                                            <div className="mt-1 text-[11px] text-white/40">
                                                Mode: {room.collaborationMode}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {room.active && (
                                                <div
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-[#4ADE80]/20 border border-[#4ADE80]/30 rounded-full">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                                                    <span className="text-xs text-[#4ADE80]">Live</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRoom(room.id);
                                                }}
                                                className="p-1.5 rounded-lg border border-[#EF6461]/40 bg-[#EF6461]/10 text-[#EF6461] hover:bg-[#EF6461]/20 transition-all"
                                                title="Delete room"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/room/${room.roomCode}`)}
                                        className="w-full px-4 py-2 bg-gradient-to-r from-[#94A3B8]/20 to-[#94A3B8]/20 border border-[#94A3B8]/30 rounded-xl text-sm font-medium hover:from-[#94A3B8]/30 hover:to-[#94A3B8]/30 transition-all"
                                    >
                                        Join Room
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Teams Section */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold flex items-center gap-3">
                            <Users className="w-6 h-6 text-[#94A3B8]" />
                            Teams
                        </h2>
                        <button
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Team
                        </button>
                    </div>

                    {teams.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-8 bg-[#060910] border border-white/5 rounded-2xl">
                            No teams created yet
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map((team) => (
                                <div
                                    key={team.id}
                                    className="bg-[#060910] border border-white/5 rounded-2xl p-6 hover:border-[#94A3B8]/30 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">{team.name}</h3>
                                            <div className="text-sm text-white/50">{team.members.length} members</div>
                                        </div>
                                    </div>

                                    <div className="flex -space-x-2 mb-4">
                                        {team.members.map((member, idx) => (
                                            <div
                                                key={idx}
                                                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#94A3B8] flex items-center justify-center text-sm font-semibold border-2 border-[#060910]"
                                            >
                                                {member}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all">
                                            View Workspace
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all">
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
            <QuickCreateModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreateProject={handleCreateProject}
            />

            <CreateRoomModal
                isOpen={isCreateRoomModalOpen}
                onClose={() => setIsCreateRoomModalOpen(false)}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={(code) => navigate(`/room/${code}`)}
            />
        </>
    );
}
