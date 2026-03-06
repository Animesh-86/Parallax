import { motion, useScroll, useTransform } from "motion/react";
import { ReactNode, useRef } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  scale?: boolean;
  rotate?: boolean;
  className?: string;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  scale = false,
  rotate = false,
  className = ""
}: ScrollRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 80, x: 0 };
      case "down":
        return { y: -80, x: 0 };
      case "left":
        return { x: 80, y: 0 };
      case "right":
        return { x: -80, y: 0 };
    }
  };

  const initial = {
    opacity: 0,
    ...getInitialPosition(),
    ...(scale && { scale: 0.85 }),
    ...(rotate && { rotateX: -15 }),
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
      className={className}
      initial={initial}
      whileInView={whileInView}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 1.2,
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

  const y = useTransform(scrollYProgress, [0, 1], [-120 * speed, 120 * speed]);

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

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.75, 1, 0.75]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [30, 0, -30]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
        rotateX,
        opacity,
        transformPerspective: 1200,
      }}
    >
      {children}
    </motion.div>
  );
}

// New smooth text animation component
interface SmoothTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export function SmoothText({ children, className = "", delay = 0 }: SmoothTextProps) {
  const words = children.split(" ");

  return (
    <motion.span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: delay + index * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="inline-block"
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.span>
  );
}
