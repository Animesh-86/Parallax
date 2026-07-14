import { useNavigate } from "react-router-dom";
import { Users, Plus, Trash2, Search } from 'lucide-react';
import { useState, useEffect } from "react";
import { RoomSkeleton } from "../components/DashboardSkeletons";
import { collabApi, MeetingRoom } from "../services/collabApi";
import { CreateRoomModal } from "../components/modals/CreateRoomModal";
import { ConfirmModal } from "../components/modals/ConfirmModal";

export default function Rooms() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            setError(null);
            const myRooms = await collabApi.getActiveRooms();
            setRooms(myRooms);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
            setError("Failed to load rooms. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (name: string, collaborationMode: 'INTERVIEW' | 'TEAM') => {
        const newRoom = await collabApi.createRoom(name, collaborationMode);
        await fetchRooms();
        return { roomCode: newRoom.roomCode, name: newRoom.name };
    };

    const handleDeleteRoom = async () => {
        if (!roomToDelete) return;
        try {
            await collabApi.deleteRoom(roomToDelete);
            await fetchRooms();
            setRoomToDelete(null);
        } catch (err) {
            console.error('Failed to delete room', err);
            setError('Failed to delete room. Please try again.');
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const filteredRooms = rooms.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.roomCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <main className="pt-24 pb-16 px-6 max-w-[1800px] mx-auto relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Collaboration Rooms</h1>
                        <p className="text-white/50">Join active discussions or create a new room</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64 hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input 
                                type="text" 
                                placeholder="Search rooms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateRoomModalOpen(true)}
                            className="px-4 py-2 bg-[#D4AF37] text-black font-medium rounded-lg text-sm hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Room
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                    </div>
                ) : error ? (
                    <div className="text-center text-[#EF6461] text-sm py-8 bg-[#EF6461]/10 border border-[#EF6461]/20 rounded-2xl">
                        {error}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl py-16 flex flex-col items-center justify-center gap-2 text-center border border-white/10">
                        <h2 className="text-lg md:text-xl font-medium text-white/70">
                            No Rooms Yet
                        </h2>
                        <div className="text-sm text-white/40 max-w-sm mb-4">
                            Looks like everyone's on a coffee break. Create a room to start collaborating!
                        </div>
                        <button
                            onClick={() => setIsCreateRoomModalOpen(true)}
                            className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Room
                        </button>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl py-16 flex flex-col items-center justify-center gap-2 text-center border border-white/10">
                        <h2 className="text-lg font-medium text-white/70">No results found</h2>
                        <div className="text-sm text-white/40 max-w-sm">
                            We couldn't find any rooms matching "{searchQuery}"
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRooms.map((room) => (
                            <div
                                key={room.id}
                                className="glass-panel rounded-2xl p-6 hover:border-[#A1A1AA]/30 transition-all duration-300 group hover:shadow-xl hover:shadow-[#A1A1AA]/10"
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
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#4ADE80]/20 border border-[#4ADE80]/30 rounded-full">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                                                <span className="text-xs text-[#4ADE80]">Live</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRoomToDelete(room.id);
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
                                >
                                    Join Room
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={!!roomToDelete}
                onClose={() => setRoomToDelete(null)}
                onConfirm={handleDeleteRoom}
                title="Delete Room"
                message="Are you absolutely sure you want to delete this room? This cannot be undone."
                confirmText="Delete Room"
                cancelText="Cancel"
                isDanger={true}
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
