import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
    Code2,
    Folder,
    Plus,
    Search,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { CosmicStars } from "../components/workspace/CosmicStars";
import { QuickCreateModal } from "../components/modals/QuickCreateModal";
import { NotificationBell } from "../components/NotificationBell";
import { ProjectSkeleton } from '../components/DashboardSkeletons';
import { apiBaseUrl } from '../services/env';

type Project = {
    id: string;
    name: string;
    language: string;
    updatedAt: string;
};

export default function MyProjects() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Fetch Logic
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const res = await fetch(`${apiBaseUrl}/api/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem("access_token");
                navigate("/login");
                return;
            }

            if (!res.ok) throw new Error("Failed to fetch projects");

            const data = await res.json();
            const mapped = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                language: p.language || "Unknown",
                updatedAt: p.updatedAt || p.updated_at || p.createdAt || ""
            }));

            // Sort by newest
            mapped.sort((a: Project, b: Project) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            setProjects(mapped);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Create Logic
    const handleCreateProject = async (projectName: string, language: string) => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const res = await fetch(`${apiBaseUrl}/api/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: projectName, language }),
            });

            if (!res.ok) throw new Error("Failed to create project");

            const created = await res.json();
            navigate(`/editor/${created.id}`);
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Filter Logic
    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-[#09090B] text-white relative overflow-x-hidden">
            {/* Cosmic Background */}
            <CosmicStars />
            <div className="fixed inset-0 pointer-events-none opacity-10">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#A1A1AA] rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/95 backdrop-blur-md border-b border-white/5">
                <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#A1A1AA] flex items-center justify-center">
                                <Code2 className="w-5 h-5" />
                            </div>
                        </div>
                        <span className="text-xl font-semibold bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] bg-clip-text text-transparent">
                            Parallax
                        </span>
                    </button>

                    <nav className="flex items-center gap-1">
                        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">Home</button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#D4AF37]/20 to-[#A1A1AA]/20 text-white border border-[#D4AF37]/30 transition-all">My Projects</button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">Rooms</button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">Teams</button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">Friends</button>
                    </nav>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#A1A1AA] flex items-center justify-center font-semibold">AC</button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-16 px-6 max-w-[1800px] mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Projects</h1>
                        <p className="text-white/50">Manage and organize your coding projects</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        New Project
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-8 relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 glass-panel-soft rounded-xl focus:outline-none focus:border-[#D4AF37]/50 text-base transition-all"
                    />
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                        <ProjectSkeleton />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="glass-panel rounded-3xl h-[400px] flex flex-col items-center justify-center gap-4 text-center border border-white/10 bg-[#09090B]/70">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] bg-clip-text text-transparent">
                            No Projects Yet
                        </div>
                        <p className="text-white/45 text-lg max-w-md">
                            Start your journey by creating your first project.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all text-white"
                        >
                            Create Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProjects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => navigate(`/editor/${project.id}`)}
                                className="group glass-panel rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#D4AF37]/5 cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight className="w-5 h-5 text-white/40" />
                                </div>

                                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                                    <Code2 className="w-5 h-5 text-[#D4AF37]" />
                                </div>

                                <h3 className="text-lg font-semibold mb-1 group-hover:text-[#D4AF37] transition-colors truncatre">
                                    {project.name}
                                </h3>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs font-mono px-2 py-1 rounded bg-white/5 text-white/60 group-hover:bg-white/10">
                                        {project.language}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(project.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <QuickCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateProject={handleCreateProject}
            />
        </div>
    );
}
