import { motion } from "framer-motion";

interface GradientShineTextProps {
    text: string;
    className?: string;
}

export const GradientShineText = ({ text, className = "" }: GradientShineTextProps) => {
    return (
        <motion.span
            className={`inline-block relative ${className}`}
            style={{
                backgroundImage: "linear-gradient(to right, #2DD4BF, #7DD3FC, #F472B6, #2DD4BF)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent", // Fallback
            }}
            animate={{
                backgroundPosition: ["0% center", "200% center"],
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
            }}
        >
            {text}
        </motion.span>
    );
};
