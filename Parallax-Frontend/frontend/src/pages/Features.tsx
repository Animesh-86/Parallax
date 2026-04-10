import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { Code2, Terminal, Globe, Zap, Shield, Users, Cpu, GitBranch, MessageSquare, Play, Layers, Lock } from "lucide-react";

const features = [
    {
        icon: Code2,
        title: "Real-Time Collaborative Editor",
        desc: "Monaco-powered editor with live multi-cursor editing, syntax highlighting for 40+ languages, and CRDT-based conflict resolution. See exactly what your collaborator types, in real time.",
    },
    {
        icon: Terminal,
        title: "Sandboxed Code Execution",
        desc: "Every code run happens inside an isolated Docker container. Support for Python, Java, JavaScript, TypeScript, and more — with zero setup on your end.",
    },
    {
        icon: Globe,
        title: "Built-In Voice & Video",
        desc: "WebRTC-powered voice and video chat directly in the workspace. No tab-switching, no third-party apps. Talk through problems while writing code together.",
    },
    {
        icon: Zap,
        title: "Instant Session Creation",
        desc: "Create a room, share a link, start coding. Guests can join without accounts. Sessions spin up in seconds with full editor, terminal, and chat access.",
    },
    {
        icon: Users,
        title: "Team Workspaces",
        desc: "Organize projects by team. Manage members, share files, and maintain persistent workspaces that survive beyond a single session.",
    },
    {
        icon: GitBranch,
        title: "Project File Trees",
        desc: "Full file tree navigation within each project. Create, rename, delete, and organize files — just like a local IDE, but collaborative.",
    },
    {
        icon: MessageSquare,
        title: "Session Chat",
        desc: "Real-time text chat alongside the editor. Share links, paste snippets, and communicate without interrupting the code flow.",
    },
    {
        icon: Play,
        title: "One-Click Run",
        desc: "Hit run and see output instantly in the integrated terminal. No build configuration, no CLI setup. Code runs in the cloud, results appear in your browser.",
    },
    {
        icon: Layers,
        title: "Multi-Language Support",
        desc: "Python, Java, JavaScript, TypeScript, C++, Go, and more. Each language runs in its own optimized container with the right runtime pre-installed.",
    },
    {
        icon: Shield,
        title: "OAuth Authentication",
        desc: "Sign in with Google or GitHub. No passwords to manage, no email verification flows. Secure, frictionless authentication from day one.",
    },
    {
        icon: Cpu,
        title: "Dedicated Compute",
        desc: "Each execution gets its own isolated resources. No shared processes, no noisy neighbors. Your code runs on clean infrastructure every time.",
    },
    {
        icon: Lock,
        title: "Encrypted Connections",
        desc: "All data in transit is encrypted. WebSocket connections, API calls, and file transfers are secured with TLS. Your code stays yours.",
    },
];

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
                                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mb-4 group-hover:bg-[#38BDF8]/20 transition-colors">
                                    <feature.icon className="w-5 h-5 text-[#2DD4BF]" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-[#94A3B8] leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
