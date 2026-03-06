import { motion, useTransform, useScroll } from "motion/react";
import { 
  Users, 
  Code, 
  Zap, 
  MessageSquare, 
  GitBranch, 
  Share2, 
  Eye,
  Sparkles,
  Terminal,
  Lock,
  Globe,
  Layers
} from "lucide-react";
import { ScrollReveal, ScrollScale3D, Parallax } from "./ScrollReveal";
import { useRef } from "react";

const features = [
  {
    icon: Code,
    title: "Real-time Collaborative Editing",
    description: "Code together in perfect sync.",
    gradient: "from-cyan-400 to-blue-500",
    iconBg: "bg-cyan-500/20",
  },
  {
    icon: MessageSquare,
    title: "Built-in Voice Chat",
    description: "Crystal-clear team communication.",
    gradient: "from-purple-400 to-pink-500",
    iconBg: "bg-purple-500/20",
  },
  {
    icon: Layers,
    title: "Multi-file Workspace",
    description: "Organize projects with ease.",
    gradient: "from-emerald-400 to-cyan-500",
    iconBg: "bg-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Code Execution Sandbox",
    description: "Test and run instantly.",
    gradient: "from-orange-400 to-red-500",
    iconBg: "bg-orange-500/20",
  },
  {
    icon: GitBranch,
    title: "Version History",
    description: "Never lose your progress.",
    gradient: "from-blue-400 to-indigo-500",
    iconBg: "bg-blue-500/20",
  },
  {
    icon: Users,
    title: "Live Presence",
    description: "See who's coding where.",
    gradient: "from-pink-400 to-purple-500",
    iconBg: "bg-pink-500/20",
  },
];

const featuresRow2 = [
  {
    icon: Layers,
    title: "Room Collaboration",
    description: "Dedicated coding spaces.",
    gradient: "from-cyan-400 to-purple-500",
    iconBg: "bg-cyan-500/20",
  },
  {
    icon: Sparkles,
    title: "AI Assistance",
    description: "Smart code suggestions.",
    gradient: "from-yellow-400 to-orange-500",
    iconBg: "bg-yellow-500/20",
  },
  {
    icon: GitBranch,
    title: "Git Integration",
    description: "Seamless version control.",
    gradient: "from-green-400 to-emerald-500",
    iconBg: "bg-green-500/20",
  },
  {
    icon: Terminal,
    title: "Integrated Terminal",
    description: "Full command line access.",
    gradient: "from-indigo-400 to-blue-500",
    iconBg: "bg-indigo-500/20",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance.",
    gradient: "from-yellow-400 to-red-500",
    iconBg: "bg-yellow-500/20",
  },
  {
    icon: Globe,
    title: "Cloud Synced",
    description: "Access from anywhere.",
    gradient: "from-blue-400 to-cyan-500",
    iconBg: "bg-blue-500/20",
  },
];

export function FeaturesGallery() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section ref={ref} className="relative py-8 md:py-12 px-4 md:px-8 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/10 to-purple-500/10 blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl -translate-y-1/2" />

      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* Section Title */}
        <Parallax speed={-0.1}>
          <motion.div
            className="text-center mb-8 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl xl:text-5xl mb-3 md:mb-4">
              <span className="relative inline-block">
                <span className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-400 to-purple-600 opacity-15" />
                <span className="relative bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Superpowered Features
                </span>
              </span>
            </h2>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
              Everything you need to build, collaborate, and ship — turbocharged for modern teams
            </p>
          </motion.div>
        </Parallax>

        {/* First row - scrolling left to right */}
        <ScrollReveal direction="up" scale={true}>
          <div className="relative mb-4 md:mb-6">
            {/* Gradient fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

            {/* Scrolling track */}
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-4 md:gap-6"
                animate={{
                  x: [0, -1500],
                }}
                transition={{
                  x: {
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
              >
                {/* Duplicate features for seamless loop */}
                {[...features, ...features, ...features].map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </motion.div>
            </div>
          </div>
        </ScrollReveal>

        {/* Second row - scrolling right to left */}
        <ScrollReveal direction="up" scale={true} delay={0.2}>
          <div className="relative">
            {/* Gradient fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

            {/* Scrolling track */}
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-4 md:gap-6"
                animate={{
                  x: [-1500, 0],
                }}
                transition={{
                  x: {
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
              >
                {/* Duplicate features for seamless loop */}
                {[...featuresRow2, ...featuresRow2, ...featuresRow2].map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </motion.div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  return (
    <motion.div
      className="relative group min-w-[280px] md:min-w-[360px] h-[200px] md:h-[240px]"
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow effect on hover */}
      <div 
        className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
      />

      {/* Glass card */}
      <div className="relative h-full p-5 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/30 transition-all duration-300 overflow-hidden">
        {/* Animated gradient overlay */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        />

        {/* Icon */}
        <motion.div
          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${feature.iconBg} backdrop-blur-xl border border-white/20 flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform duration-300`}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <feature.icon className={`w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} strokeWidth={2} />
        </motion.div>

        {/* Content */}
        <div className="relative space-y-2">
          <h3 className="text-base md:text-lg tracking-tight line-clamp-2">
            {feature.title}
          </h3>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed line-clamp-2">
            {feature.description}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 flex gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-br ${feature.gradient}`}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Orbital ring decoration */}
        <motion.div
          className="absolute -top-6 md:-top-10 -right-6 md:-right-10 w-20 md:w-32 h-20 md:h-32 rounded-full border border-white/10"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className={`absolute top-1/2 left-0 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-br ${feature.gradient} -translate-y-1/2`} />
        </motion.div>
      </div>
    </motion.div>
  );
}