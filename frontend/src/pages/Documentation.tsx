import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { BookOpen, Terminal, Users, Zap, Code2, Play, ChevronRight, Settings } from "lucide-react";

const guides = [
    {
        icon: Play,
        title: "Project Initialization",
        steps: [
            "Sign in with Google or GitHub",
            "Clone a repository or start from scratch",
            "Automatic container provisioning per language",
            "Manage branches and commits via Native Git UI",
            "Share the session link with collaborators",
        ],
    },
    {
        icon: Code2,
        title: "Editor & LSP",
        steps: [
            "Monaco engine utilization for high-fidelity code",
            "Language Servers (LSP) for auto-complete & hover",
            "Real-time syntax diagnostics and error linting",
            "Low-latency multi-cursor broadcast protocols",
            "Operational Transformation (OT) conflict resolution",
        ],
    },
    {
        icon: Terminal,
        title: "Terminal & Web Previews",
        steps: [
            "Trigger containerized execution environments",
            "True interactive PTY terminals (vim, nano, apt)",
            "Integrated Full-Stack Web Previews (React/Next)",
            "Live-reloading browser preview panel",
            "Native support for Python, JS, Java, and C++",
        ],
    },
    {
        icon: Users,
        title: "Collaboration",
        steps: [
            "Create multi-user collaboration rooms",
            "Guest access for immediate collaboration via link",
            "Built-in voice and video calling (WebRTC)",
            "Role-Based Access Control (RBAC) across projects",
            "Live Virtual File System (VFS) sync across clients",
        ],
    },
];

const faqs = [
    { q: "Is local installation required?", a: "No. The entire platform runs in your browser — nothing to install." },
    { q: "What languages are supported?", a: "Currently Python, Java, JS, TS, C++, and Go. You can also install tools via the terminal." },
    { q: "Can I run interactive commands?", a: "Yes, our terminal is a true PTY. You can run top, vim, interactive python, and more." },
    { q: "Can guests join without an account?", a: "Yes, guests can join via an active link. Full project control requires an account." },
    { q: "Is code execution safe?", a: "All code runs in isolated, ephemeral Docker containers with strict security constraints." },
];

export default function Documentation() {
    return (
        <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden font-sans">
            {/* Background System */}
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
                    <div className="text-center mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-4"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-white">
                                Documentation
                            </h1>
                            <p className="text-[#A1A1AA] max-w-xl mx-auto text-sm tracking-wide pt-2">
                                Everything you need to get started with Parallax.
                            </p>
                        </motion.div>
                    </div>

                    {/* Registry Matrix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
                        {guides.map((guide, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group p-8 rounded-[40px] bg-zinc-950/40 border border-white/5 backdrop-blur-xl hover:border-[#D4AF37]/30 transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <guide.icon className="w-32 h-32 text-white" strokeWidth={0.5} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                                            <guide.icon className="w-5 h-5 text-[#D4AF37]" />
                                        </div>
                                        <h3 className="text-lg font-bold tracking-[0.2em] uppercase text-white/90">{guide.title}</h3>
                                    </div>

                                    <div className="space-y-4">
                                        {guide.steps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-4 group/step">
                                                <span className="text-[10px] font-mono text-[#D4AF37]/60 mt-1">[0{i + 1}]</span>
                                                <p className="text-sm text-[#A1A1AA] group-hover/step:text-white transition-colors leading-relaxed">
                                                    {step}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Technical Registry (FAQ) */}
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4 mb-12">
                            <Settings className="w-5 h-5 text-[#D4AF37]" />
                            <h2 className="text-xl font-bold tracking-[0.2em] uppercase">FAQ</h2>
                            <div className="h-px bg-white/5 flex-grow" />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-6 rounded-[24px] bg-zinc-950/20 border border-white/5 hover:bg-zinc-950/40 transition-all flex flex-col md:flex-row gap-4 group"
                                >
                                    <div className="md:w-1/3 flex items-center gap-3">
                                        <ChevronRight className="w-3 h-3 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-xs font-bold tracking-widest uppercase text-white/80">{faq.q}</span>
                                    </div>
                                    <div className="md:w-2/3">
                                        <p className="text-sm text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
                                            {faq.a}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Anchor */}
                    <div className="mt-24 pt-12 border-t border-white/5 flex flex-col items-center gap-6">
                        <p className="text-[10px] font-mono text-[#71717A] uppercase tracking-[0.4em]">Back to top</p>
                        <motion.button 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            whileHover={{ y: -5 }}
                            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-[#D4AF37] hover:bg-white/5 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 -rotate-90" />
                        </motion.button>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
