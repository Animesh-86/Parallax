import { useNavigate, useLocation } from "react-router-dom";
import { Code2 } from 'lucide-react';
import { NotificationBell } from "./NotificationBell";
import { useState, useEffect } from "react";
import { profileService } from "../services/profileService";

export function DashboardHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const [initials, setInitials] = useState("..");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const profile = await profileService.getMyProfile();
                const name = profile.displayName || profile.username || "User";
                // Generate initials (First 2 chars of name, or First char of First/Last words)
                const parts = name.trim().split(' ');
                if (parts.length >= 2) {
                    setInitials((parts[0][0] + parts[1][0]).toUpperCase());
                } else {
                    setInitials(name.substring(0, 2).toUpperCase());
                }
            } catch (e) {
                console.error("Failed to load header profile", e);
                setInitials("??");
            }
        };
        fetchUser();
    }, []);

    const getLinkClass = (path: string) => {
        const isActive = location.pathname === path;
        return isActive
            ? "px-4 py-2 rounded-lg text-sm font-medium bg-[#D4AF37]/10 text-white border border-[#D4AF37]/30 transition-all font-medium shadow-[0_0_15px_-5px_rgba(212,175,55,0.4)]"
            : "px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all";
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] bg-[#09090B]/95 backdrop-blur-md border-b border-white/5 pointer-events-auto isolate">
            <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
                <button onClick={() => navigate('/', { state: { fromDashboard: true } })} className="flex items-center gap-2 group">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] flex items-center justify-center">
                            <span className="text-black font-bold text-sm">P</span>
                        </div>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] bg-clip-text text-transparent uppercase tracking-[0.2em]">
                        PARALLAX
                    </span>
                </button>

                <nav className="flex items-center gap-1">
                    <button onClick={() => navigate('/dashboard')} className={getLinkClass('/dashboard')}>Home</button>
                    <button onClick={() => navigate('/my-projects')} className={getLinkClass('/my-projects')}>My Projects</button>
                    <button onClick={() => navigate('/rooms')} className={getLinkClass('/rooms')}>Rooms</button>
                    <button onClick={() => navigate('/teams')} className={getLinkClass('/teams')}>Teams</button>
                    <button onClick={() => navigate('/friends')} className={getLinkClass('/friends')}>Friends</button>
                </nav>

                <div className="flex items-center gap-3">
                    <NotificationBell />
                    <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] flex items-center justify-center font-bold text-black border border-[#D4AF37]/50">
                        {initials}
                    </button>
                </div>
            </div>
        </header>
    );
}
