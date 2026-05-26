import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { User, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { CosmicStars } from '../components/workspace/CosmicStars';
import { apiBaseUrl } from '../services/env';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();

  // Pre-fill from JWT
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login', { replace: true }); return; }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.onboardingComplete === true || decoded.onboardingComplete === "true") {
        navigate('/dashboard', { replace: true });
        return;
      }
      setDisplayName(decoded.fullName || '');
      // Suggest a clean username from their name
      const suggestedUsername = (decoded.fullName || decoded.email?.split('@')[0] || '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9._]/g, '')
        .substring(0, 30);
      setUsername(suggestedUsername);
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    if (!/^[a-z0-9._]+$/.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Only lowercase letters, numbers, dots and underscores');
      return;
    }

    setUsernameStatus('checking');
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${apiBaseUrl}/api/onboarding/check-username?username=${encodeURIComponent(username)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.available) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError(data.reason || 'Username is taken');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [username]);

  const handleSubmit = useCallback(async () => {
    if (usernameStatus !== 'available' || !displayName.trim()) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiBaseUrl}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: username.trim(), displayName: displayName.trim() })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to complete setup');
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.accessToken);
      toast.success('Welcome to Parallax!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }, [username, displayName, usernameStatus, navigate]);

  const isValid = displayName.trim().length > 0 && usernameStatus === 'available';

  return (
    <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden flex items-center justify-center">
      <CosmicStars />
      
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#D4AF37] rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] mb-6 shadow-lg shadow-[#D4AF37]/20">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Parallax</h1>
          <p className="text-white/50 text-lg">Set up your identity to get started</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#111113] border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl">
          
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
              />
            </div>
            <p className="text-xs text-white/40 mt-1.5">This is how other users will see you</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '').substring(0, 30))}
                placeholder="pick_a_username"
                maxLength={30}
                className="w-full pl-8 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-white/40 animate-spin" />}
                {usernameStatus === 'available' && <Check className="w-5 h-5 text-emerald-400" />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X className="w-5 h-5 text-red-400" />}
              </div>
            </div>
            {usernameError && <p className="text-xs text-red-400 mt-1.5">{usernameError}</p>}
            {usernameStatus === 'available' && <p className="text-xs text-emerald-400 mt-1.5">Username is available!</p>}
            {usernameStatus === 'idle' && username.length > 0 && username.length < 3 && <p className="text-xs text-white/40 mt-1.5">Must be at least 3 characters</p>}
          </div>

          {/* Preview */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center text-black font-bold text-lg">
              {displayName.trim().split(/\s+/).length >= 2
                ? (displayName.trim().split(/\s+/)[0][0] + displayName.trim().split(/\s+/)[1][0]).toUpperCase()
                : displayName.trim().substring(0, 2).toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-semibold text-white">{displayName.trim() || 'Your Name'}</div>
              <div className="text-sm text-white/40">@{username || 'username'}</div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isValid && !submitting
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20 hover:scale-[1.02]'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Setting up...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Complete Setup</>
            )}
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          You can change these later in your profile settings
        </p>
      </div>
    </div>
  );
}
