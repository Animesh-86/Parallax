import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { BookOpen, Terminal, Users, Zap, Code2, Play } from "lucide-react";

const guides = [
    {
        icon: Play,
        title: "Quick Start",
        steps: [
            "Sign in with your Google or GitHub account",
            "Create a new project from the dashboard",
            "Open the workspace editor",
            "Share the session link with collaborators",
            "Start coding together in real time",
        ],
    },
    {
        icon: Code2,
        title: "Using the Editor",
        steps: [
            "The editor uses Monaco (same engine as VS Code)",
            "Create files and folders using the file tree panel",
            "Syntax highlighting works automatically based on file extension",
            "Multiple collaborators see each other's cursors live",
            "Use Ctrl+S to save, or it auto-saves on change",
        ],
    },
    {
        icon: Terminal,
        title: "Running Code",
        steps: [
            "Click the Run button or use the keyboard shortcut",
            "Code executes in a sandboxed Docker container",
            "Output appears in the integrated terminal panel",
            "Each run gets a clean environment — no state leaks",
            "Supported: Python, Java, JavaScript, TypeScript, C++, Go",
        ],
    },
    {
        icon: Users,
        title: "Collaboration",
        steps: [
            "Create a room from the dashboard to start a session",
            "Share the room link — guests can join without accounts",
            "Enable voice chat from the toolbar for real-time discussion",
            "Use the session chat for sharing links and quick messages",
            "All changes sync instantly across all participants",
        ],
    },
];

const faqs = [
    { q: "Do I need to install anything?", a: "No. Parallax runs entirely in the browser. No extensions, no CLI tools, no downloads." },
    { q: "What languages can I run?", a: "Currently Python, Java, JavaScript, TypeScript, C++, and Go. More are being added." },
    { q: "Is there a file size limit?", a: "Individual files up to 1MB. Projects are scoped to reasonable limits during early access." },
    { q: "Can guests edit code without an account?", a: "Guest access allows joining sessions via link. Full features require a free account." },
    { q: "Where does my code run?", a: "In isolated Docker containers on cloud infrastructure. Containers are destroyed after execution." },
];

export default function Documentation() {
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
                    <motion.div
                        className="text-center mb-16 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] text-sm mb-4">
                            <BookOpen className="w-4 h-4" />
                            Documentation
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            Get Started with{" "}
                            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
                                Parallax
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            Everything you need to know to start coding collaboratively. No fluff, just the essentials.
                        </p>
                    </motion.div>

                    {/* Guides */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
                        {guides.map((guide, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-2xl bg-white/[0.04] border border-white/10"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08, duration: 0.5 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center">
                                        <guide.icon className="w-4 h-4 text-[#2DD4BF]" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white">{guide.title}</h3>
                                </div>
                                <ol className="space-y-2">
                                    {guide.steps.map((step, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-[#CBD5E1]">
                                            <span className="mt-0.5 w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs text-[#94A3B8] shrink-0">
                                                {i + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl font-semibold text-center mb-8">
                            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">FAQ</span>
                        </h2>
                        <div className="max-w-3xl mx-auto space-y-3">
                            {faqs.map((faq, index) => (
                                <div key={index} className="p-5 rounded-xl bg-white/[0.04] border border-white/10">
                                    <p className="text-sm font-medium text-white mb-1">{faq.q}</p>
                                    <p className="text-sm text-[#94A3B8]">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
