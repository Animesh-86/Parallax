import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { GradientShineText } from "./effects/GradientShineText";
import { Users, Video, Mic, Share2, Code2, Shield, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Tab {
    id: string;
    label: string;
    icon: React.ElementType;
    title: string;
    description: string;
    features: string[];
    image: string; // Placeholder for now, can be replaced with actual images/components
}

const tabs: Tab[] = [
    {
        id: "ide",
        label: "LSP Intelligence",
        icon: Code2,
        title: "Full IDE Intelligence",
        description: "True IDE capabilities running in the browser. Powered by Language Servers (LSP) in isolated containers.",
        features: [
            "Smart auto-complete and syntax highlighting",
            "Real-time linting and error detection",
            "Hover definitions and signature help",
            "Supports Python, Java, C++, JS, and TS"
        ],
        image: "linear-gradient(135deg, #D4AF37 0%, #09090B 100%)"
    },
    {
        id: "terminal",
        label: "PTY Terminal",
        icon: Activity,
        title: "Interactive PTY Terminals",
        description: "Not just a static output log. Connect directly to a fully interactive shell running inside your workspace container.",
        features: [
            "Raw WebSocket connection for zero-latency typing",
            "Full PTY support (run vim, nano, htop)",
            "Install custom packages via apt-get or curl",
            "Persistent history and environment variables"
        ],
        image: "linear-gradient(135deg, #F8FAFC 0%, #D4AF37 100%)"
    },
    {
        id: "git",
        label: "Git Control",
        icon: Share2,
        title: "Native Git Integration",
        description: "Manage your source code directly from the IDE interface without ever opening a terminal.",
        features: [
            "Visual branch management and switching",
            "Commit staging and history tracking",
            "Push directly to connected GitHub repositories",
            "Conflict resolution UI"
        ],
        image: "linear-gradient(135deg, #71717A 0%, #09090B 100%)"
    },
    {
        id: "web",
        label: "Web Previews",
        icon: Shield,
        title: "Full-Stack Web Previews",
        description: "Spin up a development server and view the live results side-by-side with your code.",
        features: [
            "Support for React, Next.js, and Vite",
            "Live-reloading browser preview panel",
            "Port forwarding from secure Docker containers",
            "Network request inspection"
        ],
        image: "linear-gradient(135deg, #D4AF37 0%, #09090B 100%)"
    },
    {
        id: "collab",
        label: "Real-Time",
        icon: Users,
        title: "Real-Time Collaboration",
        description: "Code together like you're in the same room. Multi-user editing with WebRTC media.",
        features: [
            "Operational Transformation (OT) conflict resolution",
            "Live cursor presence and user indicators",
            "Built-in peer-to-peer Voice & Video calling",
            "Persistent project and team chat"
        ],
        image: "linear-gradient(135deg, #F8FAFC 0%, #D4AF37 100%)"
    }
];

export const FeatureTabs = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Update active tab based on scroll position (5 tabs)
    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            if (latest < 0.2) {
                setActiveTab(tabs[0]);
            } else if (latest < 0.4) {
                setActiveTab(tabs[1]);
            } else if (latest < 0.6) {
                setActiveTab(tabs[2]);
            } else if (latest < 0.8) {
                setActiveTab(tabs[3]);
            } else {
                setActiveTab(tabs[4]);
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab);
    };

    return (
        <section ref={containerRef} className="relative h-[500vh] bg-transparent">
            {/* Sticky Container */}
            <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">

                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#0D0D0F]/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 font-sans">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 italic font-serif">
                            <span className="relative inline-block">
                                <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] opacity-15" />
                                <span className="relative">
                                    <GradientShineText text="Built for Human Connection" />
                                </span>
                            </span>
                        </h2>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto italic font-serif opacity-80">
                            More than just an editor. Parallax is a complete workspace for synchronized teamwork.
                        </p>
                    </div>

                    {/* Tabs Navigation (Visual Indicator Only) */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12 pointer-events-none">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`
                                    relative px-6 py-3 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300
                                    ${activeTab.id === tab.id ? "text-white" : "text-[#A1A1AA]"}
                                `}
                            >
                                {activeTab.id === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className="w-4 h-4 relative z-10" />
                                <span className="relative z-10">{tab.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="relative min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full grid lg:grid-cols-2 gap-12 items-center"
                            >
                                {/* Left: Text Content */}
                                <div className={`text-left space-y-8 ${tabs.indexOf(activeTab) % 2 !== 0 ? 'lg:order-2' : ''}`}>
                                    <div>
                                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif italic">
                                            {activeTab.title}
                                        </h3>
                                        <p className="text-lg text-zinc-300 leading-relaxed">
                                            {activeTab.description}
                                        </p>
                                    </div>

                                    <ul className="space-y-4">
                                        {activeTab.features.map((feature, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + i * 0.1 }}
                                                className="flex items-center gap-3 text-[#CBD5E1]"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212, 175, 55,0.8)]" />
                                                {feature}
                                            </motion.li>
                                        ))}
                                    </ul>

                                    <motion.button
                                        onClick={() => navigate('/features')}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#F59E0B] transition-colors pointer-events-auto shadow-[0_4px_20px_rgba(212,175,55,0.4)]"
                                    >
                                        Learn more
                                    </motion.button>
                                </div>

                                {/* Right: Visual/Preview */}
                                <div className={`relative ${tabs.indexOf(activeTab) % 2 !== 0 ? 'lg:order-1' : ''}`}>
                                    {/* Decorator elements behind */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-[#71717A]/10 rounded-2xl blur-2xl transform rotate-3 scale-105" />

                                    <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl flex items-center justify-center group">
                                        <div
                                            className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-110"
                                            style={{ background: activeTab.image }}
                                        />

                                        {/* Abstract representation of the feature */}
                                        <div className="relative z-10 p-8 text-center">
                                            <motion.div
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md"
                                            >
                                                <activeTab.icon className="w-10 h-10 text-white" />
                                            </motion.div>
                                            <div className="space-y-2">
                                                <div className="h-2 w-32 bg-white/10 rounded-full mx-auto" />
                                                <div className="h-2 w-24 bg-white/10 rounded-full mx-auto" />
                                            </div>
                                        </div>

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};
