import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { ParticlesWaves } from "../components/effects/ParticlesWaves";
import { TextIlluminate } from "../components/effects/TextIlluminate";
import { 
    Code2, Terminal, Globe, Zap, Shield, Users, Cpu, 
    GitBranch, MessageSquare, Play, Layers, Lock, 
    CheckCircle2, Clock3, Rocket, ArrowUpRight 
} from "lucide-react";

const MASTER_FEATURES = [
    {
        icon: Code2,
        status: "Live",
        statusTone: "live",
        category: "Core Engine",
        title: "Real-Time Collaborative Editor",
        desc: "Monaco-powered editor with live multi-cursor editing, syntax highlighting for 40+ languages, and CRDT-based conflict resolution.",
        size: "hero", // spans more columns
        gridClass: "lg:col-span-8 lg:row-span-2",
        accent: "from-[#D4AF37]/20 to-transparent"
    },
    {
        icon: Terminal,
        status: "Live",
        statusTone: "live",
        category: "Infrastructure",
        title: "Sandboxed Execution",
        desc: "Isolated Docker containers for Python, Node.js, C++, and more.",
        size: "medium",
        gridClass: "lg:col-span-4 lg:row-span-1",
        accent: "from-[#F59E0B]/10 to-transparent"
    },
    {
        icon: Globe,
        status: "Live",
        statusTone: "live",
        category: "Communication",
        title: "Native Voice & Video",
        desc: "Integrated WebRTC chat directly in the workspace.",
        size: "medium",
        gridClass: "lg:col-span-4 lg:row-span-1",
        accent: "from-zinc-500/10 to-transparent"
    },
    {
        icon: Zap,
        status: "Live",
        statusTone: "live",
        category: "Orchestration",
        title: "Instant Sessions",
        desc: "Spin up a collaborative room in under 2 seconds.",
        size: "standard",
        gridClass: "lg:col-span-4 lg:row-span-1"
    },
    {
        icon: Users,
        status: "Beta",
        statusTone: "beta",
        category: "Organization",
        title: "Team Workspaces",
        desc: "Persistent projects with member role management.",
        size: "standard",
        gridClass: "lg:col-span-4 lg:row-span-1"
    },
    {
        icon: GitBranch,
        status: "Live",
        statusTone: "live",
        category: "File System",
        title: "Visual File Trees",
        desc: "Full folder navigation and file manipulation.",
        size: "standard",
        gridClass: "lg:col-span-4 lg:row-span-1"
    },
    {
        icon: Shield,
        status: "Live",
        statusTone: "live",
        category: "Security",
        title: "OAuth 2.0 Auth",
        desc: "Secure login via GitHub, Google, or Enterprise SSO.",
        size: "standard",
        gridClass: "lg:col-span-3 lg:row-span-1"
    },
    {
        icon: Cpu,
        status: "Live",
        statusTone: "live",
        category: "Performance",
        title: "Dedicated vCPUs",
        desc: "Guaranteed compute resources for every session.",
        size: "standard",
        gridClass: "lg:col-span-3 lg:row-span-1"
    },
    {
        icon: Lock,
        status: "Live",
        statusTone: "live",
        category: "Privacy",
        title: "End-to-End TLS",
        desc: "All session data is encrypted in transit.",
        size: "standard",
        gridClass: "lg:col-span-3 lg:row-span-1"
    },
    {
        icon: Layers,
        status: "Planned",
        statusTone: "planned",
        category: "Runtimes",
        title: "Custom Images",
        desc: "Bring your own Dockerfile for specialized environments.",
        size: "standard",
        gridClass: "lg:col-span-3 lg:row-span-1"
    }
];

const workflows = [
    {
        title: "Interview Mode",
        summary: "Host-controlled edits and guided problem solving for interviews and assessments.",
        points: [
            "Host-led permissions and task control",
            "Invite-only access with tighter room defaults",
            "Structured whiteboard + code review flow",
        ],
    },
    {
        title: "Team Sprint Mode",
        summary: "Open collaboration for squads shipping together in real time.",
        points: [
            "Shared task editing and active room collaboration",
            "Live chat, voice, screen share, and code sessions",
            "Fast switch from project board to execution",
        ],
    },
    {
        title: "Mentoring and Pairing",
        summary: "Low-friction mentoring sessions where context stays with the code.",
        points: [
            "Instructor + learner in one workspace",
            "Instant room creation and shareable links",
            "Persistent project context for follow-ups",
        ],
    },
];

const modeComparison = [
    { capability: "Join by code", interview: "Invite-focused", team: "Open by default" },
    { capability: "Task editing", interview: "Host only", team: "Everyone" },
    { capability: "Screen sharing", interview: "Disabled by default", team: "Enabled by default" },
    { capability: "Room invites", interview: "Host-oriented", team: "Members can invite" },
    { capability: "Best for", interview: "Assessments and interviews", team: "Daily product collaboration" },
];

