import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GradientShineText } from "./effects/GradientShineText";

const features = [
    {
        title: "Cloud-Native IDE",
        description: "Full-featured code editor with syntax highlighting, multi-language support, and file management – all in your browser.",
        details: [
            "Browser-accessible cloud editor",
            "Multi-language support",
            "File & project management",
            "Intelligent syntax highlighting",
            "Low-latency real-time editing"
        ],
        color: "#7DD3FC", // Purple 500
    },
    {
        title: "Secure Runtimes",
        description: "Execute code safely in isolated containers. Per-session environments with CPU/memory limits and zero host access.",
        details: [
            "Isolated Docker containers",
            "Language-specific runtimes",
            "Execution time & resource limits",
            "Real-time output streaming",
            "Ephemeral environments"
        ],
        color: "#F472B6", // Pink 500
    },
    {
        title: "Enterprise Security",
        description: "Bank-grade isolation with network restrictions, resource throttling, and ephemeral sessions that wipe clean.",
        details: [
            "Network isolation",
            "Strict resource throttling",
            "Automatic session expiration",
            "No persistent host access",
            "Controlled workspace access"
        ],
        color: "#38BDF8", // Indigo 500
    },
    {
        title: "Modern Architecture",
        description: "Built on a stateless backend with WebSocket real-time communication and scalable session handling.",
        details: [
            "Cloud-native stateless backend",
            "WebSocket real-time sync",
            "Scalable session handling",
            "Modular microservices",
            "Environment-based config"
        ],
        color: "#CBD5E1", // Purple 300
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
                    <h2 className="text-4xl md:text-5xl font-bold mb-3 md:mb-4">
                        <span className="relative inline-block">
                            <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] opacity-15" />
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
                            className="relative h-[65vh] md:h-[55vh] w-[85vw] md:w-[30vw] min-w-[300px] flex-shrink-0 rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-md flex flex-col justify-between overflow-hidden group hover:border-[#38BDF8]/50 transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(56, 189, 248,0.3)]"
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
                                <h3 className="text-3xl font-bold mb-4 text-white">{feature.title}</h3>
                                <p className="text-base text-[#CBD5E1] mb-6 leading-relaxed">{feature.description}</p>
                            </div>

                            <div className="relative z-10 border-t border-white/10 pt-6">
                                <ul className="space-y-3">
                                    {feature.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm text-[#94A3B8] group-hover:text-[#CBD5E1] transition-colors">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]/50" />
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
