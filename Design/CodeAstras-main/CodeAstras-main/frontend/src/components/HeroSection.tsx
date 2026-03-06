import { motion } from "motion/react";
import { AstraCore } from "./AstraCore";
import { Code2, Sparkles, Zap } from "lucide-react";
import { Parallax } from "./ScrollReveal";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-[1600px] w-full mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left Side - 3D Interactive Model */}
        <Parallax speed={0.3}>
          <motion.div
            className="relative flex items-center justify-center order-2 lg:order-1"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <AstraCore />
          </motion.div>
        </Parallax>

        {/* Right Side - Hero Content */}
        <Parallax speed={-0.2}>
          <motion.div
            className="space-y-6 md:space-y-8 order-1 lg:order-2"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Main Headline */}
            <div className="space-y-3 md:space-y-4">
              <motion.h1
                className="relative inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="block text-5xl md:text-7xl xl:text-8xl tracking-tight leading-none">
                  <span className="relative inline-block">
                    <span className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-400 to-purple-600 opacity-15" />
                    <span className="relative bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      CodeAstra
                    </span>
                  </span>
                </span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                className="text-xl md:text-2xl xl:text-3xl text-cyan-300/90 tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Your Collaborative Coding Universe
              </motion.p>
            </div>

            {/* Description */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-xl">
                Experience the future of development. CodeAstra brings real-time teamwork, 
                cloud-native coding, and next-gen collaboration into one cosmic workspace. 
                Build together, ship faster, create boundlessly.
              </p>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
              className="flex flex-wrap gap-3 md:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {[
                { icon: Code2, text: "Real-time Teamwork", color: "from-cyan-400 to-blue-500" },
                { icon: Zap, text: "Cloud-Native Coding", color: "from-purple-400 to-pink-500" },
                { icon: Sparkles, text: "Next-Gen Collaboration", color: "from-cyan-400 to-purple-500" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
                    style={{
                      backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    }}
                  />
                  <div className="relative px-4 md:px-5 py-2.5 md:py-3 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                      <span className="text-xs md:text-sm">{feature.text}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              className="flex flex-col items-start gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <motion.button
                className="relative group px-8 md:px-10 py-4 md:py-5 rounded-2xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.hash = '/dashboard'}
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-600 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                
                {/* Button content */}
                <span className="relative z-10 flex items-center gap-3 text-base md:text-lg text-white">
                  Launch into CodeAstra
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                </span>
              </motion.button>

              {/* Scroll down hint */}
              <motion.div
                className="flex items-center gap-2 text-xs text-gray-500 ml-2"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span>Scroll down to explore</span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ↓
                </motion.span>
              </motion.div>
            </motion.div>
          </motion.div>
        </Parallax>
      </div>
    </section>
  );
}