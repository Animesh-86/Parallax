import { useNavigate } from "react-router-dom";
import { Users, Plus } from 'lucide-react';
import { CosmicStars } from "../components/workspace/CosmicStars";
import { DashboardHeader } from "../components/DashboardHeader";

export default function Rooms() {
    const navigate = useNavigate();

    // Mock Rooms Data (consistent with Dashboard prior to cleanup)
    const rooms = [
        // Empty for now as requested by user cleanup earlier, but ready for logic
    ];

    return (
        <main className="pt-24 pb-16 px-6 max-w-[1800px] mx-auto relative z-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Collaboration Rooms</h1>
                    <p className="text-white/50">Join active discussions or create a new room</p>
                </div>
                <button
                    onClick={() => navigate('/room')} // Navigates to the Create/Join logic or generic room for now
                    className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-xl hover:shadow-lg hover:shadow-[#38BDF8]/30 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Room
                </button>
            </div>

            <div className="bg-[#060910] border border-white/5 rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] bg-clip-text text-transparent">
                    Coming Soon
                </h2>
                <div className="text-white/40 font-medium text-lg max-w-md">
                    Collaboration Rooms are currently under construction.
                </div>
                <div className="text-sm text-white/20">
                    We're building a space for you to code together in real-time. Stay tuned!
                </div>
            </div>
        </main>
    );
}
