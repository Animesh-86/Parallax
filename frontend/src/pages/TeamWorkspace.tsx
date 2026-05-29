import { useState, useEffect } from 'react';
import { Users, Loader, AlertCircle, UserPlus, Settings, TrendingUp, FileText, ListTodo, Activity, MessageSquare, Crown, Shield, Plus, Video, Folder, Code2, History, AlertTriangle, Hash, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { NotificationBell } from '../components/NotificationBell';
import { teamApi, Team, TeamMember, TeamProject } from '../services/teamApi';
import { collabApi } from '../services/collabApi';
import { QuickCreateModal } from '../components/modals/QuickCreateModal';
import { CreateRoomModal } from '../components/modals/CreateRoomModal';
import { UnifiedChatPanel } from '../components/chat/UnifiedChatPanel';
import { teamChatWsClient } from '../services/wsChatClient';
import { LinkProjectModal } from '../components/modals/LinkProjectModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { TeamKanbanBoard } from '../components/workspace/TeamKanbanBoard';
import { TeamNotes } from '../components/workspace/TeamNotes';
import { apiBaseUrl } from '../services/env';
import { getDisplayName } from '../services/userUtils';
import { safeFormatDate } from '../services/dateUtils';
import { ErrorBoundary } from '../components/ErrorBoundary';

type TabView = 'overview' | 'projects' | 'members' | 'chat' | 'tasks' | 'docs' | 'settings';

function TeamWorkspaceContent() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
  const [projectToUnlink, setProjectToUnlink] = useState<TeamProject | null>(null);
  const [teamProjects, setTeamProjects] = useState<TeamProject[]>([]);
  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);

  // Channels state
  const [channels, setChannels] = useState<{ id: string; name: string; type: 'TEXT' | 'VOICE'; isDefault: boolean }[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'VOICE'>('TEXT');

  const loadTeamData = async () => {
    if (!teamId) {
      setError('No team selected');
      return;
    }
    
    try {
      setLoading(true);
      const [teamData, membersData, channelsData] = await Promise.all([
        teamApi.getTeam(teamId),
        teamApi.getTeamMembers(teamId),
        teamApi.getChannels(teamId)
      ]);
      setTeam(teamData);
      setMembers(membersData);
      setChannels(channelsData);
      if (channelsData.length > 0 && !activeChannelId) {
        // Set first text channel as active
        const defaultText = channelsData.find((c: any) => c.type === 'TEXT') || channelsData[0];
        setActiveChannelId(defaultText.id);
      }
      fetchTeamProjects();
    } catch (err) {
      console.error('Failed to load team:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const handleDeleteTeam = async () => {
    if (!team) return;
    try {
      await teamApi.deleteTeam(team.id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const fetchTeamProjects = async () => {
    if (!teamId) return;
    try {
      setLoadingProjects(true);
      const projects = await teamApi.getTeamProjects(teamId);
      setTeamProjects(projects);
    } catch (err) {
      console.error('Failed to fetch team projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !team || inviting) return;
    try {
      setInviting(true);
      await teamApi.inviteMember(team.id, inviteEmail.trim());
      const updated = await teamApi.getTeamMembers(team.id);
      setMembers(updated);
      setInviteEmail('');
    } catch (err) {
      console.error('Failed to invite:', err);
      setError('Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleCreateProject = async (projectName: string, language: string, githubRepoUrl?: string, aiReviewEnabled?: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token');

      const res = await fetch(`${apiBaseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: projectName, language, teamId, githubRepoUrl, aiReviewEnabled }),
      });

      if (!res.ok) {
        let errorMsg = `Status: ${res.status} ${res.statusText}`;
        try {
            const errorData = await res.json();
            if (errorData.message) errorMsg = errorData.message;
        } catch (e) {
            const errorText = await res.text();
            if (errorText) errorMsg = errorText;
        }
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      navigate(`/editor/${data.id}`);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(`Failed to create project: ${err.message}`);
    }
  };

  const handleCreateRoom = async (name: string, collaborationMode: 'INTERVIEW' | 'TEAM') => {
    try {
      const newRoom = await collabApi.createRoom(name, collaborationMode);
      setIsCreateRoomModalOpen(false);
      navigate(`/room/${newRoom.roomCode}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room');
    }
  };

  const getRoleIcon = (role: string) => role === 'OWNER' ? Crown : role === 'ADMIN' ? Shield : Users;
  const getRoleColor = (role: string) =>
    role === 'OWNER' ? '#F59E0B' : role === 'ADMIN' ? '#D4AF37' : '#A1A1AA';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center">
        <div className="text-center z-10">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-[#D4AF37]" />
          <p>Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center">
        <div className="text-center z-10">
          <AlertCircle className="w-12 h-12 text-[#EF6461] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{error || 'Team not found'}</h2>
          <button onClick={() => navigate('/teams')} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg">
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  const teamInitials = team.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const activeMembers = members.filter(m => m.status === 'ACTIVE');
  const pendingMembers = members.filter(m => m.status === 'INVITED');

  return (
    <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#A1A1AA] rounded-full blur-[150px]" />
      </div>

      <main className="pt-20 pb-16 px-6 max-w-[1400px] mx-auto relative z-10">
        <div className="sticky top-16 z-40 -mx-6 px-6 py-3 bg-[#09090B]/95 backdrop-blur-md border-b border-white/5 mb-6">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
            <button onClick={() => navigate('/teams')} className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#A1A1AA] flex items-center justify-center font-semibold text-sm">
                {teamInitials}
              </div>
              <div>
                <h1 className="font-semibold text-sm">{team.name}</h1>
                <p className="text-xs text-white/40">{activeMembers.length} members</p>
              </div>
            </button>

            <nav className="flex items-center gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
              {[
                { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
                { id: 'projects' as const, label: 'Projects', icon: Folder },
                { id: 'members' as const, label: 'Members', icon: Users },
                { id: 'chat' as const, label: 'Chat', icon: Hash },
                { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
                { id: 'docs' as const, label: 'Docs', icon: FileText },
                { id: 'settings' as const, label: 'Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-semibold' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-xs flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Project
              </button>
              <button
                onClick={() => setIsCreateRoomModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all text-xs flex items-center gap-2"
              >
                <Video className="w-3.5 h-3.5" />
                Room
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            <motion.div className="col-span-12 lg:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Team Info</h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-white/60 mb-2">Description</p>
                    <p className="text-white">{team.description || 'No description yet'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 mb-2">Your Role</p>
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = getRoleIcon(team.myRole); return <Icon className="w-4 h-4" style={{ color: getRoleColor(team.myRole) }} />; })()}
                      <span>{team.myRole}</span>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between"><span className="text-white/60">Projects</span><span className="text-[#D4AF37]">{teamProjects.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Active</span><span>{activeMembers.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Pending</span><span>{pendingMembers.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Online</span><span className="text-[#4ADE80]">{activeMembers.filter(m => m.isOnline).length}</span></div>
                  </div>
                  <button onClick={() => setActiveTab('members')} className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg text-sm font-medium">
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Invite Member
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div className="col-span-12 lg:col-span-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-3"><Activity className="w-5 h-5 text-[#D4AF37]" />Activity Feed</h2>
                <div className="space-y-4">
                  {teamProjects.map(p => (
                    <div key={p.id} className="relative pl-6 cursor-pointer hover:bg-white/5 rounded-lg py-2 -ml-2 px-2 transition-colors" onClick={() => navigate(`/editor/${p.id}`)}>
                      <div className="absolute left-2 top-3.5 w-2 h-2 rounded-full bg-[#4ADE80]" />
                      <div>
                        <p className="text-sm"><span className="font-medium">Project created</span> — <span className="text-[#D4AF37]">{p.name}</span></p>
                        <p className="text-xs text-white/40 mt-1">{p.language}</p>
                      </div>
                    </div>
                  ))}
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#D4AF37]" />
                    <div>
                      <p className="text-sm"><span className="font-medium">Team created</span></p>
                      <p className="text-xs text-white/40 mt-1">{safeFormatDate(team.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="col-span-12 lg:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Members</h3>
                <div className="space-y-3">
                  {activeMembers.slice(0, 5).map(m => (
                    <div key={m.userId} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-xs font-semibold">{m.fullName.slice(0, 2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.fullName}</p>
                        <p className="text-xs text-white/50">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-3">
                <Folder className="w-6 h-6 text-[#D4AF37]" />
                Team Projects
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLinkProjectModalOpen(true)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all"
                >
                  <Link2 className="w-4 h-4" />
                  Link Existing
                </button>
                <button
                  onClick={() => setIsCreateProjectModalOpen(true)}
                  className="px-4 py-2 bg-[#D4AF37] rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-[#D4AF37]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
            </div>

            {team.autoAddMembersToProjects && (
              <div className="mb-4 px-4 py-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl flex items-center gap-3 text-sm">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="text-white/70">Auto-add is ON — new team members will automatically get access to all team projects.</span>
                {(team.myRole === 'OWNER' || team.myRole === 'ADMIN') && (
                  <button onClick={() => setActiveTab('settings')} className="ml-auto text-[#F59E0B] hover:underline shrink-0">Change</button>
                )}
              </div>
            )}

            {loadingProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-[#09090B] border border-white/5 rounded-2xl p-6 h-[180px] animate-pulse" />
                ))}
              </div>
            ) : teamProjects.length === 0 ? (
              <div className="bg-[#09090B] border border-white/5 rounded-2xl p-12 text-center">
                <Folder className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 mb-4">No projects linked to this team yet</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsCreateProjectModalOpen(true)}
                    className="px-4 py-2 bg-[#D4AF37] rounded-lg text-sm font-medium"
                  >
                    Create First Project
                  </button>
                  <button
                    onClick={() => setIsLinkProjectModalOpen(true)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Link Existing
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamProjects.map(project => (
                  <div
                    key={project.id}
                    className="group bg-[#09090B] border border-white/5 rounded-2xl p-6 hover:border-[#D4AF37]/30 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-[#D4AF37]/10"
                    onClick={() => navigate(`/editor/${project.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold mb-1 group-hover:text-[#D4AF37] transition-colors font-serif italic">{project.name}</h3>
                        <span className="text-xs text-white/40 font-mono px-2 py-0.5 rounded bg-white/5">{project.language}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#D4AF37]/20 transition-colors">
                        <Code2 className="w-4 h-4 text-white/40 group-hover:text-[#D4AF37]" />
                      </div>
                    </div>
                    {(team.myRole === 'OWNER' || team.myRole === 'ADMIN') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToUnlink(project);
                        }}
                        className="w-full mt-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/40 hover:text-white/70 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Link2 className="w-3 h-3" />
                        Unlink from Team
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'members' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold mb-6">Team Members</h2>

            {(team.myRole === 'OWNER' || team.myRole === 'ADMIN') && (
              <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold mb-4">Invite New Member</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInviteMember()}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#D4AF37]/50"
                  />
                  <button
                    onClick={handleInviteMember}
                    disabled={!inviteEmail.trim() || inviting}
                    className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </div>
            )}

            {activeMembers.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Active Members</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMembers.map((m) => (
                    <div key={m.userId} className="bg-[#09090B] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center font-semibold">{m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{m.fullName}</h3>
                          <p className="text-xs text-white/50">{m.email}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${m.isOnline ? 'bg-[#4ADE80]' : 'bg-white/20'}`} />
                      </div>
                      <p className="text-xs text-white/40 mb-4">Role: {m.role}</p>
                      <button 
                        onClick={() => navigate('/friends', { state: { selectedFriendId: m.userId } })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-all"
                      >
                        <MessageSquare className="w-3 h-3 inline mr-2" />
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingMembers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Pending Invites</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingMembers.map((m) => (
                    <div key={m.userId} className="bg-[#09090B] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-semibold text-xs">{m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{m.fullName}</h3>
                          <p className="text-xs text-white/50">{m.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mb-4">Invited {m.invitedAt ? safeFormatDate(m.invitedAt) : 'recently'}</p>
                      {(team.myRole === 'OWNER' || team.myRole === 'ADMIN') && (
                        <button className="w-full px-3 py-2 bg-[#EF6461]/10 border border-[#EF6461]/30 rounded-lg text-xs text-[#9A3412] hover:bg-[#EF6461]/20 transition-all">
                          Cancel Invite
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[70vh] gap-4">
            {/* Sidebar */}
            <div className="w-64 bg-[#09090B] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Channels</h3>
                {(team.myRole === 'OWNER' || team.myRole === 'ADMIN') && (
                  <button onClick={() => setIsCreateChannelModalOpen(true)} className="p-1 hover:bg-white/10 rounded">
                    <Plus className="w-4 h-4 text-white/60 hover:text-white" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2 py-1 mt-2">Text Channels</div>
                {channels.filter(c => c.type === 'TEXT').map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                      activeChannelId === c.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    {c.name}
                  </button>
                ))}
                
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2 py-1 mt-4">Voice Channels</div>
                {channels.filter(c => c.type === 'VOICE').map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (activeChannelId === c.id) return;
                      // Logic to open voice room modal or jump to room
                      // Just set active for now, real voice handles differently
                      setActiveChannelId(c.id);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                      activeChannelId === c.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 bg-[#09090B] border border-white/5 rounded-2xl overflow-hidden relative">
              {activeChannelId ? (
                channels.find(c => c.id === activeChannelId)?.type === 'TEXT' ? (
                  <UnifiedChatPanel 
                    contextId={team.id} 
                    channelId={activeChannelId}
                    contextType="TEAM" 
                    contextName={`#${channels.find(c => c.id === activeChannelId)?.name}`} 
                    wsClient={teamChatWsClient} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-center p-8">
                    <div>
                      <Video className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Voice / Video Channel</h3>
                      <p className="text-white/60 mb-6">Join the cosmic communication array.</p>
                      <button 
                        onClick={() => setIsCreateRoomModalOpen(true)}
                        className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg font-medium"
                      >
                        Join Room
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">Select a channel</div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <ListTodo className="w-6 h-6 text-[#D4AF37]" />
              Team Board
            </h2>
            <TeamKanbanBoard teamId={team.id} members={activeMembers} myName={getDisplayName()} />
          </motion.div>
        )}

        {activeTab === 'docs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#D4AF37]" />
              Documentation & Notes
            </h2>
            <TeamNotes teamId={team.id} myName={getDisplayName()} />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6">Team Settings</h2>
            {team.myRole === 'OWNER' || team.myRole === 'ADMIN' ? (
              <div className="space-y-6">
                <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Team Name</label>
                      <input type="text" value={team.name} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none" readOnly />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Description</label>
                      <textarea value={team.description || ''} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 resize-none focus:outline-none" readOnly />
                    </div>
                  </div>
                </div>
                <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Project Access</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/90">Auto-add members to projects</p>
                      <p className="text-xs text-white/40 mt-1">New team members automatically become collaborators on all team projects</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const updated = await teamApi.updateAutoAddSetting(team.id, !team.autoAddMembersToProjects);
                          setTeam(updated);
                        } catch (err) {
                          console.error('Failed to update setting:', err);
                        }
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${team.autoAddMembersToProjects ? 'bg-[#D4AF37]' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${team.autoAddMembersToProjects ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                <div className="bg-[#09090B] border border-[#EF6461]/20 rounded-2xl p-6">
                  <h3 className="font-semibold mb-2 text-[#9A3412]">Danger Zone</h3>
                  <p className="text-sm text-white/60 mb-4">Deleting is permanent.</p>
                  <button 
                    onClick={() => setIsDeleteTeamModalOpen(true)}
                    className="px-4 py-2 bg-[#EF6461]/10 border border-[#EF6461]/30 rounded-lg text-sm text-[#9A3412] hover:bg-[#EF6461]/20"
                  >
                    Delete Team
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6">
                <p className="text-white/60">Only owners and admins can modify settings</p>
              </div>
            )}
          </motion.div>
        )}
      </main>
      
      <QuickCreateModal 
        isOpen={isCreateProjectModalOpen} 
        onClose={() => setIsCreateProjectModalOpen(false)} 
        onCreateProject={handleCreateProject}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={(code) => navigate(`/room/${code}`)}
      />

      <LinkProjectModal
        isOpen={isLinkProjectModalOpen}
        onClose={() => setIsLinkProjectModalOpen(false)}
        teamId={team.id}
        teamName={team.name}
        existingProjectIds={teamProjects.map(p => p.id)}
        onLinked={() => {
          setIsLinkProjectModalOpen(false);
          loadTeamData();
        }}
      />

      <ConfirmModal
        isOpen={isDeleteTeamModalOpen}
        onClose={() => setIsDeleteTeamModalOpen(false)}
        onConfirm={handleDeleteTeam}
        title="Delete Team"
        message={`Are you absolutely sure you want to delete the team "${team?.name}"? All team settings and chat history will be permanently removed. (Projects will NOT be deleted, but they will be unlinked). This action cannot be undone.`}
        confirmText="Delete Team"
        cancelText="Cancel"
        isDanger={true}
        requireInput={`delete ${team?.name}`}
      />

      <ConfirmModal
        isOpen={!!projectToUnlink}
        onClose={() => setProjectToUnlink(null)}
        onConfirm={async () => {
          if (!team || !projectToUnlink) return;
          try {
            await teamApi.unlinkProjectFromTeam(team.id, projectToUnlink.id);
            loadTeamData();
            setProjectToUnlink(null);
          } catch (e) {
            console.error('Failed to unlink project', e);
          }
        }}
        title="Unlink Project"
        message={`Are you sure you want to unlink "${projectToUnlink?.name}" from this team? Team members will retain their current access level to the project, but new members will not be automatically added.`}
        confirmText="Unlink"
        cancelText="Cancel"
        isDanger={true}
      />

      {/* Create Channel Modal */}
      {isCreateChannelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create Channel</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Channel Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewChannelType('TEXT')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all ${
                        newChannelType === 'TEXT' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Hash className="w-4 h-4" /> Text
                    </button>
                    <button
                      onClick={() => setNewChannelType('VOICE')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all ${
                        newChannelType === 'VOICE' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Video className="w-4 h-4" /> Voice
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Channel Name</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. general, announcements"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsCreateChannelModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newChannelName.trim()) return;
                    try {
                      await teamApi.createChannel(team.id, { name: newChannelName, type: newChannelType });
                      const updatedChannels = await teamApi.getChannels(team.id);
                      setChannels(updatedChannels);
                      setIsCreateChannelModalOpen(false);
                      setNewChannelName('');
                    } catch (e) {
                      console.error('Failed to create channel', e);
                    }
                  }}
                  disabled={!newChannelName.trim()}
                  className="px-4 py-2 bg-[#D4AF37] rounded-lg font-medium text-black hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function TeamWorkspace() {
  return (
    <ErrorBoundary>
      <TeamWorkspaceContent />
    </ErrorBoundary>
  );
}
