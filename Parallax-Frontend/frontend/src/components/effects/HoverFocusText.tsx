import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface HoverFocusTextProps {
    text: string;
    className?: string;
    fontClassName?: string;
}

export const HoverFocusText: React.FC<HoverFocusTextProps> = ({
    text,
    className = "",
    fontClassName = "text-6xl font-bold",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered || !containerRef.current) return;

        let animationFrameId: number;
        const startTime = Date.now();

        const animate = () => {
            if (!containerRef.current) return;
            const now = Date.now();
            const time = (now - startTime) / 1000; // time in seconds
            const rect = containerRef.current.getBoundingClientRect();

            // Orbital movement pattern
            const x = (Math.sin(time * 0.8) * 0.4 + 0.5) * rect.width;
            const y = (Math.cos(time * 1.2) * 0.4 + 0.5) * rect.height;

            setPosition({ x, y });
            setOpacity(0.8 + Math.sin(time * 2) * 0.2); // Pulsing opacity
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovered]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setOpacity(1);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // Don't set opacity to 0 here, let the effect take over
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative select-none cursor-default inline-block ${className}`}
        >
            {/* Base Text (Outline) */}
            <span
                className={`block text-transparent bg-clip-text text-stroke-white ${fontClassName}`}
                style={{
                    WebkitTextStroke: "1px rgba(255, 255, 255, 0.2)",
                    color: "transparent",
                }}
            >
                {text}
            </span>

            {/* Overlay Text (Filled with gradient mask) */}
            <div
                className={`absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-white to-[#38BDF8] ${fontClassName}`}
                style={{
                    pointerEvents: "none",
                    WebkitMaskImage: `radial-gradient(250px circle at ${position.x}px ${position.y}px, black, transparent)`,
                    maskImage: `radial-gradient(250px circle at ${position.x}px ${position.y}px, black, transparent)`,
                    opacity: opacity,
                    transition: "opacity 0.2s ease",
                    color: "transparent",
                    // Cosmos Gradient with glow
                    backgroundImage: "linear-gradient(to right, #38BDF8, #7DD3FC, #F472B6, #38BDF8)",
                    backgroundSize: "200% auto",
                    filter: "drop-shadow(0 0 15px rgba(56, 189, 248, 0.6))",
                    WebkitTextStroke: "1px rgba(244, 114, 182, 0.8)", // Pink-ish stroke
                }}
            >
                {text}
            </div>
        </div>
    );
};
