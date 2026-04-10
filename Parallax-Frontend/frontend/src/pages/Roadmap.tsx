import React from "react";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CheckCircle, Circle, Clock, Rocket } from "lucide-react";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";

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

const statusConfig: Record<PhaseStatus, { icon: React.ComponentType<{ className?: string }>; color: string; border: string; bg: string; label: string }> = {
    done: { icon: CheckCircle, color: "text-[#4ADE80]", border: "border-[#4ADE80]/20", bg: "bg-[#4ADE80]/10", label: "Shipped" },
    active: { icon: Clock, color: "text-[#38BDF8]", border: "border-[#38BDF8]/20", bg: "bg-[#38BDF8]/10", label: "In Progress" },
    planned: { icon: Circle, color: "text-[#2DD4BF]", border: "border-[#2DD4BF]/20", bg: "bg-[#2DD4BF]/10", label: "Planned" },
    future: { icon: Rocket, color: "text-[#F472B6]", border: "border-[#F472B6]/20", bg: "bg-[#F472B6]/10", label: "Exploring" },
};

const auraPalette = [
    { core: "#38BDF8", glow: "rgba(56, 189, 248, 0.55)" },
    { core: "#2DD4BF", glow: "rgba(45, 212, 191, 0.55)" },
    { core: "#F472B6", glow: "rgba(244, 114, 182, 0.55)" },
    { core: "#FBBF24", glow: "rgba(251, 191, 36, 0.55)" },
];

export default function Roadmap() {
    const [selectedNode, setSelectedNode] = React.useState(1);
    const [hoveredNode, setHoveredNode] = React.useState<number | null>(null);
    const activeNode = hoveredNode ?? selectedNode;
    const activePhase = phases[activeNode];
    const activeAura = auraPalette[activeNode];
    const activeConfig = statusConfig[activePhase.status];
    const ActiveIcon = activeConfig.icon;

    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
            <div className="fixed inset-0 z-0">
                <FluidFlowBackground
                    colors={["#1D4ED8", "#38BDF8", "#2DD4BF", "#A78BFA"]}
                    mouseForce={24}
                    cursorSize={130}
                    resolution={0.3}
                    autoDemo={true}
                    autoSpeed={0.55}
                    autoIntensity={2.4}
                    autoResumeDelay={1200}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
            <div className="pointer-events-none fixed inset-0 z-0 bg-[#060910]/45" />
            <Header />

            <main className="relative z-10 pt-32 pb-32">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-14 space-y-5"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 text-xs text-[#7DD3FC] tracking-[0.16em] uppercase">
                            Product Direction
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            <span className="bg-gradient-to-r from-[#7DD3FC] via-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
                                Roadmap
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            A live snapshot of what shipped, what is in flight, and what is next.
                        </p>
                    </motion.div>

                    <section className="relative mb-12">
                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/60 to-transparent" />
                                <div className="grid grid-cols-4 gap-4">
                                    {phases.map((phase, idx) => {
                                        const isActive = idx === activeNode;
                                        const aura = auraPalette[idx];
                                        const phaseCfg = statusConfig[phase.status];
                                        const PhaseIcon = phaseCfg.icon;

                                        return (
                                            <motion.button
                                                key={phase.title}
                                                onMouseEnter={() => setHoveredNode(idx)}
                                                onMouseLeave={() => setHoveredNode(null)}
                                                onFocus={() => setHoveredNode(idx)}
                                                onBlur={() => setHoveredNode(null)}
                                                onClick={() => setSelectedNode(idx)}
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.08 }}
                                                className={`relative rounded-2xl border p-4 text-left backdrop-blur-xl transition-all ${isActive ? "bg-white/[0.08] border-white/35" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                                                    }`}
                                            >
                                                {isActive ? (
                                                    <div
                                                        className="pointer-events-none absolute -inset-1 rounded-3xl blur-2xl opacity-60"
                                                        style={{ background: aura.glow }}
                                                    />
                                                ) : null}

                                                <div className="relative z-10">
                                                    <div className="mb-3 flex items-center gap-3">
                                                        <div
                                                            className="w-6 h-6 rounded-full border-2 border-white/80"
                                                            style={{
                                                                backgroundColor: aura.core,
                                                                boxShadow: isActive ? `0 0 24px ${aura.glow}` : `0 0 10px ${aura.glow}`,
                                                            }}
                                                        />
                                                        <span className={`text-[11px] tracking-wide uppercase ${phaseCfg.color}`}>{phaseCfg.label}</span>
                                                    </div>
                                                    <h3 className="text-base font-semibold text-white">{phase.title}</h3>
                                                    <p className="text-xs text-[#94A3B8] mt-1">{phase.window}</p>
                                                    <p className="text-xs text-[#CBD5E1]/90 mt-3 leading-relaxed">{phase.subtitle}</p>
                                                    <div className={`mt-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${phaseCfg.bg} ${phaseCfg.border} border ${phaseCfg.color}`}>
                                                        <PhaseIcon className="w-3.5 h-3.5" />
                                                        {phaseCfg.label}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden space-y-4">
                            {phases.map((phase, idx) => {
                                const isActive = idx === activeNode;
                                const aura = auraPalette[idx];
                                const phaseCfg = statusConfig[phase.status];

                                return (
                                    <button
                                        key={phase.title}
                                        onClick={() => setSelectedNode(idx)}
                                        className={`relative w-full text-left rounded-2xl border p-4 backdrop-blur-xl transition-all ${isActive ? "bg-white/[0.08] border-white/35" : "bg-white/[0.03] border-white/10"
                                            }`}
                                    >
                                        {isActive ? (
                                            <div
                                                className="pointer-events-none absolute -inset-1 rounded-3xl blur-xl opacity-60"
                                                style={{ background: aura.glow }}
                                            />
                                        ) : null}

                                        <div className="relative z-10 flex items-center gap-3">
                                            <div
                                                className="w-5 h-5 rounded-full border-2 border-white/80"
                                                style={{ backgroundColor: aura.core, boxShadow: `0 0 16px ${aura.glow}` }}
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-white">{phase.title}</p>
                                                <p className={`text-[11px] ${phaseCfg.color}`}>{phaseCfg.label}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <motion.section
                        key={activePhase.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="relative rounded-3xl border border-white/15 bg-[#0B1220]/70 backdrop-blur-xl overflow-hidden"
                    >
                        <div
                            className="pointer-events-none absolute -top-24 -left-12 w-72 h-72 rounded-full blur-3xl opacity-70"
                            style={{ background: activeAura.glow }}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />

                        <div className="relative z-10 p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
                                <div>
                                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${activeConfig.bg} ${activeConfig.border} ${activeConfig.color}`}>
                                        <ActiveIcon className="w-3.5 h-3.5" />
                                        {activeConfig.label}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-semibold text-white mt-3">{activePhase.title}</h2>
                                    <p className="text-[#CBD5E1] mt-2 max-w-2xl">{activePhase.subtitle}</p>
                                </div>
                                <div className="text-xs uppercase tracking-[0.14em] text-[#94A3B8]">{activePhase.window}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activePhase.items.map((item, idx) => (
                                    <motion.div
                                        key={item}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                                    >
                                        <span
                                            className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: activeAura.core, boxShadow: `0 0 10px ${activeAura.glow}` }}
                                        />
                                        <span className="text-sm text-[#E2E8F0] leading-relaxed">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
