import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Users, Code, Zap, MessageSquare, GitBranch, Share2 } from "lucide-react";

export function CollaborationNebula() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  // 6 collaborator nodes
  const collaborators = [
    { 
      Icon: Users, 
      label: "Team Members", 
      color: "from-cyan-400 to-blue-500",
      delay: 0
    },
    { 
      Icon: Code, 
      label: "Code Editor", 
      color: "from-purple-400 to-pink-500",
      delay: 1
    },
    { 
      Icon: MessageSquare, 
      label: "Team Chat", 
      color: "from-emerald-400 to-cyan-500",
      delay: 2
    },
    { 
      Icon: GitBranch, 
      label: "Version Control", 
      color: "from-orange-400 to-red-500",
      delay: 3
    },
    { 
      Icon: Zap, 
      label: "Real-time Sync", 
      color: "from-yellow-400 to-orange-500",
      delay: 4
    },
    { 
      Icon: Share2, 
      label: "File Sharing", 
      color: "from-pink-400 to-purple-500",
      delay: 5
    },
  ];

  const orbitRadius = 220; // Single orbit distance
  const rotationDuration = 20; // Moderate speed - 20 seconds per full rotation

  return (
    <section ref={ref} className="relative py-6 md:py-8 px-4 md:px-8 overflow-hidden">
      <div className="max-w-[1600px] mx-auto">
        {/* Title - moved above the orbital */}
        <motion.div
          className="text-center mb-6 md:mb-8"
          style={{ opacity }}
        >
          <h3 className="text-2xl md:text-4xl xl:text-5xl mb-2 md:mb-3">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Collaboration in Orbit
            </span>
          </h3>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
            Your team moves in perfect sync around your project core
          </p>
        </motion.div>

        <motion.div
          className="relative w-full aspect-square max-w-[1000px] mx-auto"
          style={{ scale, opacity }}
        >
          {/* Central static "sun" - completely non-rotating */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              {/* Subtle outer glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-2xl" />
              
              {/* Main static core sphere */}
              <div className="relative w-full h-full rounded-full backdrop-blur-xl bg-gradient-to-br from-white/20 to-white/10 border-2 border-white/30 flex items-center justify-center shadow-2xl">
                {/* Inner subtle glow */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-400/10 via-purple-500/10 to-pink-500/10 blur-lg" />
                
                {/* Static code glyph "<>" */}
                <div className="relative z-10 text-4xl md:text-5xl">
                  <span className="bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent opacity-90">
                    &lt;/&gt;
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Single stationary orbit ring - does NOT rotate */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
            style={{
              width: `${orbitRadius * 2}px`,
              height: `${orbitRadius * 2}px`,
            }}
          />

          {/* Collaborator nodes - ONLY these rotate around the ring */}
          {collaborators.map((collaborator, index) => {
            const angleOffset = (index / collaborators.length) * 360;

            return (
              <motion.div
                key={index}
                className="absolute top-1/2 left-1/2"
                style={{
                  width: 0,
                  height: 0,
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: rotationDuration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: -(collaborator.delay / collaborators.length) * rotationDuration,
                }}
              >
                <motion.div
                  className="group cursor-pointer relative"
                  style={{
                    position: "absolute",
                    left: `${orbitRadius}px`,
                    top: 0,
                    x: "-50%",
                    y: "-50%",
                  }}
                  whileHover={{ scale: 1.3, zIndex: 50 }}
                >
                  {/* Collaborator glow */}
                  <div className={`absolute inset-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${collaborator.color} blur-lg opacity-30 group-hover:opacity-60 transition-opacity`} />
                  
                  {/* Collaborator card */}
                  <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/15 to-white/10 border border-white/20 group-hover:border-white/40 flex items-center justify-center transition-all duration-300 shadow-xl`}>
                    <collaborator.Icon 
                      className={`w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br ${collaborator.color} bg-clip-text text-transparent`} 
                      strokeWidth={2}
                    />
                  </div>

                  {/* Label on hover */}
                  <motion.div
                    className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  >
                    <span className="text-xs md:text-sm px-3 py-1.5 rounded-full backdrop-blur-xl bg-white/10 border border-white/20">
                      {collaborator.label}
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}

          {/* Subtle cosmic dust particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`dust-${i}`}
              className="absolute w-0.5 h-0.5 md:w-1 md:h-1 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                background: i % 3 === 0 ? "rgba(0, 229, 255, 0.3)" : i % 3 === 1 ? "rgba(168, 85, 247, 0.3)" : "rgba(236, 72, 153, 0.3)",
                boxShadow: "0 0 4px currentColor",
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear",
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}