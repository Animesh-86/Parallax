import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { Code2, Terminal, Globe, Zap, Shield, Users, Cpu, GitBranch, MessageSquare, Play, Layers, Lock, CheckCircle2, Clock3, Rocket } from "lucide-react";

const features = [
    {
        icon: Code2,
        status: "Live",
        statusTone: "live",
        category: "Core",
        title: "Real-Time Collaborative Editor",
        desc: "Monaco-powered editor with live multi-cursor editing, syntax highlighting for 40+ languages, and CRDT-based conflict resolution. See exactly what your collaborator types, in real time.",
    },
    {
        icon: Terminal,
        status: "Live",
        statusTone: "live",
        category: "Core",
        title: "Sandboxed Code Execution",
        desc: "Every code run happens inside an isolated Docker container. Support for Python, Java, JavaScript, TypeScript, and more — with zero setup on your end.",
    },
    {
        icon: Globe,
        status: "Live",
        statusTone: "live",
        category: "Collaboration",
        title: "Built-In Voice & Video",
        desc: "WebRTC-powered voice and video chat directly in the workspace. No tab-switching, no third-party apps. Talk through problems while writing code together.",
    },
    {
        icon: Zap,
        status: "Live",
        statusTone: "live",
        category: "Collaboration",
        title: "Instant Session Creation",
        desc: "Create a room, share a link, start coding. Guests can join without accounts. Sessions spin up in seconds with full editor, terminal, and chat access.",
    },
    {
        icon: Users,
        status: "Beta",
        statusTone: "beta",
        category: "Team",
        title: "Team Workspaces",
        desc: "Organize projects by team. Manage members, share files, and maintain persistent workspaces that survive beyond a single session.",
    },
    {
        icon: GitBranch,
        status: "Live",
        statusTone: "live",
        category: "Core",
        title: "Project File Trees",
        desc: "Full file tree navigation within each project. Create, rename, delete, and organize files — just like a local IDE, but collaborative.",
    },
    {
        icon: MessageSquare,
        status: "Live",
        statusTone: "live",
        category: "Collaboration",
        title: "Session Chat",
        desc: "Real-time text chat alongside the editor. Share links, paste snippets, and communicate without interrupting the code flow.",
    },
    {
        icon: Play,
        status: "Live",
        statusTone: "live",
        category: "Core",
        title: "One-Click Run",
        desc: "Hit run and see output instantly in the integrated terminal. No build configuration, no CLI setup. Code runs in the cloud, results appear in your browser.",
    },
    {
        icon: Layers,
        status: "In Progress",
        statusTone: "planned",
        category: "Platform",
        title: "Multi-Language Support",
        desc: "Python, Java, JavaScript, TypeScript, C++, Go, and more. Each language runs in its own optimized container with the right runtime pre-installed.",
    },
    {
        icon: Shield,
        status: "Live",
        statusTone: "live",
        category: "Security",
        title: "OAuth Authentication",
        desc: "Sign in with Google or GitHub. No passwords to manage, no email verification flows. Secure, frictionless authentication from day one.",
    },
    {
        icon: Cpu,
        status: "Live",
        statusTone: "live",
        category: "Platform",
        title: "Dedicated Compute",
        desc: "Each execution gets its own isolated resources. No shared processes, no noisy neighbors. Your code runs on clean infrastructure every time.",
    },
    {
        icon: Lock,
        status: "Live",
        statusTone: "live",
        category: "Security",
        title: "Encrypted Connections",
        desc: "All data in transit is encrypted. WebSocket connections, API calls, and file transfers are secured with TLS. Your code stays yours.",
    },
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
    live: "bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30",
    beta: "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30",
    planned: "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30",
};

export default function Features() {
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

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    {/* Hero */}
                    <motion.div
                        className="text-center mb-16 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            Everything You Need to{" "}
                            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
                                Code Together
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            A complete collaborative coding environment — editor, execution, voice, and project management — in one place.
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="group p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-[#38BDF8]/20 transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05, duration: 0.5 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-[11px] px-2 py-1 rounded-full border ${statusStyles[feature.statusTone]}`}>
                                        {feature.status}
                                    </span>
                                    <span className="text-[11px] text-white/45 tracking-wide uppercase">{feature.category}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mb-4 group-hover:bg-[#38BDF8]/20 transition-colors">
                                    <feature.icon className="w-5 h-5 text-[#2DD4BF]" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-[#94A3B8] leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <section className="mt-16">
                        <div className="flex items-center gap-3 mb-5">
                            <Rocket className="w-5 h-5 text-[#38BDF8]" />
                            <h2 className="text-2xl font-semibold">Built for Real Workflows</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {workflows.map((workflow, index) => (
                                <motion.article
                                    key={workflow.title}
                                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.06 }}
                                >
                                    <h3 className="text-lg font-medium mb-2">{workflow.title}</h3>
                                    <p className="text-sm text-[#94A3B8] mb-4">{workflow.summary}</p>
                                    <ul className="space-y-2">
                                        {workflow.points.map((point) => (
                                            <li key={point} className="text-sm text-[#CBD5E1] flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] mt-0.5 shrink-0" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.article>
                            ))}
                        </div>
                    </section>

                    <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                            <Clock3 className="w-5 h-5 text-[#38BDF8]" />
                            <h2 className="text-2xl font-semibold">Interview vs Team Mode</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px]">
                                <thead>
                                    <tr className="text-left text-sm text-[#94A3B8] border-b border-white/10">
                                        <th className="px-5 py-3 font-medium">Capability</th>
                                        <th className="px-5 py-3 font-medium">Interview</th>
                                        <th className="px-5 py-3 font-medium">Team</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modeComparison.map((row) => (
                                        <tr key={row.capability} className="border-b border-white/5 last:border-b-0">
                                            <td className="px-5 py-3 text-sm text-white">{row.capability}</td>
                                            <td className="px-5 py-3 text-sm text-[#CBD5E1]">{row.interview}</td>
                                            <td className="px-5 py-3 text-sm text-[#CBD5E1]">{row.team}</td>
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
