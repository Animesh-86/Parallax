import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GradientShineText } from "./effects/GradientShineText";

const features = [
    {
        title: "Persistent Workspaces",
        description: "Full-fledged Ubuntu development environments running entirely in isolated Docker containers with persistent VFS storage.",
        details: [
            "Host-mounted volume persistence",
            "Multi-language polyglot execution",
            "Zero-trust sandboxed processes",
            "Raw PTY TTY streams",
            "Automatic environment recovery"
        ],
        color: "#D4AF37", // Champagne Gold
    },
    {
        title: "LSP Intelligence",
        description: "First-class intellisense powered by native Language Server Protocols (LSP) running directly inside your workspace container.",
        details: [
            "Real-time auto-completion",
            "Inline error diagnostics",
            "Hover definitions & signatures",
            "Direct WebSocket RPC streams",
            "Monaco Language Client integration"
        ],
        color: "#F8FAFC", // Diamond White
    },
    {
        title: "Real-Time Collaboration",
        description: "Seamless multiplayer coding with sub-millisecond latency via custom WebSockets. Work together without stepping on toes.",
        details: [
            "Live cursor & selection tracking",
            "Conflict-free concurrent editing",
            "Integrated team chat channels",
            "Granular RBAC permissions",
            "Inline code review comments"
        ],
        color: "#F59E0B", // Amber
    },
    {
        title: "Native Git Workflows",
        description: "Version control is a first-class citizen. Create branches, commit code, and review pull requests without leaving the editor.",
        details: [
            "Visual branch management",
            "1-click merge requests",
            "Cross-project team synchronization",
            "Seamless GitHub remote pushes",
            "Integrated diff viewer"
        ],
        color: "#71717A", // Muted Zinc
    },
];

export const SuperPoweredSection = () => {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const [scrollEnd, setScrollEnd] = React.useState("-65%");

    React.useEffect(() => {
        const handleResize = () => {
            // On desktop (>= 768px), we need less travel distance as cards take up less relative width
            if (window.innerWidth >= 768) {
                setScrollEnd("-35%");
            } else {
                setScrollEnd("-65%");
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const x = useTransform(scrollYProgress, [0, 1], ["1%", scrollEnd]);

    return (
        <section ref={targetRef} className="relative h-[250vh] bg-transparent">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">

                <div className="absolute top-32 left-0 w-full z-10 px-10 md:px-24 flex justify-start">
                    <h2 className="text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic font-serif">
                        <span className="relative inline-block">
                            <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] opacity-15" />
                            <span className="relative">
                                <GradientShineText text="Super Powered Features" />
                            </span>
                        </span>
                    </h2>
                </div>

                <motion.div style={{ x }} className="flex gap-8 px-10 md:px-24">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="relative h-[65vh] md:h-[55vh] w-[85vw] md:w-[30vw] min-w-[300px] flex-shrink-0 rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-md flex flex-col justify-between overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(212, 175, 55,0.3)]"
                        >
                            <div
                                className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                                style={{
                                    background: `radial-gradient(circle at top right, ${feature.color}, transparent 60%)`
                                }}
                            />

                            <div className="relative z-10">
                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm">
                                    <div className="h-3 w-3 rounded-full" style={{ background: feature.color }} />
                                </div>
                                <h3 className="text-3xl font-bold mb-4 text-white font-serif">{feature.title}</h3>
                                <p className="text-base text-zinc-300 mb-6 leading-relaxed">{feature.description}</p>
                            </div>

                            <div className="relative z-10 border-t border-white/10 pt-6">
                                <ul className="space-y-3">
                                    {feature.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]/50" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
