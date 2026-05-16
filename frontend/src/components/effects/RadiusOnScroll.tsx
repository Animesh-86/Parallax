import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface RadiusOnScrollProps {
    children: React.ReactNode;
    className?: string;
    startRadius?: number;
    endRadius?: number;
    offset?: any; // framer motion offset type
}

export function RadiusOnScroll({
    children,
    className = "",
    startRadius = 300,
    endRadius = 24,
    offset = ["start end", "center center"]
}: RadiusOnScrollProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: offset
    });

    const borderRadius = useTransform(
        scrollYProgress,
        [0, 1],
        [startRadius, endRadius]
    );

    return (
        <motion.div
            ref={ref}
            className={`overflow-hidden ${className}`}
            style={{ borderRadius }}
        >
            {children}
        </motion.div>
    );
}
