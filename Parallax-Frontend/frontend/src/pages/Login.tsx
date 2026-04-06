import { useState } from "react";
import { ArrowRight, Chrome, Code2, Github, Lock, Mail, Terminal } from "lucide-react";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { apiBaseUrl } from "../services/env";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post("/api/auth/login", {
                email,
                password,
            });

            // Accept token from multiple possible locations (body.token, body.accessToken, body.access_token, or Authorization header)
            const rawToken =
                res.data?.token ||
                res.data?.accessToken ||
                res.data?.access_token ||
                res.headers?.authorization;

            if (!rawToken) {
                console.warn("Login response did not contain a token", res);
                throw new Error("Invalid login response");
            }

            // If backend sends "Bearer <jwt>", strip the prefix
            const accessToken = typeof rawToken === "string" && rawToken.startsWith("Bearer ")
                ? rawToken.slice(7)
                : rawToken;

            console.log("🔑 login token from backend:", rawToken);
            console.log("🔑 normalized accessToken:", accessToken);

            // Store only the bare JWT (no "Bearer ")
            localStorage.setItem("access_token", accessToken);


            // Navigate to dashboard
            navigate("/dashboard");
        } catch (err: any) {
            console.error("Login failed:", err);

            let message = "Login failed";

            // Clear and actionable message if we got an invalid response (no token)
            if (err?.message === "Invalid login response") {
                message = "Login succeeded but server did not return an access token. Check server logs.";
            } else if (err?.response?.status === 400 || err?.response?.status === 401) {
                message = "Invalid email or password";
            } else if (err?.response?.status === 500) {
                message = "Server error. Try again later.";
            }

            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
    };

    const handleGitHubLogin = () => {
        window.location.href = `${apiBaseUrl}/oauth2/authorization/github`;
    };


    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden flex items-center justify-center">
            {/* Cosmic Background */}
            <CosmicStars />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#38BDF8] rounded-full blur-[150px] opacity-20 animate-pulse" />
                <div
                    className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#2DD4BF] rounded-full blur-[150px] opacity-15" />
                <div
                    className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#7DD3FC] rounded-full blur-[150px] opacity-10" />
            </div>

            {/* Floating Particles */}
            <div className="fixed inset-0 pointer-events-none">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                            animationDelay: `${Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { transform: translateY(-100px) translateX(50px); opacity: 0.6; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-8 flex items-center justify-between gap-16">
                {/* Left Side - Visual Area */}
                <div className="flex-1 space-y-8">
                    {/* Logo with Glow */}
                    <div className="relative inline-block">
                        <div className="relative">
                            <div
                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#2DD4BF] flex items-center justify-center relative z-10">
                                <Code2 className="w-12 h-12" />
                            </div>
                            <div
                                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#2DD4BF] blur-2xl opacity-60 animate-pulse" />
                        </div>

                        {/* Rotating Glyphs */}
                        <div className="absolute -inset-4 pointer-events-none">
                            <div className="relative w-full h-full"
                                style={{ animation: 'rotate-slow 20s linear infinite' }}>
                                {[0, 60, 120, 180, 240, 300].map((angle) => (
                                    <div
                                        key={angle}
                                        className="absolute w-2 h-2 bg-[#2DD4BF] rounded-full"
                                        style={{
                                            top: '50%',
                                            left: '50%',
                                            transform: `rotate(${angle}deg) translateY(-50px)`,
                                            boxShadow: '0 0 10px #2DD4BF',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="space-y-4 max-w-xl">
                        <h1 className="text-6xl font-bold leading-tight">
                            Code Together.
                            <br />
                            <span
                                className="bg-gradient-to-r from-[#38BDF8] via-[#2DD4BF] to-[#7DD3FC] bg-clip-text text-transparent">
                                From Anywhere.
                            </span>
                        </h1>
                        <p className="text-xl text-[#CBD5E1]">
                            Join the next-generation collaborative coding platform.
                        </p>
                    </div>

                    {/* Constellation Lines */}
                    <div className="relative h-48 opacity-40">
                        <svg className="w-full h-full" viewBox="0 0 400 200">
                            {/* Connection lines */}
                            <line x1="50" y1="50" x2="150" y2="100" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
                            <line x1="150" y1="100" x2="250" y2="80" stroke="#2DD4BF" strokeWidth="1" opacity="0.5" />
                            <line x1="250" y1="80" x2="350" y2="120" stroke="#7DD3FC" strokeWidth="1" opacity="0.5" />
                            <line x1="150" y1="100" x2="200" y2="150" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />

                            {/* Nodes */}
                            <circle cx="50" cy="50" r="4" fill="#38BDF8"
                                style={{ filter: 'drop-shadow(0 0 6px #38BDF8)' }} />
                            <circle cx="150" cy="100" r="4" fill="#2DD4BF"
                                style={{ filter: 'drop-shadow(0 0 6px #2DD4BF)' }} />
                            <circle cx="250" cy="80" r="4" fill="#7DD3FC"
                                style={{ filter: 'drop-shadow(0 0 6px #7DD3FC)' }} />
                            <circle cx="350" cy="120" r="4" fill="#38BDF8"
                                style={{ filter: 'drop-shadow(0 0 6px #38BDF8)' }} />
                            <circle cx="200" cy="150" r="4" fill="#2DD4BF"
                                style={{ filter: 'drop-shadow(0 0 6px #2DD4BF)' }} />
                        </svg>
                    </div>

                    {/* Terminal-style Message */}
                    <div
                        className="bg-[#0C1220]/60 backdrop-blur-md border border-[#38BDF8]/20 rounded-xl p-4 font-mono text-sm">
                        <div className="flex items-center gap-2 text-[#2DD4BF] mb-2">
                            <Terminal className="w-4 h-4" />
                            <span>$ Parallax --welcome</span>
                        </div>
                        <div className="text-[#94A3B8]">
                            {'>'} Initializing collaborative workspace...
                            <br />
                            {'>'} Loading real-time sync engine...
                            <br />
                            <span className="text-[#2DD4BF]">{'>'} Ready to build together! 🚀</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md">
                    <div className="bg-[#0C1220]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-2">Login to Parallax</h2>
                            <p className="text-[#94A3B8]">Welcome back, developer! 👋</p>
                        </div>

                        {/* Form */}
                        <form className="space-y-6" onSubmit={handleLogin}>
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="your.email@example.com"
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#94A3B8] focus:outline-none transition-all ${focusedField === 'email'
                                                ? 'border-[#38BDF8] shadow-[0_0_20px_rgba(107,84,255,0.3)]'
                                                : 'border-white/10'
                                            }`}
                                    />
                                    {focusedField === 'email' && (
                                        <div
                                            className="absolute inset-0 rounded-xl border-2 border-[#38BDF8]/50 pointer-events-none animate-pulse" />
                                    )}
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="••••••••"
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#94A3B8] focus:outline-none transition-all ${focusedField === 'password'
                                                ? 'border-[#38BDF8] shadow-[0_0_20px_rgba(107,84,255,0.3)]'
                                                : 'border-white/10'
                                            }`}
                                    />
                                    {focusedField === 'password' && (
                                        <div
                                            className="absolute inset-0 rounded-xl border-2 border-[#38BDF8]/50 pointer-events-none animate-pulse" />
                                    )}
                                </div>
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="text-sm text-[#2DD4BF] hover:text-[#38BDF8] transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] text-white font-semibold py-3 px-6 rounded-xl hover:shadow-[0_0_30px_rgba(107,84,255,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                <span>Login</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#0C1220] text-[#94A3B8]">or continue with</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full bg:white/5 border border-white/10 hover:border-[#2DD4BF]/50 hover:bg-white/10 text-white py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 group"
                            >
                                <Chrome className="w-5 h-5" />
                                <span>Continue with Google</span>
                            </button>

                            <button
                                onClick={handleGitHubLogin}
                                className="w-full bg:white/5 border border-white/10 hover:border-[#38BDF8]/50 hover:bg-white/10 text-white py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 group"
                            >
                                <Github className="w-5 h-5" />
                                <span>Continue with GitHub</span>
                            </button>

                        </div>

                        {/* Sign Up Link */}
                        <div className="mt-8 text-center">
                            <p className="text-[#94A3B8]">
                                Don&apos;t have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/signup')}
                                    className="text-[#2DD4BF] hover:text-[#38BDF8] font-semibold transition-colors"
                                >
                                    Sign Up
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div
                        className="absolute -right-20 top-1/2 w-40 h-40 bg-[#38BDF8] rounded-full blur-[100px] opacity-20 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
