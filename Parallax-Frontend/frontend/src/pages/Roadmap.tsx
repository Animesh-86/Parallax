import React from "react";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { CheckCircle, Circle, Clock, Rocket } from "lucide-react";

const phases = [
    {
        status: "done",
        title: "Foundation",
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
        status: "active",
        title: "Currently Building",
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
        status: "planned",
        title: "Coming Next",
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
        status: "future",
        title: "Long-Term Vision",
        items: [
            "Marketplace for coding challenges",
            "Integration with GitHub / GitLab workflows",
            "Enterprise SSO and admin dashboards",
            "On-premise deployment for organizations",
            "SDK for embedding Parallax in other apps",
        ],
    },
];

const statusConfig = {
    done: { icon: CheckCircle, color: "text-[#4ADE80]", border: "border-[#4ADE80]/20", bg: "bg-[#4ADE80]/10", label: "Shipped" },
    active: { icon: Clock, color: "text-[#38BDF8]", border: "border-[#38BDF8]/20", bg: "bg-[#38BDF8]/10", label: "In Progress" },
    planned: { icon: Circle, color: "text-[#2DD4BF]", border: "border-[#2DD4BF]/20", bg: "bg-[#2DD4BF]/10", label: "Planned" },
    future: { icon: Rocket, color: "text-[#F472B6]", border: "border-[#F472B6]/20", bg: "bg-[#F472B6]/10", label: "Exploring" },
};

export default function Roadmap() {
    // Interactive node state
    const [activeNode, setActiveNode] = React.useState<number | null>(null);

    // SVG path coordinates for nodes
    const nodeCoords = [
        { x: 120, y: 120 }, // Foundation
        { x: 320, y: 220 }, // Currently Building
        { x: 520, y: 160 }, // Coming Next
        { x: 700, y: 320 }, // Long-Term Vision
    ];

    // Theme planet colors
    const planetColors = [
        '#38BDF8', // Stellar blue
        '#2DD4BF', // Nebula teal
        '#F472B6', // Rose
        '#FBBF24', // Warning gold
    ];
    const planetGlow = [
        '#7DD3FC', // Ice blue
        '#0D9488', // Deep teal
        '#F472B6', // Rose
        '#FBBF24', // Gold
    ];
    // Hover state
    const [hoveredNode, setHoveredNode] = React.useState<number | null>(null);

    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
            <CosmicStars />
            <Header />

            {/* Cosmic floating particles */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#38BDF8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#2DD4BF]/10 rounded-full blur-[100px]" />
                <div className="absolute top-1/3 left-10 w-72 h-72 bg-[#F472B6]/10 rounded-full blur-[80px]" />
            </div>

            <main className="relative z-10 pt-32 pb-32">
                <div className="w-screen px-0">
                    <motion.div
                        className="text-center mb-16 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
                                Roadmap
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            A cosmic journey through Parallax's milestones. Hover a planet to explore each phase.
                        </p>
                    </motion.div>

                    {/* SVG Cosmic Path - Full width, edge-to-edge, planets themed */}
                    <div className="relative w-screen overflow-x-auto h-[420px] md:h-[380px] mb-16 flex items-center scrollbar-thin scrollbar-thumb-[#38BDF8]/40 scrollbar-track-transparent snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="w-[1800px] h-full relative flex items-center">
                            <svg width="1800" height="380" viewBox="0 0 1800 380" className="absolute left-0 top-0 z-10">
                                {/* Path connecting nodes - wave */}
                                <motion.path
                                    d="M120 120 Q700 60 900 220 Q1400 320 1600 160 Q1700 250 1750 320"
                                    stroke="#38BDF8"
                                    strokeWidth="3"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.2 }}
                                    style={{ filter: 'drop-shadow(0 0 12px #38BDF8)' }}
                                />
                                {/* Nodes (planets) with theme colors */}
                                {[{ x: 120, y: 120 }, { x: 900, y: 220 }, { x: 1600, y: 160 }, { x: 1750, y: 320 }].map((coord, idx) => {
                                    return (
                                        <motion.circle
                                            key={idx}
                                            cx={coord.x}
                                            cy={coord.y}
                                            r={hoveredNode === idx ? 36 : 28}
                                            fill={planetColors[idx]}
                                            stroke="#F1F5F9"
                                            strokeWidth={hoveredNode === idx ? 7 : 4}
                                            className={`cursor-pointer snap-center`}
                                            whileHover={{ scale: 1.18 }}
                                            animate={{ filter: hoveredNode === idx ? `drop-shadow(0 0 32px ${planetGlow[idx]})` : `drop-shadow(0 0 16px ${planetGlow[idx]})` }}
                                            onMouseEnter={() => setHoveredNode(idx)}
                                            onMouseLeave={() => setHoveredNode(null)}
                                        />
                                    );
                                })}
                                {/* Node labels - high contrast */}
                                {[{ x: 120, y: 120 }, { x: 900, y: 220 }, { x: 1600, y: 160 }, { x: 1750, y: 320 }].map((coord, idx) => (
                                    <text
                                        key={idx}
                                        x={coord.x}
                                        y={coord.y - (hoveredNode === idx ? 48 : 36)}
                                        textAnchor="middle"
                                        fontSize={hoveredNode === idx ? 24 : 18}
                                        fill="#F1F5F9"
                                        style={{ fontWeight: 'bold', pointerEvents: 'none', filter: `drop-shadow(0 0 8px ${planetGlow[idx]})` }}
                                    >
                                        {phases[idx].title}
                                    </text>
                                ))}
                            </svg>

                            {/* Info panel on hover - floating above node */}
                            {hoveredNode !== null && (
                                <motion.div
                                    className="absolute z-30 left-0 top-0"
                                    style={{
                                        transform: `translateX(${[120,900,1600,1750][hoveredNode]-210}px) translateY(${[120,220,160,320][hoveredNode]-180}px)`
                                    }}
                                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="w-[420px] md:w-[340px] bg-[#0C1220]/95 border border-[#38BDF8]/30 rounded-2xl shadow-2xl p-6 backdrop-blur-xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: planetColors[hoveredNode], boxShadow: `0 0 16px ${planetGlow[hoveredNode]}` }}>
                                                {React.createElement(statusConfig[phases[hoveredNode].status].icon, { className: `w-4 h-4 text-white` })}
                                            </div>
                                            <h2 className="text-xl font-semibold text-white drop-shadow-lg">{phases[hoveredNode].title}</h2>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#162032] text-white font-medium shadow-md">{statusConfig[phases[hoveredNode].status].label}</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {phases[hoveredNode].items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: planetColors[hoveredNode] }} />
                                                    <span className="drop-shadow-sm">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        {/* Fade edges for scroll */}
                        <div className="pointer-events-none absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#060910] to-transparent z-20" />
                        <div className="pointer-events-none absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#060910] to-transparent z-20" />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
