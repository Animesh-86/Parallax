import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FluidFlowBackground } from '../components/effects/FluidFlowBackground';
import { ParticlesWaves } from '../components/effects/ParticlesWaves';
import { TextIlluminate } from '../components/effects/TextIlluminate';
import { Code2, Zap, Target, Sparkles, Rocket, Terminal, Globe, Shield, ArrowRight, Cpu, Layers } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden font-sans">
            {/* Synchronized Background System */}
            <div className="fixed inset-0 z-0">
                <ParticlesWaves
                    particleCount={800}
                    lineOpacity={0.15}
                    particleOpacity={0.3}
                    speed={0.015}
                    lineDistance={130}
                    color="#D4AF37"
                />
            </div>
            <div className="fixed inset-0 z-0 opacity-40">
                <FluidFlowBackground
                    colors={["#D4AF37", "#F59E0B", "#09090B", "#000000"]}
                    mouseForce={20}
                    cursorSize={120}
                    autoDemo={true}
                />
            </div>
            <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#09090B]/20 via-transparent to-[#09090B]" />

            <Header />

            <main className="relative z-10 pt-32 pb-24">
                <div className="max-w-6xl mx-auto px-6">
                    
                    {/* Architectural Header */}
                    <div className="mb-20 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
                                <span className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] font-mono">Registry_ID: PX-MSN-01</span>
                                <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
                            </div>
                            <TextIlluminate 
                                text="MISSION TRAJECTORY" 
                                className="text-4xl md:text-6xl font-bold tracking-[0.3em] uppercase"
                            />
                            <p className="text-[#A1A1AA] max-w-2xl mx-auto text-sm md:text-base tracking-wide leading-relaxed pt-4">
                                Re-engineering technical collaboration from the substrate up. 
                                A precision instrument for the modern developer.
                            </p>
                        </motion.div>
                    </div>

                    {/* Mission Terminal Structure */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
                        
                        {/* Core Narrative Terminal */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="lg:col-span-8 p-8 rounded-[32px] bg-zinc-950/40 border border-white/5 backdrop-blur-md relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Cpu className="w-24 h-24 text-[#D4AF37]" strokeWidth={0.5} />
                            </div>
                            
                            <div className="relative z-10 space-y-12">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] text-[#D4AF37] font-mono uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                                        DEP_ORIGIN: THE_WHY
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-widest uppercase">The Foundational Gap</h2>
                                    <div className="space-y-4 text-[#CBD5E1] text-sm leading-relaxed max-w-2xl">
                                        <p>
                                            Technical interviews and remote pair-programming often feel like disconnected simulations. Whiteboards lack execution, and screen-sharing lacks agency. 
                                        </p>
                                        <p>
                                            <span className="text-white font-medium">Parallax</span> was engineered to bridge this divide—providing a high-fidelity environment where two minds can converge on a single source of truth, with instant execution and zero friction.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] text-[#D4AF37] font-mono uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 invisible" />
                                        DEP_NATURE: THE_PLATFORM
                                    </div>
                                    <h3 className="text-xl font-bold tracking-widest uppercase">Architectural Agency</h3>
                                    <p className="text-[#CBD5E1] text-sm leading-relaxed max-w-2xl">
                                        Think Google Docs functionality with Dockerized isolation. It's a real-time collaborative coding system designed for technical interviews, pair programming, and architectural brainstorming.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Engineering Specs Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="p-8 rounded-[32px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                                    <h4 className="text-sm font-bold tracking-[0.2em] uppercase">SOLO_CRAFTED</h4>
                                </div>
                                <p className="text-xs text-[#CBD5E1] leading-relaxed mb-6">
                                    Every component of Parallax is meticulously developed by a single engineer. No templates, no agencies—just high-precision craft code designed to perform.
                                </p>
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                    <div className="flex justify-between text-[9px] font-mono text-[#71717A]">
                                        <span>SYSTEM_STATUS</span>
                                        <span className="text-[#D4AF37]">OPERATIONAL</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: "94%" }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-[#D4AF37]"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-8 rounded-[32px] bg-zinc-950/60 border border-white/10"
                            >
                                <h4 className="text-[10px] text-[#71717A] font-mono uppercase tracking-[0.2em] mb-4">Registry_Type</h4>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <Layers className="w-6 h-6 text-[#D4AF37]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold tracking-wider">COLLABORATIVE</p>
                                        <p className="text-xs text-[#A1A1AA]">SUBSYSTEM_V3.8</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Under the Hood - Technical Grid */}
                    <div className="mb-24">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div className="space-y-2">
                                <p className="text-[10px] text-[#D4AF37] font-mono tracking-[0.4em] uppercase">Tech_Capabilities</p>
                                <h2 className="text-2xl font-bold tracking-[0.2em] uppercase">Under The Hood</h2>
                            </div>
                            <div className="h-px bg-white/5 flex-grow mx-8 hidden md:block" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: Code2, title: "Registry: Editor", desc: "Monaco-driven collaborative environment with syntax-sync and low-latency cursor broadcasting." },
                                { icon: Terminal, title: "Runner: Docker", desc: "Isolated per-language environments providing instantaneous code execution and output streaming." },
                                { icon: Globe, title: "Comms: WebRTC", desc: "High-bandwidth voice and video synchronization for seamless technical discussion during sessions." },
                                { icon: Zap, title: "Flow: Zero-Init", desc: "Instant-on collaboration rooms that require no complex environment setup or account hurdles." },
                                { icon: Shield, title: "Protocol: Secure", desc: "Standardized OAuth 2.0 integration and encrypted session state management by design." },
                                { icon: Rocket, title: "Arch: Spring-Go", desc: "A robust backend infrastructure built on Spring Boot for maximum concurrency and scale." },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-6 rounded-[24px] bg-zinc-950/20 border border-white/5 hover:border-[#D4AF37]/30 hover:bg-zinc-950/40 transition-all duration-300 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/10 transition-colors">
                                        <item.icon className="w-5 h-5 text-[#A1A1AA] group-hover:text-[#D4AF37] transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold tracking-widest uppercase mb-2">{item.title}</h3>
                                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack Registry */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="p-12 rounded-[40px] bg-zinc-950 border border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold tracking-[0.2em] uppercase">Architecture</h3>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                                    The Parallax engine is built on a distributed substrate designed for real-time state synchronization across global participants.
                                </p>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                    { label: "FRONTEND", val: "React/TS/Vite" },
                                    { label: "BACKEND", val: "Java/Spring 17" },
                                    { label: "DATABASE", val: "PostgreSQL" },
                                    { label: "REALTIME", val: "WebSocket/RTC" },
                                    { label: "RUNNER", val: "Docker Engine" },
                                    { label: "ANIMATION", val: "Motion/React" },
                                ].map((stack, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[8px] font-mono text-[#D4AF37] tracking-[0.3em] mb-1">{stack.label}</p>
                                        <p className="text-[11px] font-bold tracking-wider">{stack.val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* CTA Section */}
                    <div className="mt-24 pt-12 border-t border-white/5 text-center">
                         <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                to="/signup"
                                className="px-10 py-4 bg-[#D4AF37] text-black font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#F59E0B] transition-colors flex items-center gap-3 group"
                            >
                                Get Started
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/"
                                className="px-10 py-4 border border-white/10 text-white font-bold tracking-[0.2em] uppercase text-xs hover:bg-white/5 transition-colors"
                            >
                                Back to Home
                            </Link>
                         </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
