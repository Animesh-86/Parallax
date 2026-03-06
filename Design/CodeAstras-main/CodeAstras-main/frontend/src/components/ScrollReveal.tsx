import { motion, useScroll, useTransform } from "motion/react";
import { ReactNode, useRef } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  scale?: boolean;
  rotate?: boolean;
}

export function ScrollReveal({ 
  children, 
  direction = "up", 
  delay = 0,
  scale = false,
  rotate = false 
}: ScrollRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 100, x: 0 };
      case "down":
        return { y: -100, x: 0 };
      case "left":
        return { x: 100, y: 0 };
      case "right":
        return { x: -100, y: 0 };
    }
  };

  const initial = {
    opacity: 0,
    ...getInitialPosition(),
    ...(scale && { scale: 0.8 }),
    ...(rotate && { rotateX: -20 }),
  };

  const whileInView = {
    opacity: 1,
    x: 0,
    y: 0,
    ...(scale && { scale: 1 }),
    ...(rotate && { rotateX: 0 }),
  };

  return (
    <motion.div
      initial={initial}
      whileInView={whileInView}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
}

export function Parallax({ children, speed = 0.5 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed]);

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
}

interface ScrollScale3DProps {
  children: ReactNode;
}

export function ScrollScale3D({ children }: ScrollScale3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [25, 0, -25]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
        rotateX,
        opacity,
        transformPerspective: 1000,
      }}
    >
      {children}
    </motion.div>
  );
}
