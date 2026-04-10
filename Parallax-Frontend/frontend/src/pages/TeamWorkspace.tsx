import { useState, useEffect } from 'react';
import { Users, Loader, AlertCircle, UserPlus, Settings, TrendingUp, FileText, ListTodo, Activity, MessageSquare, MoreVertical, Crown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { NotificationBell } from '../components/NotificationBell';
import { CosmicStars } from '../components/workspace/CosmicStars';
import { teamApi, Team, TeamMember } from '../services/teamApi';

type TabView = 'overview' | 'members' | 'tasks' | 'docs' | 'settings';

export default function TeamWorkspace() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!teamId) {
      setError('No team selected');
      return;
    }

    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const [teamData, membersData] = await Promise.all([
          teamApi.getTeam(teamId),
          teamApi.getTeamMembers(teamId),
        ]);
        setTeam(teamData);
        setMembers(membersData);
      } catch (err) {
        console.error('Failed to load team:', err);
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

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

  const getRoleIcon = (role: string) => role === 'OWNER' ? Crown : role === 'ADMIN' ? Shield : Users;
  const getRoleColor = (role: string) =>
    role === 'OWNER' ? '#FBBF24' : role === 'ADMIN' ? '#38BDF8' : '#94A3B8';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060910] text-white flex items-center justify-center">
        <CosmicStars />
        <div className="text-center z-10">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-[#38BDF8]" />
          <p>Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#060910] text-white flex items-center justify-center">
        <CosmicStars />
        <div className="text-center z-10">
          <AlertCircle className="w-12 h-12 text-[#EF6461] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{error || 'Team not found'}</h2>
          <button onClick={() => navigate('/teams')} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg">
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
    <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
      <CosmicStars />
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#38BDF8] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#94A3B8] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060910]/95 backdrop-blur-md border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/teams')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#94A3B8] flex items-center justify-center font-semibold text-sm">
            {teamInitials}
          </div>
          <div>
            <h1 className="font-semibold text-sm">{team.name}</h1>
            <p className="text-xs text-white/40">{activeMembers.length} members</p>
          </div>
        </button>

        <nav className="flex items-center gap-1">
          {[
            { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
            { id: 'members' as const, label: 'Members', icon: Users },
            { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
            { id: 'docs' as const, label: 'Docs', icon: FileText },
            { id: 'settings' as const, label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-2 ${
                  activeTab === tab.id ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8]" />
                )}
              </button>
            );
          })}
        </nav>

        <NotificationBell />
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16 px-6 max-w-[1400px] mx-auto relative z-10">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left - Team Info */}
            <motion.div className="col-span-12 lg:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#060910] border border-white/5 rounded-2xl p-6">
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
                    <div className="flex justify-between"><span className="text-white/60">Active</span><span>{activeMembers.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Pending</span><span>{pendingMembers.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Online</span><span className="text-[#4ADE80]">{activeMembers.filter(m => m.isOnline).length}</span></div>
                  </div>
                  <button onClick={() => setActiveTab('members')} className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg text-sm font-medium">
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Invite Member
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Center - Stats */}
            <motion.div className="col-span-12 lg:col-span-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#060910] border border-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-3"><Activity className="w-5 h-5 text-[#38BDF8]" />Activity Feed</h2>
                <div className="space-y-4">
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#38BDF8]" />
                    <div>
                      <p className="text-sm"><span className="font-medium">Team created</span></p>
                      <p className="text-xs text-white/40 mt-1">{new Date(team.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right - Members Preview */}
            <motion.div className="col-span-12 lg:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-[#060910] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Members</h3>
                <div className="space-y-3">
                  {activeMembers.slice(0, 5).map(m => (
                    <div key={m.userId} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/20 flex items-center justify-center text-xs font-semibold">{m.fullName.slice(0, 2).toUpperCase()}</div>
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

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold mb-6">Team Members</h2>

            {(team.myRole === 'OWNER' || team.myRole === 'ADMIN') && (
              <div className="bg-[#060910] border border-white/5 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold mb-4">Invite New Member</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInviteMember()}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#38BDF8]/50"
                  />
                  <button
                    onClick={handleInviteMember}
                    disabled={!inviteEmail.trim() || inviting}
                    className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg text-sm font-medium disabled:opacity-50"
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
                    <div key={m.userId} className="bg-[#060910] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/20 flex items-center justify-center font-semibold">{m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{m.fullName}</h3>
                          <p className="text-xs text-white/50">{m.email}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${m.isOnline ? 'bg-[#4ADE80]' : 'bg-white/20'}`} />
                      </div>
                      <p className="text-xs text-white/40 mb-4">Role: {m.role}</p>
                      <button className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-all">
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
                    <div key={m.userId} className="bg-[#060910] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-semibold text-xs">{m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{m.fullName}</h3>
                          <p className="text-xs text-white/50">{m.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mb-4">Invited {m.invitedAt ? new Date(m.invitedAt).toLocaleDateString() : 'recently'}</p>
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

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold mb-6">Tasks</h2>
            <div className="bg-[#060910] border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-white/60">Task board coming soon</p>
            </div>
          </motion.div>
        )}

        {/* DOCS TAB */}
        {activeTab === 'docs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold mb-6">Documentation</h2>
            <div className="bg-[#060910] border border-white/5 rounded-2xl p-8 prose prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-4">Welcome to {team.name}</h3>
              <p className="text-white/70">{team.description || 'Team collaboration space'}</p>
              <p className="text-white/70 mt-4"><strong>Members:</strong> {activeMembers.length} active</p>
            </div>
          </motion.div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6">Team Settings</h2>
            {team.myRole === 'OWNER' || team.myRole === 'ADMIN' ? (
              <div className="space-y-6">
                <div className="bg-[#060910] border border-white/5 rounded-2xl p-6">
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
                <div className="bg-[#060910] border border-[#EF6461]/20 rounded-2xl p-6">
                  <h3 className="font-semibold mb-2 text-[#9A3412]">Danger Zone</h3>
                  <p className="text-sm text-white/60 mb-4">Deleting is permanent.</p>
                  <button className="px-4 py-2 bg-[#EF6461]/10 border border-[#EF6461]/30 rounded-lg text-sm text-[#9A3412] hover:bg-[#EF6461]/20">
                    Delete Team
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#060910] border border-white/5 rounded-2xl p-6">
                <p className="text-white/60">Only owners and admins can modify settings</p>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
