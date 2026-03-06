import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <>
      {/* Top progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Animated particles following scroll */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-cyan-400 blur-sm z-[100] pointer-events-none"
        style={{
          x: useSpring(scrollYProgress, {
            stiffness: 100,
            damping: 30,
          }).get() * (typeof window !== 'undefined' ? window.innerWidth : 0),
          y: 0,
        }}
      />
    </>
  );
}
