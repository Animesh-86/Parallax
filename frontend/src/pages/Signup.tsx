import { useState } from 'react';
import { ArrowRight, Check, Chrome, Code2, Github, Cpu, Zap } from 'lucide-react';

import { useNavigate, Link } from 'react-router-dom';
import api from "../services/api";
import { apiBaseUrl } from "../services/env";
import { toast } from "sonner";

export default function Signup() {
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
    });

    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!formData.acceptTerms) {
            toast.error("You must accept the terms to continue");
            return;
        }

        try {
            const res = await api.post("/api/auth/signup", {
                fullName: formData.fullName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });

            // Accept token from multiple possible locations and store under `access_token`
            const rawToken =
                res.data?.token ||
                res.data?.accessToken ||
                res.data?.access_token ||
                res.headers?.authorization;

            if (rawToken) {
                const accessToken = typeof rawToken === "string" && rawToken.startsWith("Bearer ")
                    ? rawToken.slice(7)
                    : rawToken;
                localStorage.setItem("access_token", accessToken);
            }

            toast.success("Account created successfully!");
            navigate("/dashboard");

        } catch (err: any) {
            console.error("Signup failed:", err);

            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Signup failed. Check your details and try again.");
            }
        }
    };


    // SOCIAL AUTH
    const handleGoogleSignup = () => {
        window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
    };

    const handleGitHubSignup = () => {
        window.location.href = `${apiBaseUrl}/oauth2/authorization/github`;
    };

    return (
        <div
            className="min-h-screen bg-[#09090B] text-white relative overflow-hidden flex items-center justify-center py-12">

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#D4AF37] rounded-full blur-[150px] opacity-20" />
                <div
                    className="absolute bottom-1/3 left-1/4 w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[150px] opacity-10" />
                <div
                    className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-[#F59E0B] rounded-full blur-[150px] opacity-10" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-8 flex items-center justify-between gap-16">
                {/* Left Side - Visual Illustration */}
                <div className="flex-1 space-y-8">
                    <div className="relative w-full h-96 flex items-center justify-start ml-4">
                        <div className="relative z-10">
                            <div
                                className="w-48 h-48 rounded-full bg-[#D4AF37] flex items-center justify-center relative">
                                <Code2 className="w-24 h-24" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-xl">
                        <h1 className="text-6xl font-bold leading-tight">
                            Welcome to Your
                            <br />
                            <span className="text-[#D4AF37]">
                                Coding Universe
                            </span>
                        </h1>
                        <p className="text-xl text-[#CBD5E1]">
                            Start your journey with Parallax and collaborate with developers worldwide.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {[{ icon: Code2, text: 'Real-time Collaboration' }, {
                            icon: Zap,
                            text: 'Lightning Fast'
                        }, { icon: Cpu, text: 'AI-Powered' }].map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm"
                                >
                                    <Icon className="w-4 h-4 text-[#D4AF37]" />
                                    <span className="text-sm text-[#CBD5E1]">{feature.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side - Signup Form */}
                <div className="w-full max-w-md">
                    <div className="bg-[#0D0D0F]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold mb-2">Create Your Account</h2>
                            <p className="text-[#A1A1AA]">Join Parallax today!</p>
                        </div>
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => handleChange("fullName", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => handleChange("username", e.target.value)}

                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleChange("password", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                required
                            />
                        </div>


                        <form className="space-y-4" onSubmit={handleSignup}>
                            {/* ...input fields unchanged... */}
                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleChange('acceptTerms', !formData.acceptTerms)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${formData.acceptTerms
                                            ? 'bg-[#D4AF37] border-[#D4AF37]'
                                            : 'border-white/30'
                                        }`}
                                >
                                    {formData.acceptTerms && <Check className="w-3 h-3" />}
                                </button>
                                <label className="text-sm text-[#CBD5E1]">
                                    I accept the{' '}
                                    <Link
                                        to="/terms"
                                        target="_blank"
                                        className="text-[#D4AF37] hover:text-[#D4AF37] transition-colors underline"
                                    >
                                        Terms of Service
                                    </Link>
                                    {' '}
                                    and{' '}
                                    <Link
                                        to="/privacy"
                                        target="_blank"
                                        className="text-[#D4AF37] hover:text-[#D4AF37] transition-colors underline"
                                    >
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#D4AF37] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#F59E0B] transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                <span>Create Account</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#0D0D0F] text-[#A1A1AA]">or sign up with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleGitHubSignup}
                                className="bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/10 text-white py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Github className="w-5 h-5" />
                                <span>GitHub</span>
                            </button>

                            <button
                                onClick={handleGoogleSignup}
                                className="bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/10 text-white py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Chrome className="w-5 h-5" />
                                <span>Google</span>
                            </button>

                        </div>

                        {/* ✅ Fixed Login Link */}
                        <div className="mt-6 text-center">
                            <p className="text-[#A1A1AA]">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-[#D4AF37] hover:text-[#D4AF37] font-semibold transition-colors"
                                >
                                    Login
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
