import { motion } from "motion/react";
import { AstraCore } from "./AstraCore";
import { Code2, Sparkles, Zap } from "lucide-react";
import { Parallax, SmoothText } from "./ScrollReveal";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  const handleLaunch = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left Side - 3D Interactive Model */}
        <Parallax speed={0.25}>
          <motion.div
            className="relative flex items-center justify-center order-2 lg:order-1"
            initial={{ opacity: 0, x: -120 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <AstraCore />
          </motion.div>
        </Parallax>

        {/* Right Side - Hero Content */}
        <Parallax speed={-0.15}>
          <motion.div
            className="space-y-6 md:space-y-8 order-1 lg:order-2"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Main Headline */}
            <div className="space-y-3 md:space-y-4">
              <motion.h1
                className="relative inline-block"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <span className="block text-5xl md:text-7xl xl:text-8xl font-bold tracking-tight leading-none font-serif italic">
                  <span className="relative inline-block">
                    <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] opacity-15" />
                    <span className="relative bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] bg-clip-text text-transparent">
                      Parallax
                    </span>
                  </span>
                </span>
              </motion.h1>
 
              {/* Tagline with smooth animation */}
              <motion.p
                className="text-xl md:text-2xl xl:text-3xl text-zinc-400 tracking-wide font-medium font-serif italic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Your Collaborative Coding Universe
              </motion.p>
            </div>

            {/* Description with staggered text */}
            <motion.div
              className="space-y-4 pb-8 md:pb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <p className="text-base md:text-lg text-zinc-300 leading-relaxed max-w-lg font-normal">
                Experience the future of development. Parallax brings real-time teamwork,
                cloud-native coding, and next-gen collaboration into one cosmic workspace.
                Build together, ship faster, create boundlessly.
              </p>
            </motion.div>

            {/* Feature Highlights with staggered animation */}
            <motion.div
              className="flex flex-wrap gap-3 md:gap-4 pb-8 md:pb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { icon: Code2, text: "Real-time Teamwork", color: "from-[#D4AF37] to-[#71717A]" },
                { icon: Zap, text: "Cloud-Native Coding", color: "from-[#F59E0B] to-[#09090B]" },
                { icon: Sparkles, text: "Next-Gen Collaboration", color: "from-[#D4AF37] to-[#A1A1AA]" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.15, duration: 0.8 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
                    style={{
                      backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    }}
                  />
                  <div className="relative px-4 md:px-5 py-2.5 md:py-3 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
                      <span className="text-xs md:text-sm font-medium">{feature.text}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              className="flex flex-col items-start gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <motion.button
                className="relative group px-8 md:px-10 py-4 md:py-5 rounded-2xl overflow-hidden"
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLaunch}
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#A1A1AA] via-[#D4AF37] to-[#A1A1AA] bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />

                {/* Button content */}
                <span className="relative z-10 flex items-center gap-3 text-base md:text-lg text-white font-semibold tracking-wide">
                  Launch into Parallax
                  <motion.span
                    animate={{ y: [0, -2, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.span>
                </span>
              </motion.button>

              {/* Scroll down hint with enhanced animation */}
              <motion.div
                className="flex items-center gap-2 text-xs text-zinc-600 ml-2 cursor-pointer font-medium italic"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                onClick={() => {
                  const element = document.querySelector("[data-features-section]");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Scroll down to explore</span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4], y: [0, 2, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
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
