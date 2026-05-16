import React from "react";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { ParticlesWaves } from "../components/effects/ParticlesWaves";
import { TextIlluminate } from "../components/effects/TextIlluminate";
import { CheckCircle, Circle, Clock, Rocket, ChevronRight, Activity, Terminal as TerminalIcon } from "lucide-react";

type PhaseStatus = "done" | "active" | "planned" | "future";

const phases = [
    {
        status: "done" as PhaseStatus,
        title: "Foundation",
        window: "Shipped",
        subtitle: "Core collaboration architecture is live and battle-tested.",
        items: [
            "Real-time collaborative editor (Monaco + WebSockets)",
            "Google & GitHub OAuth authentication",
            "Sandboxed code execution (Docker containers)",
            "Session-based rooms with invite links",
            "Integrated voice chat (WebRTC)",
            "Project file tree management",
            "Team workspaces and member management",
        ],
    },
    {
        status: "active" as PhaseStatus,
        title: "Currently Building",
        window: "In Progress",
        subtitle: "Expanding team workflows and richer session intelligence.",
        items: [
            "Video chat in workspace sessions",
            "Multi-language execution expansion",
            "Notification system and activity feed",
            "Friends and social features",
            "Session recording and playback",
            "Performance optimizations at scale",
        ],
    },
    {
        status: "planned" as PhaseStatus,
        title: "Coming Next",
        window: "Planned",
        subtitle: "AI-assisted development and deeper customization layers.",
        items: [
            "AI-assisted code suggestions in sessions",
            "Session analytics and interview scoring",
            "Custom themes and editor configuration",
            "Mobile-responsive workspace",
            "Plugin / extension system",
            "Self-hosted deployment option",
        ],
    },
    {
        status: "future" as PhaseStatus,
        title: "Long-Term Vision",
        window: "Exploring",
        subtitle: "Platform ecosystem for teams, enterprises, and integrations.",
        items: [
            "Marketplace for coding challenges",
            "Integration with GitHub / GitLab workflows",
            "Enterprise SSO and admin dashboards",
            "On-premise deployment for organizations",
            "SDK for embedding Parallax in other apps",
        ],
    },
];

const statusConfig: Record<PhaseStatus, { color: string; border: string; bg: string; label: string; id: string }> = {
    done: { color: "text-[#D4AF37]", border: "border-[#D4AF37]/30", bg: "bg-[#D4AF37]/5", label: "SHIPPED", id: "01" },
    active: { color: "text-[#F59E0B]", border: "border-[#F59E0B]/30", bg: "bg-[#F59E0B]/5", label: "ACTIVE", id: "02" },
    planned: { color: "text-zinc-500", border: "border-zinc-500/30", bg: "bg-zinc-500/5", label: "PLANNED", id: "03" },
    future: { color: "text-zinc-700", border: "border-zinc-700/30", bg: "bg-zinc-700/5", label: "VISION", id: "04" },
};

const auraPalette = [
    { core: "#D4AF37", glow: "rgba(212, 175, 55, 0.55)" },
    { core: "#D4AF37", glow: "rgba(212, 175, 55, 0.55)" },
    { core: "#D4AF37", glow: "rgba(244, 114, 182, 0.55)" },
    { core: "#F59E0B", glow: "rgba(251, 191, 36, 0.55)" },
];

