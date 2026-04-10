import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, UserPlus, Search, ArrowUpRight, CalendarClock, CircleDashed, CheckCircle2, Clock3, Video, X } from 'lucide-react';
import { collabApi, MeetingRoom } from '../services/collabApi';
import { RoomSkeleton } from '../components/DashboardSkeletons';
import { CreateRoomModal } from '../components/modals/CreateRoomModal';
import { teamApi, Team } from '../services/teamApi';

const formatDate = (value: string) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export default function Teams() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [rooms, setRooms] = useState<MeetingRoom[]>([]);
    const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [createTeamName, setCreateTeamName] = useState('');
    const [createTeamDescription, setCreateTeamDescription] = useState('');
    const [creatingTeam, setCreatingTeam] = useState(false);

    const fetchTeams = async () => {
        setLoading(true);
        setError(null);

        try {
            const [teamRes, myRooms] = await Promise.all([
                teamApi.listMyTeams(),
                collabApi.getActiveRooms(),
            ]);
            setTeams(teamRes);
            setRooms(myRooms);
        } catch (err) {
            console.error('Failed to load teams view', err);
            setError('Failed to load teams. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (name: string, collaborationMode: 'INTERVIEW' | 'TEAM') => {
        const newRoom = await collabApi.createRoom(name, collaborationMode);
        const refreshed = await collabApi.getActiveRooms();
        setRooms(refreshed);
        return { roomCode: newRoom.roomCode, name: newRoom.name };
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const filteredTeams = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return teams;
        return teams.filter((team) => team.name.toLowerCase().includes(q) || (team.description || '').toLowerCase().includes(q));
    }, [teams, query]);

    const totalMembers = useMemo(
        () => teams.reduce((sum, t) => sum + t.activeMembers, 0),
        [teams]
    );

    const totalPending = useMemo(
        () => teams.reduce((sum, t) => sum + t.pendingInvites, 0),
        [teams]
    );

    const liveRooms = useMemo(
        () => rooms.filter((r) => r.active).length,
        [rooms]
    );

    const handleCreateTeam = async () => {
        if (!createTeamName.trim() || creatingTeam) return;

        try {
            setCreatingTeam(true);
            const created = await teamApi.createTeam({
                name: createTeamName.trim(),
                description: createTeamDescription.trim() || undefined,
            });
            setTeams((prev) => [created, ...prev]);
            setCreateTeamName('');
            setCreateTeamDescription('');
            setIsCreateTeamModalOpen(false);
        } catch (err) {
            console.error('Failed to create team', err);
            setError('Failed to create team. Please try again.');
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleInviteMember = async (teamId: string) => {
        const email = window.prompt('Enter member email to invite');
        if (!email || !email.trim()) return;

        try {
            await teamApi.inviteMember(teamId, email.trim());
            const refreshed = await teamApi.listMyTeams();
            setTeams(refreshed);
        } catch (err) {
            console.error('Failed to invite member', err);
            setError('Invite failed. Ensure user exists and you have permission.');
        }
    };

    const handleAcceptInvite = async (teamId: string) => {
        try {
            await teamApi.acceptInvite(teamId);
            const refreshed = await teamApi.listMyTeams();
            setTeams(refreshed);
        } catch (err) {
            console.error('Failed to accept invite', err);
            setError('Failed to accept invite. Please try again.');
        }
    };

    const handleRejectInvite = async (teamId: string) => {
        try {
            await teamApi.rejectInvite(teamId);
            const refreshed = await teamApi.listMyTeams();
            setTeams(refreshed);
        } catch (err) {
            console.error('Failed to reject invite', err);
            setError('Failed to reject invite. Please try again.');
        }
    };

    const pendingTeams = useMemo(
        () => teams.filter((t) => t.myStatus === 'INVITED'),
        [teams]
    );

    const activeTeams = useMemo(
        () => teams.filter((t) => t.myStatus === 'ACTIVE'),
        [teams]
    );

    return (
        <>
            <main className="pt-24 pb-16 px-6 max-w-[1800px] mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Your Teams</h1>
                        <p className="text-white/50">Project squads, collaborators, invites, and room activity in one place.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled
                            title="Select a team from the list to open workspace"
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 opacity-50 cursor-not-allowed"
                        >
                            <Users className="w-4 h-4" />
                            Team Workspace
                        </button>
                        <button
                            onClick={() => setIsCreateTeamModalOpen(true)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Team
                        </button>
                        <button
                            onClick={() => setIsCreateRoomModalOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-xl hover:shadow-lg hover:shadow-[#38BDF8]/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Start Team Room
                        </button>
                    </div>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#060910] border border-white/5 rounded-2xl p-4">
                        <div className="text-xs uppercase text-white/40 mb-2">Project Teams</div>
                        <div className="text-2xl font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#38BDF8]" />
                            {teams.length}
                        </div>
                    </div>
                    <div className="bg-[#060910] border border-white/5 rounded-2xl p-4">
                        <div className="text-xs uppercase text-white/40 mb-2">Total Members</div>
                        <div className="text-2xl font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#4ADE80]" />
                            {totalMembers}
                        </div>
                    </div>
                    <div className="bg-[#060910] border border-white/5 rounded-2xl p-4">
                        <div className="text-xs uppercase text-white/40 mb-2">Pending Invites</div>
                        <div className="text-2xl font-semibold flex items-center gap-2">
                            <Clock3 className="w-5 h-5 text-[#FBBF24]" />
                            {totalPending}
                        </div>
                    </div>
                    <div className="bg-[#060910] border border-white/5 rounded-2xl p-4">
                        <div className="text-xs uppercase text-white/40 mb-2">Live Rooms</div>
                        <div className="text-2xl font-semibold flex items-center gap-2">
                            <Video className="w-5 h-5 text-[#94A3B8]" />
                            {liveRooms}
                        </div>
                    </div>
                </section>

                <div className="mb-8 relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search teams by name or description"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 bg-[#060910] border border-white/10 rounded-xl focus:outline-none focus:border-[#38BDF8]/50 transition-all"
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 rounded-2xl border border-[#EF6461]/20 bg-[#EF6461]/10 text-[#9A3412]">
                        {error}
                    </div>
                ) : (
                    <>
                        {/* Pending Invites Section */}
                        {pendingTeams.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-[#FBBF24]">
                                    <Clock3 className="w-6 h-6" />
                                    Pending Invitations
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {pendingTeams.map((team) => (
                                        <article
                                            key={team.id}
                                            className="bg-[#060910] border border-[#FBBF24]/30 rounded-2xl p-5 hover:border-[#FBBF24]/50 transition-all duration-300"
                                        >
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold mb-1 text-[#FBBF24]">
                                                    {team.name}
                                                </h3>
                                                {team.description ? (
                                                    <p className="text-sm text-white/50 max-w-[34ch] line-clamp-2">{team.description}</p>
                                                ) : (
                                                    <p className="text-sm text-white/35">No description</p>
                                                )}
                                            </div>

                                            <div className="space-y-2 mb-4 text-sm">
                                                <div className="flex items-center justify-between text-white/70">
                                                    <span className="flex items-center gap-2"><Users className="w-4 h-4" />Members</span>
                                                    <span>{team.activeMembers}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-white/70">
                                                    <span className="flex items-center gap-2"><CalendarClock className="w-4 h-4" />Invited</span>
                                                    <span>{formatDate(team.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAcceptInvite(team.id)}
                                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-[#4ADE80]/20 to-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-lg text-sm hover:from-[#4ADE80]/30 hover:to-[#4ADE80]/20 transition-all text-[#4ADE80] font-medium"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectInvite(team.id)}
                                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-[#EF6461]/20 to-[#EF6461]/10 border border-[#EF6461]/30 rounded-lg text-sm hover:from-[#EF6461]/30 hover:to-[#EF6461]/20 transition-all text-[#9A3412] font-medium"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Teams Section */}
                        {activeTeams.length === 0 && pendingTeams.length === 0 ? (
                            <div className="bg-[#060910] border border-white/5 rounded-2xl h-[360px] flex flex-col items-center justify-center gap-4 text-center">
                                <CircleDashed className="w-10 h-10 text-white/30" />
                                <h2 className="text-2xl font-semibold">No Team Workspaces Yet</h2>
                                <p className="text-white/40 max-w-md">
                                    Create your first dedicated team, invite members, then use shared rooms and workspaces.
                                </p>
                                <button
                                    onClick={() => setIsCreateTeamModalOpen(true)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Create Team
                                </button>
                            </div>
                        ) : activeTeams.length > 0 ? (
                            <div>
                                <h2 className="text-2xl font-semibold mb-6">Your Teams</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {activeTeams.map((team) => (
                                        <article
                                            key={team.id}
                                            className="group bg-[#060910] border border-white/5 rounded-2xl p-5 hover:border-[#38BDF8]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#38BDF8]/10"
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-1 group-hover:text-[#38BDF8] transition-colors">
                                                        {team.name}
                                                    </h3>
                                                    {team.description ? (
                                                        <p className="text-sm text-white/50 max-w-[34ch] line-clamp-2">{team.description}</p>
                                                    ) : (
                                                        <p className="text-sm text-white/35">No description yet</p>
                                                    )}
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            <div className="space-y-2 mb-4 text-sm">
                                                <div className="flex items-center justify-between text-white/70">
                                                    <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#4ADE80]" />Members</span>
                                                    <span>{team.activeMembers}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-white/70">
                                                    <span className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-[#FBBF24]" />Pending</span>
                                                    <span>{team.pendingInvites}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-white/70">
                                                    <span className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#94A3B8]" />Updated</span>
                                                    <span>{formatDate(team.updatedAt)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/team/${team.id}`)}
                                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-[#38BDF8]/20 to-[#94A3B8]/20 border border-[#38BDF8]/30 rounded-lg text-sm hover:from-[#38BDF8]/30 hover:to-[#94A3B8]/30 transition-all"
                                                >
                                                    Open Workspace
                                                </button>
                                                <button
                                                    onClick={() => handleInviteMember(team.id)}
                                                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all"
                                                    title="Invite member"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </main>

            <CreateRoomModal
                isOpen={isCreateRoomModalOpen}
                onClose={() => setIsCreateRoomModalOpen(false)}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={(code) => navigate(`/room/${code}`)}
            />

            {isCreateTeamModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => {
                            if (!creatingTeam) {
                                setIsCreateTeamModalOpen(false);
                            }
                        }}
                    />
                    <div className="relative z-10 w-full max-w-lg mx-4 bg-[#060910]/95 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Create Team</h2>
                            <button
                                onClick={() => setIsCreateTeamModalOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4 text-white/70" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm text-white/70 mb-2">Team Name</label>
                                <input
                                    type="text"
                                    value={createTeamName}
                                    onChange={(e) => setCreateTeamName(e.target.value)}
                                    placeholder="e.g. Platform Engineers"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#38BDF8]/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/70 mb-2">Description (optional)</label>
                                <textarea
                                    rows={3}
                                    value={createTeamDescription}
                                    onChange={(e) => setCreateTeamDescription(e.target.value)}
                                    placeholder="What this team is responsible for"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#38BDF8]/50 resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center gap-3">
                            <button
                                onClick={() => setIsCreateTeamModalOpen(false)}
                                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTeam}
                                disabled={!createTeamName.trim() || creatingTeam}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#38BDF8]/30 transition-all"
                            >
                                {creatingTeam ? 'Creating...' : 'Create Team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
