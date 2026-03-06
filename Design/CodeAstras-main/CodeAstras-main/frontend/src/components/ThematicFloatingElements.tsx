import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { 
  Users, 
  GitBranch, 
  Radio,
  Mic,
  FolderTree,
  FileCode,
  Layers,
  Zap,
  Cloud,
  Share2,
  MessageSquare,
  Globe,
  Lock,
  Eye,
  CodeXml,
  Workflow
} from "lucide-react";

export function ThematicFloatingElements() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const cosmicElements = [
    // Collaboration icons
    { Icon: Users, position: { top: "8%", left: "8%", rotate: 15 }, color: "from-cyan-400 to-blue-500", size: "md" },
    { Icon: Share2, position: { top: "12%", right: "12%", rotate: -20 }, color: "from-purple-400 to-pink-500", size: "sm" },
    { Icon: MessageSquare, position: { top: "25%", left: "5%", rotate: 25 }, color: "from-cyan-400 to-purple-500", size: "lg" },
    
    // Version control
    { Icon: GitBranch, position: { top: "35%", right: "7%", rotate: -15 }, color: "from-emerald-400 to-cyan-500", size: "md" },
    { Icon: Workflow, position: { top: "45%", left: "10%", rotate: 20 }, color: "from-blue-400 to-indigo-500", size: "sm" },
    
    // Real-time presence
    { Icon: Radio, position: { top: "55%", right: "15%", rotate: -25 }, color: "from-pink-400 to-purple-500", size: "lg" },
    { Icon: Eye, position: { top: "40%", left: "3%", rotate: 10 }, color: "from-cyan-400 to-blue-500", size: "sm" },
    
    // Voice & communication
    { Icon: Mic, position: { top: "65%", left: "8%", rotate: 15 }, color: "from-purple-400 to-pink-500", size: "md" },
    { Icon: Globe, position: { top: "70%", right: "10%", rotate: -30 }, color: "from-orange-400 to-red-500", size: "sm" },
    
    // File & workspace
    { Icon: FolderTree, position: { top: "78%", left: "12%", rotate: 20 }, color: "from-emerald-400 to-cyan-500", size: "lg" },
    { Icon: FileCode, position: { top: "85%", right: "18%", rotate: -15 }, color: "from-yellow-400 to-orange-500", size: "md" },
    { Icon: Layers, position: { top: "90%", left: "20%", rotate: 25 }, color: "from-blue-400 to-cyan-500", size: "sm" },
    
    // Cloud & sync
    { Icon: Cloud, position: { top: "18%", right: "25%", rotate: -20 }, color: "from-cyan-400 to-purple-500", size: "md" },
    { Icon: Zap, position: { top: "50%", right: "3%", rotate: 15 }, color: "from-yellow-400 to-orange-500", size: "lg" },
    
    // Security & access
    { Icon: Lock, position: { top: "32%", left: "15%", rotate: -10 }, color: "from-indigo-400 to-purple-500", size: "sm" },
    { Icon: CodeXml, position: { top: "60%", right: "20%", rotate: 20 }, color: "from-pink-400 to-purple-500", size: "md" },
  ];

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return { container: "w-12 h-12 md:w-16 md:h-16", icon: "w-6 h-6 md:w-8 md:h-8" };
      case "md":
        return { container: "w-16 h-16 md:w-20 md:h-20", icon: "w-8 h-8 md:w-10 md:h-10" };
      case "lg":
        return { container: "w-20 h-20 md:w-24 md:h-24", icon: "w-10 h-10 md:w-12 md:h-12" };
      default:
        return { container: "w-16 h-16 md:w-20 md:h-20", icon: "w-8 h-8 md:w-10 md:h-10" };
    }
  };

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {cosmicElements.map(({ Icon, position, color, size }, index) => {
        const y = useTransform(
          scrollYProgress,
          [0, 1],
          [0, (index % 2 === 0 ? 1 : -1) * (300 + index * 20)]
        );
        const rotate = useTransform(scrollYProgress, [0, 1], [position.rotate, position.rotate + 360]);
        const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.3, 0.8, 0.8, 0.3]);
        const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.6]);
        const sizeClasses = getSizeClasses(size);

        return (
          <motion.div
            key={index}
            className="absolute hidden lg:block"
            style={{
              ...position,
              y,
              opacity,
              scale,
            }}
          >
            <motion.div
              className="relative"
              style={{ rotate, transformPerspective: 1200 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-40"
                style={{
                  boxShadow: `0 0 60px rgba(0, 229, 255, 0.4)`,
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 3 + index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Inner glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${color} blur-2xl opacity-50`} />
              
              {/* 3D Card with glassmorphism */}
              <motion.div
                className={`relative ${sizeClasses.container} rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center shadow-2xl`}
                animate={{
                  y: [0, -15, 0],
                  rotateX: [0, 10, 0],
                  rotateY: [0, 10, 0],
                }}
                transition={{
                  duration: 4 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2,
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Icon 
                  className={`${sizeClasses.icon} bg-gradient-to-br ${color} bg-clip-text text-transparent`} 
                  strokeWidth={1.5} 
                />

                {/* Orbiting particle */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8 + index, repeat: Infinity, ease: "linear" }}
                >
                  <div className={`absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${color} -translate-x-1/2`} />
                </motion.div>
              </motion.div>

              {/* Decorative ring */}
              <motion.div
                className="absolute -inset-2 rounded-full border border-white/5"
                animate={{ rotate: -360 }}
                transition={{ duration: 15 + index, repeat: Infinity, ease: "linear" }}
              >
                <div className={`absolute top-0 left-1/2 w-1 h-1 rounded-full bg-gradient-to-br ${color} -translate-x-1/2`} />
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Additional cosmic particles */}
      {[...Array(12)].map((_, i) => {
        const x = useTransform(scrollYProgress, [0, 1], [0, (i % 2 === 0 ? 100 : -100)]);
        const randomTop = `${(i * 8) % 100}%`;
        const randomLeft = `${(i * 13) % 100}%`;

        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 md:w-1.5 md:h-1.5 rounded-full hidden lg:block"
            style={{
              top: randomTop,
              left: randomLeft,
              x,
              background: i % 3 === 0 ? "rgba(0, 229, 255, 0.6)" : i % 3 === 1 ? "rgba(168, 85, 247, 0.6)" : "rgba(236, 72, 153, 0.6)",
              boxShadow: "0 0 10px currentColor",
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        );
      })}
    </div>
  );
}