const statusStyles: Record<string, string> = {
    live: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20",
    beta: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    planned: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

function FeatureCard({ feature, index }: { feature: any; index: number }) {
    const Icon = feature.icon;
    const isHero = feature.size === "hero";

    return (
        <motion.div
            className={`group relative p-8 rounded-[28px] bg-[#09090B] border border-white/10 overflow-hidden flex flex-col justify-between transition-all duration-500 hover:border-[#D4AF37]/30 ${feature.gridClass}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent || "from-white/5 to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            
            {/* Fine Grain Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none grain-overlay" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors duration-500">
                        <Icon className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="flex gap-2">
                        <span className="text-[10px] tracking-widest uppercase text-white/40">{feature.category}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${statusStyles[feature.statusTone]}`}>
                            {feature.status}
                        </span>
                    </div>
                </div>

                <h3 className={`${isHero ? "text-3xl md:text-4xl" : "text-xl"} font-bold text-white mb-4 tracking-tight`}>
                    {feature.title}
                </h3>
                <p className={`${isHero ? "text-lg" : "text-sm"} text-[#A1A1AA] leading-relaxed max-w-md`}>
                    {feature.desc}
                </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center justify-between">
                <div className="h-px flex-1 bg-white/5 group-hover:bg-[#D4AF37]/20 transition-colors duration-500 mr-4" />
                <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-[#D4AF37] transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
        </motion.div>
    );
}

export default function Features() {
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
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Hero Section */}
                    <div className="mb-24">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 text-[#D4AF37] tracking-[0.3em] uppercase text-xs font-bold">
                                <span className="w-8 h-px bg-[#D4AF37]/30" />
                                Engineering Excellence
                            </div>
                            <TextIlluminate
                                text="SYSTEM FEATURES"
                                theme="stellar"
                                fontSize="min(10vw, 72px)"
                                textAlign="left"
                                fontFamily="var(--font-sans)"
                                fontWeight={700}
                                className="tracking-[0.3em] uppercase leading-none"
                                glow={{ enabled: true, intensity: 20 }}
                            />
                            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                                A high-performance collaborative architecture engineered for deep technical workflows. 
                                Standardized compute, native communication, and real-time state synchronization.
                            </p>
                        </motion.div>
                    </div>

                    {/* Unified Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-24">
                        {MASTER_FEATURES.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} index={index} />
                        ))}
                    </div>

                    {/* Workflow Section Rebrand */}
                    <section className="mt-32 border-t border-white/5 pt-24">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                            <div className="space-y-4">
                                <div className="text-[#D4AF37] tracking-[0.2em] uppercase text-[10px] font-bold">Operational Context</div>
                                <h2 className="text-4xl font-bold tracking-tight uppercase tracking-[0.1em]">Target Workflows</h2>
                            </div>
                            <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
                                Optimized environments tailored for specific engineering and recruitment scenarios.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {workflows.map((workflow, index) => (
                                <motion.article
                                    key={workflow.title}
                                    className="group relative rounded-[28px] border border-white/5 bg-white/[0.02] p-8 hover:border-[#D4AF37]/20 transition-all duration-500"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white group-hover:text-[#D4AF37] transition-colors">{workflow.title}</h3>
                                    <p className="text-sm text-zinc-400 mb-8 leading-relaxed">{workflow.summary}</p>
                                    <ul className="space-y-4">
                                        {workflow.points.map((point) => (
                                            <li key={point} className="text-xs text-zinc-500 flex items-start gap-3 group-hover:text-zinc-300 transition-colors">
                                                <div className="w-1 h-1 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.article>
                            ))}
                        </div>
                    </section>

                    {/* Technical Comparison Specs */}
                    <section className="mt-32 rounded-[32px] border border-white/10 bg-[#09090B] overflow-hidden shadow-2xl relative">
                        <div className="absolute inset-0 pointer-events-none grain-overlay opacity-[0.02]" />
                        <div className="px-8 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                                <h2 className="text-xl font-bold uppercase tracking-[0.2em]">Technical Specifications</h2>
                            </div>
                            <div className="text-[10px] text-zinc-600 tracking-widest uppercase font-mono">ID: PX-MODES-V3</div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px]">
                                <thead>
                                    <tr className="text-left text-[10px] text-zinc-500 border-b border-white/5 uppercase tracking-[0.2em]">
                                        <th className="px-8 py-6 font-bold">Property</th>
                                        <th className="px-8 py-6 font-bold bg-[#D4AF37]/5 text-[#D4AF37]">Interview Engine</th>
                                        <th className="px-8 py-6 font-bold">Team Cluster</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {modeComparison.map((row) => (
                                        <tr key={row.capability} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-5 text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">{row.capability}</td>
                                            <td className="px-8 py-5 text-sm text-[#D4AF37]/70 font-mono italic">{row.interview}</td>
                                            <td className="px-8 py-5 text-sm text-zinc-500 font-mono italic">{row.team}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