export default function Roadmap() {
    const [selectedNode, setSelectedNode] = React.useState(1);
    const activeNode = selectedNode;
    const activePhase = phases[activeNode];
    const activeAura = auraPalette[activeNode];
    const activeConfig = statusConfig[activePhase.status];

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

            <main className="relative z-10 pt-32 pb-32">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 text-[#D4AF37] tracking-[0.3em] uppercase text-[10px] font-bold">
                                <span className="w-8 h-px bg-[#D4AF37]/30" />
                                Project Trajectory
                            </div>
                            <TextIlluminate
                                text="PRODUCT ROADMAP"
                                theme="stellar"
                                fontSize="min(8vw, 64px)"
                                textAlign="left"
                                className="tracking-[0.3em] uppercase font-bold"
                                fontWeight={700}
                            />
                        </motion.div>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-zinc-500 max-w-sm text-sm leading-relaxed"
                        >
                            A technical log of system maturity. From fundamental collaboration layers to global enterprise readiness.
                        </motion.p>
                    </div>

                    {/* Cinematic Horizontal Timeline */}
                    <div className="relative mb-24 group/timeline">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 z-0" />
                        <div className="relative z-10 flex flex-nowrap md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
                            {phases.map((phase, idx) => {
                                const isActive = idx === selectedNode;
                                const cfg = statusConfig[phase.status];

                                return (
                                    <motion.button
                                        key={phase.title}
                                        onMouseEnter={() => setSelectedNode(idx)}
                                        className={`relative min-w-[280px] p-8 text-left transition-all duration-500 ${
                                            isActive ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-transparent'
                                        } rounded-[32px] border group/node`}
                                    >
                                        {/* Vertical Connection Line */}
                                        <div className={`absolute top-0 bottom-0 left-12 w-px ${isActive ? 'bg-[#D4AF37]/40' : 'bg-white/5'} transition-colors duration-500`} />
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-6 mb-12">
                                                <div className={`relative w-12 h-12 flex items-center justify-center rounded-2xl border ${
                                                    isActive ? 'bg-[#D4AF37] border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)]' : 'bg-[#09090B] border-white/10'
                                                } transition-all duration-500`}>
                                                    <span className={`font-mono text-sm font-bold ${isActive ? 'text-black' : 'text-zinc-500'}`}>
                                                        {cfg.id}
                                                    </span>
                                                </div>
                                                <div className={`text-[10px] tracking-[0.2em] font-bold ${cfg.color} opacity-60 group-hover/node:opacity-100 transition-opacity`}>
                                                    {cfg.label}
                                                </div>
                                            </div>

                                            <h3 className={`text-xl font-bold uppercase tracking-wider mb-2 transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                                {phase.title}
                                            </h3>
                                            <div className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">
                                                ET_WINDOW: {phase.window}
                                            </div>
                                        </div>

                                        {/* Activation Glow */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeGlow"
                                                className="absolute -inset-px rounded-[32px] border border-[#D4AF37]/30 pointer-events-none"
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Phase Detail Terminal */}
                    <motion.section
                        key={selectedNode}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative rounded-[40px] border border-white/5 bg-[#09090B] overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none grain-overlay" />
                        
                        <div className="relative z-10 p-10 md:p-16">
                            <div className="flex flex-col lg:flex-row gap-16">
                                <div className="lg:w-1/3 space-y-8">
                                    <div className="space-y-2">
                                        <div className={`text-[10px] tracking-[0.3em] font-bold ${statusConfig[activePhase.status].color} uppercase`}>
                                            Operational Status: {statusConfig[activePhase.status].label}
                                        </div>
                                        <h2 className="text-4xl font-bold uppercase tracking-tight leading-tight">
                                            {activePhase.title}
                                        </h2>
                                    </div>
                                    
                                    <p className="text-zinc-400 leading-relaxed italic text-lg border-l-2 border-[#D4AF37]/20 pl-6">
                                        "{activePhase.subtitle}"
                                    </p>

                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-zinc-600">
                                            <span>Registry_ID</span>
                                            <span>PX-PH-{statusConfig[activePhase.status].id}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-zinc-600">
                                            <span>Target_Window</span>
                                            <span className="text-[#D4AF37]">{activePhase.window}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-zinc-600">
                                            <span>Priority_Level</span>
                                            <span className="text-zinc-400">P01_CRITICAL</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-2/3">
                                    <div className="flex items-center gap-4 mb-8">
                                        <TerminalIcon className="w-5 h-5 text-[#D4AF37]" />
                                        <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 font-bold">Module Checkload</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activePhase.items.map((item, idx) => (
                                            <motion.div
                                                key={item}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-[#D4AF37]/20 transition-all cursor-default"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)] group-hover:scale-125 transition-transform" />
                                                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{item}</span>
                                                </div>
                                                <Activity className="w-3.5 h-3.5 text-zinc-800 group-hover:text-[#D4AF37]/40 transition-colors" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
