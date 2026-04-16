import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue } from "framer-motion";
import { GradientShineText } from "./effects/GradientShineText";
import { useState, useRef } from "react";

export function AstraCore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for 3D Parallax tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [5, -5]), {
    stiffness: 150,
    damping: 30
  });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-5, 5]), {
    stiffness: 150,
    damping: 30
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  // 3D orbital ring configurations with dramatic angles - SCALED UP
  const orbitalRings = [
    { radius: 180, speed: 8, angle: 15, color: "#71717A", nodes: 1, planetSize: 6, trail: true }, // Muted Zinc
    { radius: 260, speed: 12, angle: 30, color: "#D4AF37", nodes: 1, planetSize: 7, trail: true }, // Gold
    { radius: 340, speed: 16, angle: 45, color: "#F59E0B", nodes: 1, planetSize: 10, trail: false }, // Amber
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-[1200px] flex items-center justify-center"
      style={{ perspective: "2000px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      {/* Main 3D Scene Container */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        className="relative w-full h-full flex items-center justify-center"
      >

        {/* Enhanced ambient glow with color shifts - LARGER */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full pointer-events-none blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
            background: [
              "radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, rgba(113, 113, 122, 0.15) 30%, transparent 60%)",
              "radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(212, 175, 55, 0.2) 30%, transparent 60%)",
              "radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, rgba(113, 113, 122, 0.15) 30%, transparent 60%)",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Dynamic background stars with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => {
            const depth = Math.random();
            return (
              <motion.div
                key={`star-${i}`}
                className="absolute rounded-full bg-[#D4AF37]"
                style={{
                  width: `${1 + depth * 2}px`,
                  height: `${1 + depth * 2}px`,
                  left: `${15 + Math.random() * 70}%`,
                  top: `${15 + Math.random() * 70}%`,
                  filter: `blur(${depth * 0.5}px)`,
                  x: useTransform(mouseX, [-200, 200], [-depth * 15, depth * 15]),
                  y: useTransform(mouseY, [-200, 200], [-depth * 15, depth * 15]),
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            );
          })}
        </div>

        {/* ===== CENTRAL CORE ===== */}

        {/* Solar corona rings - LARGER */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={`corona-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${200 + i * 25}px`,
              height: `${200 + i * 25}px`,
              transformStyle: "preserve-3d",
              transform: "translateZ(60px)",
              border: `1px solid rgba(212, 175, 55, ${0.15 / i})`,
              boxShadow: `0 0 30px rgba(212, 175, 55, ${0.2 / i})`,
            }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}

        {/* Main Sun/Star core - LARGER */}
        <motion.div
          className="absolute w-48 h-48 rounded-full overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(80px)",
            background: "radial-gradient(circle at 35% 35%, rgba(212, 175, 55, 0.9), rgba(113, 113, 122, 0.7), rgba(245, 158, 11, 0.5))",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            boxShadow: `
              0 0 80px rgba(212, 175, 55, 0.6), 
              0 0 120px rgba(113, 113, 122, 0.4),
              inset 0 0 50px rgba(212, 175, 55, 0.3)
            `,
          }}
          animate={{
            scale: isHovered ? [1, 1.05, 1] : [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Solar flares rotating */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, rgba(212, 175, 55, 0.4) 10%, transparent 20%, rgba(113, 113, 122, 0.3) 40%, transparent 50%, rgba(245, 158, 11, 0.4) 70%, transparent 80%)",
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Subtle surface texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Bright sun highlight */}
          <div
            className="absolute rounded-full blur-lg"
            style={{
              top: "20%",
              left: "25%",
              width: "35%",
              height: "35%",
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 60%, transparent 100%)",
            }}
          />

          {/* Code symbol in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-5xl font-mono relative z-10"
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                textShadow: "0 0 20px rgba(212, 175, 55, 0.8), 0 0 40px rgba(113, 113, 122, 0.5)",
                fontWeight: 600,
              }}
              animate={{
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              &lt;/&gt;
            </motion.span>
          </div>
        </motion.div>

        {/* ===== ORBITAL RING SYSTEMS ===== */}
        {orbitalRings.map((ring, ringIndex) => (
          <div
            key={`ring-${ringIndex}`}
            className="absolute"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${ring.angle}deg)`,
            }}
          >
            {/* Orbital ring path - More visible */}
            <div
              className="absolute rounded-full"
              style={{
                width: `${ring.radius * 2}px`,
                height: `${ring.radius * 2}px`,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                border: `1.5px solid ${ring.color}50`,
                boxShadow: `0 0 20px ${ring.color}30, inset 0 0 20px ${ring.color}20`,
              }}
            />

            {/* Orbiting nodes - Fixed revolution */}
            {[...Array(ring.nodes)].map((_, nodeIndex) => {
              const startAngle = (nodeIndex / ring.nodes) * 360;

              return (
                <motion.div
                  key={`node-${nodeIndex}`}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                  animate={{
                    rotate: [startAngle, startAngle + 360],
                  }}
                  transition={{
                    rotate: { duration: ring.speed, repeat: Infinity, ease: "linear" },
                  }}
                >
                  {/* Position node on orbit path */}
                  <div
                    style={{
                      position: "absolute",
                      left: `${ring.radius}px`,
                      top: "0px",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {/* Node sphere - Counter-rotate to prevent stretching */}
                    <motion.div
                      className="relative"
                      style={{
                        transform: `rotateX(${-ring.angle}deg)`,
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        rotateZ: [0, -360],
                      }}
                      transition={{
                        rotateZ: { duration: ring.speed, repeat: Infinity, ease: "linear" },
                      }}
                    >
                      <motion.div
                        style={{
                          width: `${ring.planetSize * 4}px`,
                          height: `${ring.planetSize * 4}px`,
                        }}
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          delay: ringIndex * 0.5,
                          ease: "easeInOut",
                        }}
                      >
                        {/* Profile icon style - circular avatar */}
                        <div
                          className="absolute inset-0 rounded-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${ring.color}ff 0%, ${ring.color}cc 100%)`,
                            boxShadow: `
                              0 0 20px ${ring.color}cc, 
                              0 0 35px ${ring.color}66,
                              inset -2px -2px 6px rgba(0, 0, 0, 0.3),
                              inset 2px 2px 6px rgba(255, 255, 255, 0.15)
                            `,
                            border: `1.5px solid ${ring.color}dd`,
                          }}
                        >
                          {/* User icon inside - using SVG path for user silhouette */}
                          <svg
                            width="60%"
                            height="60%"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                            }}
                          >
                            <circle cx="12" cy="8" r="4" fill="rgba(255, 255, 255, 0.9)" />
                            <path
                              d="M4 20c0-4 3.5-7 8-7s8 3 8 7"
                              stroke="rgba(255, 255, 255, 0.9)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              fill="none"
                            />
                          </svg>
                        </div>

                        <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight relative z-10">
                          <span className="relative">
                            <GradientShineText text="The Core of Parallax" />
                          </span>
                        </h2>
                        {/* Subtle highlight on top */}
                        <div
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            top: "10%",
                            left: "15%",
                            width: "40%",
                            height: "40%",
                            background: "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)",
                          }}
                        />

                        {/* Glowing ring around avatar */}
                        <div
                          className="absolute inset-[-3px] rounded-full pointer-events-none"
                          style={{
                            background: `radial-gradient(circle, transparent 45%, ${ring.color}60 60%, transparent 80%)`,
                            filter: 'blur(3px)',
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Elegant expanding pulse */}
        {[0, 1].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) translateZ(70px)",
              border: `1.5px solid ${i === 0 ? 'rgba(212, 175, 55, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            }}
            animate={{
              width: [100, 600],
              height: [100, 600],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: i * 2.5,
              ease: "easeOut",
            }}
          />
        ))}

      </motion.div>
    </div>
  );
}
