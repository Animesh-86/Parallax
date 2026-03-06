import { motion } from "motion/react";
import { useState } from "react";

export function AstraCore() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative w-full aspect-square max-w-[600px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.3) 0%, transparent 70%)',
        }}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: isHovered ? [0.3, 0.5, 0.3] : 0.3,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbital rings */}
      <motion.div
        className="absolute inset-[10%] rounded-full border-2 border-cyan-400/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Orbital nodes */}
        {[0, 120, 240].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 shadow-lg shadow-cyan-400/50"
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: '0 0',
            }}
            animate={{
              rotate: angle,
              x: '-50%',
              y: '-200%',
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute inset-[20%] rounded-full border-2 border-purple-500/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        {/* Orbital nodes */}
        {[60, 180, 300].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-cyan-500 shadow-lg shadow-purple-400/50"
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: '0 0',
            }}
            animate={{
              rotate: angle,
              x: '-50%',
              y: '-200%',
            }}
          />
        ))}
      </motion.div>

      {/* Main glass sphere */}
      <motion.div
        className="absolute inset-[25%] rounded-full backdrop-blur-3xl bg-gradient-to-br from-white/10 via-cyan-400/10 to-purple-500/10 border border-white/20 shadow-2xl overflow-hidden"
        animate={{
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 via-transparent to-purple-500/30" />
        
        {/* Circuit-like patterns */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-full h-full"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Geometric circuit lines */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <motion.path
                d="M 50 20 L 50 40 M 50 60 L 50 80 M 20 50 L 40 50 M 60 50 L 80 50"
                stroke="rgba(0, 229, 255, 0.5)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <motion.circle
                cx="50"
                cy="50"
                r="15"
                stroke="rgba(138, 43, 226, 0.5)"
                strokeWidth="0.5"
                fill="none"
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{ scale: 1.2, opacity: 0.8 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              
              {/* Corner nodes */}
              {[
                [30, 30], [70, 30], [70, 70], [30, 70]
              ].map(([x, y], i) => (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="rgba(0, 229, 255, 0.8)"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.5, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </svg>
          </motion.div>
        </div>

        {/* Pulsing core */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: '0 0 40px rgba(0, 229, 255, 0.6), 0 0 80px rgba(138, 43, 226, 0.4)',
          }}
        />
      </motion.div>

      {/* Energy particles flowing around */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-cyan-400"
          style={{
            top: '50%',
            left: '50%',
            boxShadow: '0 0 10px rgba(0, 229, 255, 0.8)',
          }}
          animate={{
            rotate: [0, 360],
            x: [0, Math.cos((i / 12) * Math.PI * 2) * 250],
            y: [0, Math.sin((i / 12) * Math.PI * 2) * 250],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Light streaks */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(0, 229, 255, 0.2) 50%, transparent 60%)',
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
