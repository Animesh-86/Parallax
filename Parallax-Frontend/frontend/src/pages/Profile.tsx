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

type TabView = 'profile' | 'badges' | 'streaks' | 'contributions' | 'settings' | 'preferences';

export default function Profile() {
  const navigate = useNavigate();
  const { username } = useParams(); // If present, viewing public profile

  const [activeTab, setActiveTab] = useState<TabView>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMe, setIsMe] = useState(false);

  // If visiting /profile, isMe is true. If /u/:username, check if it matches current user.
  // For simplicity, we trust the profileService output or the route.
  // Ideally we should check if username === current_user.username

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      let data: UserProfile;
      if (username) {
        // Public View
        data = await profileService.getPublicProfile(username);
        // Check if this public profile is actually ME (optional optimization, but strict separation is fine)
        // For now, assume if username param exists, it's public view.
        setIsMe(false);
      } else {
        // Private View (/profile)
        data = await profileService.getMyProfile();
        setIsMe(true);
      }
      setProfile(data);
      console.log("🐛 [Profile] Fetch Result:", data);
      console.log("🐛 [Profile] DisplayName:", data.displayName);
      console.log("🐛 [Profile] FullName:", data.fullName);
    } catch (err: any) {
      console.error(err);
      if (err.status === 404) {
        setError('User not found');
      } else if (err.status === 401) {
        setError('Unauthorized: Please log in again to view your profile.');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  // Sidebar items - Filter based on View Mode
  const sidebarItems = [
    { id: 'profile' as TabView, label: 'Profile', icon: User, showPublic: true },
    { id: 'badges' as TabView, label: 'Badges', icon: Award, showPublic: true },
    { id: 'streaks' as TabView, label: 'Streaks', icon: Flame, showPublic: true },
    { id: 'contributions' as TabView, label: 'Contributions', icon: TrendingUp, showPublic: true },
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

          const res = await fetch(`${apiBaseUrl}/api/projects`, {
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
    { label: 'Projects', value: projectCount, icon: Code2, color: '#38BDF8' },
    { label: 'Rooms Joined', value: profile?.stats?.roomsJoined || 0, icon: Users, color: '#94A3B8' },
    { label: 'Contributions', value: profile?.stats?.contributions || 0, icon: GitBranch, color: '#94A3B8' },
    { label: 'Badges', value: 0, icon: Award, color: '#FBBF24' },
    { label: 'Streak', value: 0, icon: Flame, color: '#EF6461' },
  ];

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#060910] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-white/60 mb-6">{error || 'Something went wrong'}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
      {/* Cosmic background */}
      <CosmicStars />
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#38BDF8] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#94A3B8] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060910]/95 backdrop-blur-md border-b border-white/5">
        <div className="px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#94A3B8] flex items-center justify-center">
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
          <aside className="w-64 bg-[#060910] border-r border-white/5 p-4 fixed left-0 top-16 bottom-0 overflow-y-auto z-40">
            <div className="space-y-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                      ? 'bg-gradient-to-r from-[#38BDF8]/20 to-[#94A3B8]/20 border border-[#38BDF8]/50 text-white'
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
              <div className="bg-[#060910] border border-white/5 rounded-3xl overflow-hidden">
                <ProfileBanner
                  username={profile.username}
                  stats={{
                    projects: projectCount,
                    contributions: profile.stats?.contributions || 0,
                    streak: profile.stats?.streak || 0,
                    roomsJoined: profile.stats?.roomsJoined || 0
                  }}
                />

                <div className="px-8 pb-8">
                  <div className="flex items-start gap-6 -mt-16 mb-6">
                    {/* Avatar (No Camera Trigger) */}
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-3xl font-bold border-4 border-[#060910] relative z-10 bg-[#0C1220] overflow-hidden text-[#38BDF8]">
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
                            {(() => {
                              // Extract raw values
                              const vals = [
                                profile.displayName,
                                profile.fullName,
                                profile.name,
                                profile.username
                              ].map(v => v?.trim());

                              const [dn, fn, n, un] = vals;

                              // 1. Display Name (if valid)
                              if (dn && dn.length > 0 && dn !== '?' && dn !== 'User') return dn;
                              // 2. Full Name
                              if (fn && fn.length > 0) return fn;
                              // 3. Name (Google Auth Name)
                              if (n && n.length > 0 && n !== 'User') return n;
                              // 4. Username (Fallback)
                              return un || "Unknown Star";
                            })()}
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
                          Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-5 gap-4">
                    {stats.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all group">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                              <Icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                          </div>
                          <div className="text-2xl font-bold mb-1">{stat.value}</div>
                          <div className="text-sm text-white/60">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-[#060910] border border-white/5 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-[#38BDF8]" />
                  Recent Activity
                </h2>
                <div className="bg-[#060910] border border-white/5 rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                  <div className="text-white/40 font-medium text-lg">Coming Soon</div>
                  <div className="text-sm text-white/20">We are tracking your coding journey across the cosmos</div>
                </div>
              </div>
            </div>
          )}

          {/* OTHER TABS - Only for ME */}
          {isMe && activeTab === 'badges' && (
            <div className="space-y-8">
              <div><h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Award className="w-8 h-8 text-[#38BDF8]" />Achievement Badges</h1></div>
              <div className="bg-[#060910] border border-white/5 rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-white/40 font-medium text-lg">Coming Soon</div>
              </div>
            </div>
          )}
          {isMe && activeTab === 'streaks' && (
            <div className="space-y-8">
              <div><h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Flame className="w-8 h-8 text-[#FBBF24]" />Coding Streaks</h1></div>
              <div className="bg-[#060910] border border-white/5 rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-white/40 font-medium text-lg">Coming Soon</div>
              </div>
            </div>
          )}
          {isMe && activeTab === 'contributions' && (
            <div className="space-y-8">
              <div><h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><GitBranch className="w-8 h-8 text-[#38BDF8]" />Contribution Graph</h1></div>
              <div className="bg-[#060910] border border-white/5 rounded-2xl h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-white/40 font-medium text-lg">Coming Soon</div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB - Only for ME */}
          {isMe && activeTab === 'settings' && (
            <div className="space-y-8">
              <div><h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Settings className="w-8 h-8 text-[#38BDF8]" />Settings</h1></div>

              {/* Inline Profile Settings Form */}
              {profile && (
                <ProfileSettings
                  currentUser={profile}
                  onProfileUpdate={fetchProfile}
                />
              )}

              {/* Account Preferences Card (Still as a card or can be moved later) */}
              <div className="grid grid-cols-1 gap-6 mt-8">
                <div className="bg-[#060910] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all opacity-60">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#94A3B8]/10 rounded-xl text-[#94A3B8]">
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
