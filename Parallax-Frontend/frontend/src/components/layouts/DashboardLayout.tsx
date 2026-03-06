import { Outlet, useLocation } from "react-router-dom";
import { DashboardHeader } from "../DashboardHeader";
import { CosmicStars } from "../workspace/CosmicStars";

export default function DashboardLayout() {
    const location = useLocation();
    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-x-hidden selection:bg-[#38BDF8]/30">
            {/* Global Background Elements */}
            <CosmicStars />
            <div className="fixed inset-0 pointer-events-none opacity-10 z-0">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#38BDF8] rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#94A3B8] rounded-full blur-[150px]" />
            </div>

            {/* Persistent Header - Hidden on Workspace/Editor pages */}
            {!location.pathname.startsWith('/editor') && !location.pathname.startsWith('/workspace') && (
                <DashboardHeader />
            )}

            {/* Page Content */}
            <div className="relative z-10">
                <Outlet />
            </div>
        </div>
    );
}
