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
            ? "px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#38BDF8]/20 to-[#94A3B8]/20 text-white border border-[#38BDF8]/30 transition-all font-medium"
            : "px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all text-white/60";
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] bg-[#060910]/95 backdrop-blur-md border-b border-white/5 pointer-events-auto isolate">
            <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
                <button onClick={() => navigate('/', { state: { fromDashboard: true } })} className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#94A3B8] flex items-center justify-center">
                            <Code2 className="w-5 h-5" />
                        </div>
                    </div>
                    <span className="text-xl font-semibold bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] bg-clip-text text-transparent">
                        Parallax
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
                    <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#94A3B8] flex items-center justify-center font-semibold text-white">
                        {initials}
                    </button>
                </div>
            </div>
        </header>
    );
}
