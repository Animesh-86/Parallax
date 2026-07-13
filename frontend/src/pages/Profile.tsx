import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  Award,
  Settings,
  TrendingUp,
  LogOut,
  MapPin,
  Mail,
  Calendar,
  Code2,
  Users,
  Flame,
  GitBranch,
  Palette,
  Edit3,
  ChevronRight,
  Share2
} from 'lucide-react';
import { CosmicStars } from "../components/workspace/CosmicStars";
import { UserProfile, profileService } from '../services/profileService';
import { toast } from 'sonner';
import ProfileSettings from '../components/profile/ProfileSettings';
import { ProfileBanner } from '../components/profile/ProfileBanner';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';
import { apiBaseUrl } from '../services/env';
import { useProfile } from '../context/ProfileContext';

type TabView = 'profile' | 'badges' | 'streaks' | 'contributions' | 'settings' | 'preferences';

export default function Profile() {
  const navigate = useNavigate();
  const { username } = useParams(); // If present, viewing public profile

  const [activeTab, setActiveTab] = useState<TabView>('profile');
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [error, setError] = useState('');
  
  // Use global context
  const { profile: globalProfile, loading: loadingGlobal, displayName: globalDisplayName } = useProfile();
  
  const isMe = !username;

  useEffect(() => {
    const fetchPublic = async () => {
      if (username) {
        setLoadingPublic(true);
        setError('');
        try {
          const data = await profileService.getPublicProfile(username);
          setPublicProfile(data);
        } catch (err: any) {
          console.error(err);
          if (err.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load profile');
          }
        } finally {
          setLoadingPublic(false);
        }
      }
    };
    fetchPublic();
  }, [username]);

  const profile = isMe ? globalProfile : publicProfile;
  const loading = isMe ? loadingGlobal : loadingPublic;
  const displayName = isMe && globalProfile ? globalDisplayName : (() => {
    if (!profile) return "Unknown";
    const vals = [profile.displayName, profile.fullName, profile.name, profile.username].map(v => v?.trim());
    const [dn, fn, n, un] = vals;
    if (dn && dn.length > 0 && dn !== '?' && dn !== 'User') return dn;
    if (fn && fn.length > 0) return fn;
    if (n && n.length > 0 && n !== 'User') return n;
    return un || "Unknown Star";
  })();

  // Sidebar items - Filter based on View Mode
  const sidebarItems = [
    { id: 'profile' as TabView, label: 'Profile', icon: User, showPublic: true },
    { id: 'settings' as TabView, label: 'Settings', icon: Settings, showPublic: false }, // Private only
  ];

  const visibleItems = sidebarItems.filter(item => isMe || item.showPublic);

  // Stats Logic
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    const getProjectCount = async () => {
      if (isMe) {
        try {
          const token = localStorage.getItem("access_token");
          if (!token) return;

          const res = await fetch(`${apiBaseUrl}/api/v1/projects`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setProjectCount(Array.isArray(data) ? data.length : 0);
          }
        } catch (e) {
          console.error("Failed to fetch project count", e);
        }
      } else {
        setProjectCount(profile?.stats?.projects || 0);
      }
    };

    if (profile) {
      getProjectCount();
    }
  }, [profile, isMe]);

  const stats = [
    { label: 'Projects', value: projectCount, icon: Code2, color: '#D4AF37' },
    { label: 'Rooms Joined', value: profile?.stats?.roomsJoined || 0, icon: Users, color: '#A1A1AA' },
    { label: 'Contributions', value: profile?.stats?.contributions || 0, icon: GitBranch, color: '#A1A1AA' },
    { label: 'Badges', value: profile?.badges?.length || 0, icon: Award, color: '#F59E0B' },
    { label: 'Streak', value: profile?.stats?.currentStreak || 0, icon: Flame, color: '#EF6461' },
  ];

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-white/60 mb-6">{error || 'Something went wrong'}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden">
      {/* Cosmic background */}
      <CosmicStars />
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#A1A1AA] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/95 backdrop-blur-md border-b border-white/5">
        <div className="px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#A1A1AA] flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-sm text-white/60">Parallax</span>
          </button>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Dashboard</button>
            {isMe && (
              <button onClick={() => {
                localStorage.removeItem('access_token');
                navigate('/login');
              }} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex pt-16 min-h-screen">
        {/* Sidebar - ONLY VISIBLE FOR ME (Private View) */}
        {isMe && (
          <aside className="w-64 bg-[#09090B] border-r border-white/5 p-4 fixed left-0 top-16 bottom-0 overflow-y-auto z-40">
            <div className="space-y-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#A1A1AA]/20 border border-[#D4AF37]/50 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}

              <div className="pt-4 mt-4 border-t border-white/5">
                <button onClick={() => {
                  localStorage.removeItem('access_token');
                  navigate('/login');
                }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#9A3412] hover:bg-[#EF6461]/10 transition-all">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Content */}
        <main className={`flex-1 p-8 relative z-10 transition-all ${isMe ? 'ml-64' : 'max-w-7xl mx-auto w-full'}`}>

          {/* PROFILE VIEW */}
          {(activeTab === 'profile' || !isMe) && (
            <div className="space-y-8">
              <div className="bg-[#09090B] border border-white/5 rounded-3xl overflow-hidden">
                <ProfileBanner
                  username={profile.username}
                  stats={{
                    projects: projectCount,
                    contributions: profile.stats?.contributions || 0,
                    streak: profile.stats?.currentStreak || 0,
                    roomsJoined: profile.stats?.roomsJoined || 0
                  }}
                />

                <div className="px-8 pb-8">
                  <div className="flex items-start gap-6 -mt-16 mb-6">
                    {/* Avatar (No Camera Trigger) */}
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-3xl font-bold border-4 border-[#09090B] relative z-10 bg-[#0D0D0F] overflow-hidden text-[#D4AF37]">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                        ) : (
                          profile.displayName?.substring(0, 2).toUpperCase() || "ME"
                        )}
                      </div>
                    </div>

                    <div className="flex-1 relative z-10 mt-20">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                        <div>
                          {/* Name Header */}
                          <h1 className="text-2xl font-bold mb-1 text-white min-h-[2rem]">
                            {displayName}
                          </h1>

                          {/* Username Handle */}
                          <p className="text-lg text-white/50 font-medium">@{profile.username}</p>
                        </div>

                        {/* Only Share button here, Edit is in Settings */}
                        <div className="flex items-center gap-2">
                          {!isMe && (
                            <button onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success("Profile link copied!");
                            }} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-sm whitespace-nowrap">
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-white/70 mb-4 max-w-2xl min-h-[1.5rem]">{profile.bio || "No bio yet."}</p>

                      <div className="flex items-center gap-6 text-sm text-white/60">
                        {profile.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {profile.location}
                          </div>
                        )}
                        {isMe && profile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {profile.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Joined {profile.joinedAt && new Date(profile.joinedAt).getFullYear() > 1970 ? new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="relative group">
                          {/* Glow effect behind the card */}
                          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" style={{ backgroundImage: `linear-gradient(to right, ${stat.color}, transparent)` }} />
                          <div className="relative bg-[#09090B]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/30 transition-all duration-300 transform group-hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-2.5 rounded-xl transition-colors duration-300" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                <Icon className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="text-3xl font-bold mb-1 tracking-tight">{stat.value}</div>
                            <div className="text-sm font-medium text-white/50">{stat.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grid Layout Container */}
              <div className="flex flex-col gap-6">
                
                {/* Row 1: Streaks & Badges */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                  
                  {/* Coding Streaks */}
                  <div className="h-full bg-[#09090B]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#EF6461]/10 rounded-full blur-[100px] pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
                      <Flame className="w-5 h-5 text-[#EF6461]" />
                      Coding Streaks
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-all duration-300 border-l-4 border-l-[#EF6461]">
                            <div>
                                <p className="text-white/50 text-xs font-medium mb-1 uppercase tracking-wider">Current Streak</p>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">{profile.stats?.currentStreak || 0}</h2>
                                    <span className="text-white/40 text-sm font-medium">days</span>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#EF6461] blur-lg opacity-30 rounded-full animate-pulse" />
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EF6461]/20 to-transparent flex items-center justify-center border border-[#EF6461]/30 relative z-10">
                                    <Flame className="w-6 h-6 text-[#EF6461]" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-all duration-300 border-l-4 border-l-[#D4AF37]">
                            <div>
                                <p className="text-white/50 text-xs font-medium mb-1 uppercase tracking-wider">Longest Streak</p>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">{profile.stats?.longestStreak || 0}</h2>
                                    <span className="text-white/40 text-sm font-medium">days</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent flex items-center justify-center border border-[#D4AF37]/30">
                                <Award className="w-6 h-6 text-[#D4AF37]" />
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Achievement Badges */}
                  <div className="h-full bg-[#09090B]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-3">
                        <Award className="w-5 h-5 text-[#D4AF37]" />
                        Achievement Badges
                      </h2>
                      <div className="text-xs font-medium text-white/40">{profile.badges?.length || 0} Earned</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Earned Badges */}
                        {profile.badges?.map(badge => (
                            <div key={badge.id} className="relative group cursor-default">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 rounded-xl" />
                                <div className="relative bg-[#0D0D0F] border border-white/10 rounded-xl p-5 flex flex-col items-center text-center hover:border-[#D4AF37]/50 transition-all duration-500 transform group-hover:-translate-y-1 group-hover:shadow-2xl h-full">
                                    <div className="absolute top-2 right-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Earned</div>
                                    <div className="w-16 h-16 mb-4 relative">
                                        <div className="absolute inset-0 bg-[#D4AF37] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                                        <img src={badge.iconUrl} alt={badge.name} className="w-full h-full object-contain relative z-10 filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">{badge.name}</h3>
                                    <p className="text-white/50 text-xs mb-4 flex-1">{badge.description}</p>
                                    <div className="px-3 py-1 bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white tracking-widest uppercase w-full">
                                        {badge.tier}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Unearned / Locked Badges */}
                        {[
                            { id: 'avail-1', name: 'Cosmic Pioneer', description: 'Create your first project.', tier: 'Bronze' },
                            { id: 'avail-2', name: 'Midnight Orbit', description: 'Code between midnight and 4 AM.', tier: 'Silver' },
                            { id: 'avail-3', name: 'Stellar Constellation', description: 'Achieve a 30-day coding streak.', tier: 'Gold' },
                            { id: 'avail-4', name: 'Void Cleaner', description: 'Resolve 10 syntax errors in one session.', tier: 'Bronze' }
                        ].filter(b => !(profile.badges?.find(earned => earned.name === b.name))).slice(0, 3).map(badge => (
                            <div key={badge.id} className="relative group cursor-default opacity-50 hover:opacity-100 transition-opacity duration-300">
                                <div className="relative bg-[#0D0D0F]/50 border border-white/5 rounded-xl p-5 flex flex-col items-center text-center hover:border-white/20 transition-all duration-300 h-full">
                                    <div className="w-16 h-16 mb-4 relative grayscale flex items-center justify-center">
                                        <Award className="w-12 h-12 text-white/20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/60 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold text-white/50 mb-1">{badge.name}</h3>
                                    <p className="text-white/30 text-xs mb-4 flex-1">{badge.description}</p>
                                    <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-white/30 tracking-widest uppercase w-full">
                                        {badge.tier}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* View All Badges Card */}
                        <div className="relative group cursor-pointer" onClick={() => setActiveTab('badges')}>
                            <div className="relative bg-[#0D0D0F]/30 border border-white/5 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-white/20 hover:bg-white/5 transition-all duration-300 h-full min-h-[220px]">
                                <div className="w-12 h-12 mb-3 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 group-hover:text-white"><path d="m9 18 6-6-6-6"/></svg>
                                </div>
                                <h3 className="text-sm font-bold text-white/70 mb-1 group-hover:text-white">View All Badges</h3>
                                <p className="text-white/30 text-xs px-4">Explore the cosmic achievement directory</p>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Contribution Graph (Full Width) */}
                <div className="w-full">
                  {/* Contribution Graph */}
                  <div className="bg-[#09090B]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 overflow-hidden relative group">
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4ADE80]/10 rounded-full blur-[120px] pointer-events-none transition-opacity opacity-30 group-hover:opacity-60" />
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
                      <GitBranch className="w-5 h-5 text-[#4ADE80]" />
                      Contribution Graph
                    </h2>
                    <div className="bg-[#0D0D0F] border border-white/10 rounded-xl p-6 w-full overflow-x-auto relative z-10 shadow-2xl">
                        <div className="w-max mx-auto">
                            {/* CSS Grid Heatmap */}
                            <div className="flex gap-[3px]">
                                {Array.from({ length: 52 }).map((_, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                                            const dayOffset = (52 * 7) - (weekIndex * 7 + dayIndex) - 1;
                                            const date = new Date();
                                            date.setDate(date.getDate() - dayOffset);
                                            const dateString = date.toISOString().split('T')[0];
                                            
                                            const contribution = profile.contributionGraph?.find(c => c.date === dateString);
                                            const count = contribution ? contribution.count : 0;
                                            
                                            let bgColor = 'bg-white/5 hover:bg-white/20';
                                            let glow = '';
                                            if (count > 0 && count <= 2) { bgColor = 'bg-[#4ADE80]/30 hover:bg-[#4ADE80]/50'; glow = 'hover:shadow-[0_0_8px_rgba(74,222,128,0.5)]'; }
                                            else if (count > 2 && count <= 5) { bgColor = 'bg-[#4ADE80]/60 hover:bg-[#4ADE80]/80'; glow = 'hover:shadow-[0_0_12px_rgba(74,222,128,0.7)]'; }
                                            else if (count > 5) { bgColor = 'bg-[#4ADE80] hover:bg-[#4ADE80]'; glow = 'hover:shadow-[0_0_16px_rgba(74,222,128,1)]'; }

                                            return (
                                                <div 
                                                    key={dayIndex} 
                                                    className={`w-[11px] h-[11px] rounded-[2px] transition-all duration-200 cursor-pointer ${bgColor} ${glow}`} 
                                                    title={`${count} contributions on ${dateString}`}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 flex items-center justify-between text-xs font-medium text-white/50">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="w-3.5 h-3.5 text-[#4ADE80]/70" />
                                    Total Contributions: <span className="text-white font-bold">{profile.stats?.contributions || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Less</span>
                                    <div className="flex gap-[3px]">
                                        <div className="w-[11px] h-[11px] rounded-[2px] bg-white/5"></div>
                                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#4ADE80]/30"></div>
                                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#4ADE80]/60"></div>
                                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#4ADE80]"></div>
                                    </div>
                                    <span>More</span>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Recent Activity (Full Width) */}
                <div className="w-full">
                  {/* Activity Timeline */}
                  <div className="bg-[#09090B]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-[#A1A1AA]" />
                      Recent Activity
                    </h2>
                    <div className="relative pl-5">
                      {/* Vertical Line */}
                      <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
                      
                      <div className="space-y-6 relative">
                        {profile.recentActivity && profile.recentActivity.length > 0 ? (
                            profile.recentActivity.map((activity, index) => (
                                <div key={activity.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#09090B] border-2 border-[#D4AF37] group-hover:scale-125 group-hover:bg-[#D4AF37] transition-all duration-300 z-10" />
                                    
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 transform group-hover:-translate-x-1">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <p className="text-white text-sm font-medium">{activity.description}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded-full text-white/60 whitespace-nowrap">
                                                {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-white/40 text-xs flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(activity.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center text-center">
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
                                  <TrendingUp className="w-5 h-5 text-white/20 relative z-10" />
                              </div>
                              <div className="text-white/40 text-sm font-medium">No recent activity</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BADGES TAB */}
          {activeTab === 'badges' && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Award className="w-8 h-8 text-[#D4AF37]" />
                            Cosmic Achievement Directory
                        </h1>
                        <p className="text-white/50 text-sm">Explore all available badges and see what you've unlocked.</p>
                    </div>
                    <button onClick={() => setActiveTab('profile')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[
                        { id: 'c1', name: 'Cosmic Pioneer', description: 'Create your first project.', tier: 'Bronze' },
                        { id: 'c2', name: 'Midnight Orbit', description: 'Code between midnight and 4 AM.', tier: 'Silver' },
                        { id: 'c3', name: 'Stellar Constellation', description: 'Achieve a 30-day coding streak.', tier: 'Gold' },
                        { id: 'c4', name: 'Void Cleaner', description: 'Resolve 10 syntax errors in one session.', tier: 'Bronze' },
                        { id: 'c5', name: 'Supernova', description: 'Get 100 stars on a public project.', tier: 'Legendary' },
                        { id: 'c6', name: 'Galactic Voyager', description: 'Join 5 different rooms.', tier: 'Silver' },
                        { id: 'c7', name: 'Event Horizon', description: 'Write 10,000 lines of code.', tier: 'Gold' },
                        { id: 'c8', name: 'Quantum Weaver', description: 'Collaborate with 10 different users.', tier: 'Silver' },
                        { id: 'c9', name: 'Nebula Forger', description: 'Commit code 7 days in a row.', tier: 'Bronze' },
                        { id: 'c10', name: 'Dark Matter', description: 'Contribute to an open-source repo.', tier: 'Legendary' },
                        { id: 'c11', name: 'Asteroid Miner', description: 'Fix 50 bugs.', tier: 'Gold' },
                        { id: 'c12', name: 'Starship Captain', description: 'Create a team with 5+ members.', tier: 'Silver' }
                    ].map(badge => {
                        const earned = profile.badges?.find(b => b.name === badge.name);
                        const isEarned = !!earned;
                        
                        return (
                            <div key={badge.id} className={`relative group cursor-default transition-all duration-300 ${!isEarned ? 'opacity-50 hover:opacity-100' : ''}`}>
                                {isEarned && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 rounded-xl" />
                                )}
                                <div className={`relative bg-[#0D0D0F] border ${isEarned ? 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:-translate-y-1 hover:shadow-2xl' : 'border-white/5 hover:border-white/20'} rounded-xl p-6 flex flex-col items-center text-center transition-all duration-500 h-full`}>
                                    {isEarned && (
                                        <div className="absolute top-3 right-3 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Earned</div>
                                    )}
                                    <div className={`w-20 h-20 mb-5 relative flex items-center justify-center ${!isEarned ? 'grayscale' : ''}`}>
                                        {isEarned && <div className="absolute inset-0 bg-[#D4AF37] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />}
                                        
                                        {isEarned && earned.iconUrl ? (
                                            <img src={earned.iconUrl} alt={badge.name} className="w-full h-full object-contain relative z-10 filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center relative z-10">
                                                <Award className={`w-14 h-14 ${isEarned ? 'text-[#D4AF37]' : 'text-white/20'}`} />
                                                {!isEarned && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="bg-black/60 p-2 rounded-full backdrop-blur-sm border border-white/10">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                                                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className={`text-lg font-bold mb-2 ${isEarned ? 'text-white group-hover:text-[#D4AF37]' : 'text-white/50'} transition-colors`}>{badge.name}</h3>
                                    <p className={`${isEarned ? 'text-white/60' : 'text-white/30'} text-sm mb-5 flex-1`}>{badge.description}</p>
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase w-full ${
                                        isEarned 
                                        ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#D4AF37]' 
                                        : 'bg-white/5 border border-white/5 text-white/30'
                                    }`}>
                                        {badge.tier}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {/* SETTINGS TAB - Only for ME */}
          {isMe && activeTab === 'settings' && (
            <div className="space-y-8">
              <div><h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Settings className="w-8 h-8 text-[#D4AF37]" />Settings</h1></div>

              {/* Inline Profile Settings Form */}
              {profile && (
                <ProfileSettings
                  currentUser={profile}
                />
              )}

              {/* Account Preferences Card (Still as a card or can be moved later) */}
              <div className="grid grid-cols-1 gap-6 mt-8">
                <div className="bg-[#09090B] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all opacity-60">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#A1A1AA]/10 rounded-xl text-[#A1A1AA]">
                      <Palette className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">App Preferences</h3>
                  <p className="text-white/60 mb-6 text-sm">
                    Customize your workspace appearance and notification settings. (Coming Soon)
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
