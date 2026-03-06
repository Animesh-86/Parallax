import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WordRotatorProps {
    words: string[];
    className?: string;
    cycleInterval?: number;
}

export const WordRotator: React.FC<WordRotatorProps> = ({
    words,
    className = "",
    cycleInterval = 2000,
}) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, cycleInterval);
        return () => clearInterval(interval);
    }, [words.length, cycleInterval]);

    return (
        <div className={`relative inline-block overflow-hidden align-top h-[1.2em] ${className}`}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={index}
                    initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-x-0"
                >
                    {words[index]}
                </motion.div>
            </AnimatePresence>
            {/* Invisible placeholder to maintain width if not monospaced, 
            though for rotator usually we want fixed width or specific layout. 
            Here we overlap perfectly. 
            To prevent layout shift, maybe we can use the longest word as invisible static? 
        */}
            <span className="opacity-0 pointer-events-none">
                {words.reduce((a, b) => a.length > b.length ? a : b)}
            </span>
        </div>
    );
};
