import { motion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function InteractiveCosmicStars() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Generate star positions
  const [stars] = useState(() => 
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      parallaxStrength: Math.random() * 50 + 20,
      color: ['cyan', 'purple', 'pink', 'blue'][Math.floor(Math.random() * 4)],
      delay: Math.random() * 2,
    }))
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.width / 2) / rect.width);
        mouseY.set((e.clientY - rect.height / 2) / rect.height);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[5] overflow-hidden"
    >
      {stars.map((star) => {
        const scrollY = useTransform(
          scrollYProgress,
          [0, 1],
          [0, star.speed * 1000]
        );
        
        const parallaxX = useTransform(
          smoothMouseX,
          [-0.5, 0.5],
          [-star.parallaxStrength, star.parallaxStrength]
        );
        
        const parallaxY = useTransform(
          smoothMouseY,
          [-0.5, 0.5],
          [-star.parallaxStrength, star.parallaxStrength]
        );

        const getStarColor = () => {
          switch (star.color) {
            case 'cyan':
              return 'rgba(0, 229, 255, 0.6)';
            case 'purple':
              return 'rgba(168, 85, 247, 0.6)';
            case 'pink':
              return 'rgba(236, 72, 153, 0.6)';
            case 'blue':
              return 'rgba(59, 130, 246, 0.6)';
            default:
              return 'rgba(0, 229, 255, 0.6)';
          }
        };

        return (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: getStarColor(),
              boxShadow: `0 0 ${star.size * 3}px ${getStarColor()}`,
              x: parallaxX,
              y: useTransform(
                [scrollY, parallaxY],
                ([scroll, py]) => (scroll as number % 1000) + (py as number)
              ),
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + star.delay,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Shooting stars */}
      {[...Array(3)].map((_, i) => (
        <ShootingStar key={`shooting-${i}`} delay={i * 8} />
      ))}

      {/* Floating particles with scroll interaction */}
      {[...Array(20)].map((_, i) => {
        const particleScrollY = useTransform(
          scrollYProgress,
          [0, 1],
          [0, (i % 2 === 0 ? 500 : -500)]
        );

        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${(i * 7 + 10) % 90}%`,
              top: `${(i * 11 + 5) % 90}%`,
              background: i % 3 === 0 
                ? 'rgba(0, 229, 255, 0.4)' 
                : i % 3 === 1 
                ? 'rgba(168, 85, 247, 0.4)' 
                : 'rgba(236, 72, 153, 0.4)',
              boxShadow: '0 0 8px currentColor',
              y: particleScrollY,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        );
      })}
    </div>
  );
}

function ShootingStar({ delay }: { delay: number }) {
  const startX = Math.random() * 100;
  const startY = Math.random() * 50;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, -200],
        y: [0, 200],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: delay,
        repeatDelay: 6,
        ease: "easeOut",
      }}
    >
      <div className="relative w-1 h-1">
        <div className="absolute w-1 h-1 rounded-full bg-cyan-400" />
        <motion.div
          className="absolute w-20 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent origin-right"
          style={{
            rotate: 45,
            left: 2,
            top: 0,
          }}
        />
      </div>
    </motion.div>
  );
}
