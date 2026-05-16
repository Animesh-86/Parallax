import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface PerspectiveScrollRevealProps {
    children: React.ReactNode;
    className?: string;
}

export function PerspectiveScrollReveal({ children, className = "" }: PerspectiveScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "center center"],
    });

    const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };

    // Animate from tilted back and lower opacity to upright and full opacity
    const rotateX = useSpring(useTransform(scrollYProgress, [0, 1], [45, 0]), springConfig);
    const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), springConfig);
    const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.8, 1]), springConfig);
    const y = useSpring(useTransform(scrollYProgress, [0, 1], [100, 0]), springConfig);

    return (
        <div
            ref={ref}
            className={`perspective-1000 ${className}`}
            style={{ perspective: "1000px" }}
        >
            <motion.div
                style={{
                    rotateX,
                    opacity,
                    scale,
                    y,
                    transformStyle: "preserve-3d",
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}
