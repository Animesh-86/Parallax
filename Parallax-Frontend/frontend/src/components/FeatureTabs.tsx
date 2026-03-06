import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { GradientShineText } from "./effects/GradientShineText";
import { Users, Video, Mic, Share2, Code2, Shield, Activity } from "lucide-react";

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
        id: "collab",
        label: "Real-Time",
        icon: Users,
        title: "Real-Time Collaboration",
        description: "Code together like you're in the same room. Multi-user editing with sub-millisecond latency.",
        features: [
            "Multi-user live code editing (Google Docs-style)",
            "Cursor presence and user indicators",
            "Conflict-free collaborative editing (CRDT)",
            "Role-based participation controls"
        ],
        image: "linear-gradient(135deg, #7DD3FC 0%, #38BDF8 100%)"
    },
    {
        id: "comms",
        label: "Connect",
        icon: Video,
        title: "Voice & Video",
        description: "Seamless communication built directly into your workspace. No external tools needed.",
        features: [
            "Built-in voice chat & video conferencing",
            "Active speaker detection",
            "Screen sharing & presentation mode",
            "Low-latency WebRTC peer connections"
        ],
        image: "linear-gradient(135deg, #F472B6 0%, #7DD3FC 100%)"
    },
    {
        id: "workflows",
        label: "Workflows",
        icon: Share2,
        title: "Collaboration Workflows",
        description: "Structured workflows for pair programming, mentoring, and team collaboration.",
        features: [
            "Dedicated pair programming sessions",
            "Mentoring & managed classrooms",
            "Live debugging with context sharing",
            "Team collaboration rooms"
        ],
        image: "linear-gradient(135deg, #64748B 0%, #1E293B 100%)"
    }
];

export const FeatureTabs = () => {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Update active tab based on scroll position
    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            if (latest < 0.33) {
                setActiveTab(tabs[0]);
            } else if (latest < 0.66) {
                setActiveTab(tabs[1]);
            } else {
                setActiveTab(tabs[2]);
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    const handleTabClick = (tab: Tab) => {
        // Optional: Implement smooth scroll to the specific section if needed, 
        // but for now we'll just set it (controlled by scroll mostly)
        setActiveTab(tab);
        // Using scrollIntoView or window.scrollTo logic requires precise calculation 
        // which can be complex with sticky positioning, so keeping it simple.
    };

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-transparent">
            {/* Sticky Container */}
            <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">

                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#0C1220]/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 font-sans">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            <span className="relative inline-block">
                                <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] opacity-15" />
                                <span className="relative">
                                    <GradientShineText text="Built for Human Connection" />
                                </span>
                            </span>
                        </h2>
                        <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto">
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
                                    ${activeTab.id === tab.id ? "text-white" : "text-[#94A3B8]"}
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
                                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                            {activeTab.title}
                                        </h3>
                                        <p className="text-lg text-[#CBD5E1] leading-relaxed">
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
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56, 189, 248,0.8)]" />
                                                {feature}
                                            </motion.li>
                                        ))}
                                    </ul>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-[#CBD5E1] transition-colors pointer-events-auto"
                                    >
                                        Learn more
                                    </motion.button>
                                </div>

                                {/* Right: Visual/Preview */}
                                <div className={`relative ${tabs.indexOf(activeTab) % 2 !== 0 ? 'lg:order-1' : ''}`}>
                                    {/* Decorator elements behind */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#38BDF8]/10 to-[#64748B]/10 rounded-2xl blur-2xl transform rotate-3 scale-105" />

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
