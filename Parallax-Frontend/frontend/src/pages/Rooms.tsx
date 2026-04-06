import { useNavigate } from "react-router-dom";
import { Users, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from "react";
import { RoomSkeleton } from "../components/DashboardSkeletons";
import { collabApi, MeetingRoom } from "../services/collabApi";
import { CreateRoomModal } from "../components/modals/CreateRoomModal";

export default function Rooms() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

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

    const handleDeleteRoom = async (roomId: string) => {
        if (!window.confirm('Delete this room? This cannot be undone.')) return;
        try {
            await collabApi.deleteRoom(roomId);
            await fetchRooms();
        } catch (err) {
            console.error('Failed to delete room', err);
            setError('Failed to delete room. Please try again.');
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    return (
        <>
            <main className="pt-24 pb-16 px-6 max-w-[1800px] mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Collaboration Rooms</h1>
                        <p className="text-white/50">Join active discussions or create a new room</p>
                    </div>
                    <button
                        onClick={() => setIsCreateRoomModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg text-sm hover:shadow-lg hover:shadow-[#38BDF8]/30 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Room
                    </button>
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
                    <div className="bg-[#060910] border border-white/5 rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] bg-clip-text text-transparent">
                            No Rooms Yet
                        </h2>
                        <div className="text-white/40 font-medium text-lg max-w-md">
                            You haven't created or joined any rooms yet.
                        </div>
                        <button
                            onClick={() => setIsCreateRoomModalOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg text-sm hover:shadow-lg hover:shadow-[#38BDF8]/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Room
                        </button>
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
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#4ADE80]/20 border border-[#4ADE80]/30 rounded-full">
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
            </main>

            <CreateRoomModal
                isOpen={isCreateRoomModalOpen}
                onClose={() => setIsCreateRoomModalOpen(false)}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={(code) => navigate(`/room/${code}`)}
            />
        </>
    );
}
