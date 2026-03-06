import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { PerspectiveScrollReveal } from "./effects/PerspectiveScrollReveal";
import { Copy, Check } from "lucide-react";
import { PerspectiveScrollReveal } from "./effects/PerspectiveScrollReveal";
import { GradientShineText } from "./effects/GradientShineText";

export function InteractiveCodeBlock() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  return (
    <section className="relative py-24 px-4 md:px-8 overflow-hidden">
      {/* Floating background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background:
                i % 3 === 0
                  ? "rgba(45, 212, 191, 0.4)"
                  : i % 3 === 1
                    ? "rgba(56, 189, 248, 0.4)"
                    : "rgba(244, 114, 182, 0.4)",
              boxShadow: "0 0 10px currentColor",
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section title */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="relative inline-block">
              <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] opacity-15" />
              <span className="relative">
                <GradientShineText text="Code in Perfect Harmony" />
              </span>
            </span>
          </h2>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto">
            Write, collaborate, and execute code in real-time with your entire team
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 md:mb-12">
          <button
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg ${activeTab === 0 ? "bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] text-white" : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            onClick={() => setActiveTab(0)}
          >
            Collaborative Session
          </button>
          <button
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg ${activeTab === 1 ? "bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] text-white" : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            onClick={() => setActiveTab(1)}
          >
            Real-time Sync
          </button>
        </div>

        {/* Code block */}
        <PerspectiveScrollReveal className="relative rounded-2xl md:rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EF6461]/80" />
              <div className="w-3 h-3 rounded-full bg-[#FBBF24]/80" />
              <div className="w-3 h-3 rounded-full bg-[#4ADE80]/80" />
            </div>
            <span className="text-xs md:text-sm text-[#94A3B8]">collaborative-session.js</span>
            <motion.button
              onClick={() => setIsTyping(!isTyping)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10 hover:border-[#2DD4BF]/50 transition-all duration-300 text-xs md:text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isTyping ? (
                <>
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-[#4ADE80]" />
                  Typing
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 md:w-4 md:h-4" />
                  Copy
                </>
              )}
            </motion.button>
          </div>

          {/* Code content */}
          <div className="p-4 md:p-6 font-mono text-xs md:text-sm overflow-x-auto">
            <pre className="text-[#CBD5E1]">
              <code>
                <span className="text-[#64748B]">// Real-time collaboration in action</span>
                {"\n"}
                <span className="text-[#7DD3FC]">const</span> <span className="text-[#2DD4BF]">session</span> = <span className="text-[#7DD3FC]">await</span> <span className="text-[#94A3B8]">Parallax</span>.<span className="text-[#FBBF24]">join</span>({"{"}
                {"\n  "}
                <span className="text-[#2DD4BF]">room</span>: <span className="text-[#4ADE80]">"cosmic-coders"</span>,
                {"\n  "}
                <span className="text-[#2DD4BF]">mode</span>: <span className="text-[#4ADE80]">"collaborative"</span>
                {"\n}"});
                {"\n\n"}
                <span className="text-[#64748B]">// Share your cursor position</span>
                {"\n"}
                <span className="text-[#2DD4BF]">session</span>.<span className="text-[#FBBF24]">on</span>(<span className="text-[#4ADE80]">"cursorMove"</span>, (<span className="text-[#F59E0B]">user</span>, <span className="text-[#F59E0B]">pos</span>) {"=>"} {"{"}
                {"\n  "}
                <span className="text-[#FBBF24]">renderCursor</span>(<span className="text-[#F59E0B]">user</span>.<span className="text-[#2DD4BF]">avatar</span>, <span className="text-[#F59E0B]">pos</span>);
                {"\n}"});
                {"\n\n"}
                <span className="text-[#64748B]">// Sync code changes instantly</span>
                {"\n"}
                <span className="text-[#2DD4BF]">session</span>.<span className="text-[#FBBF24]">sync</span>(<span className="text-[#94A3B8]">editor</span>.<span className="text-[#FBBF24]">getContent</span>());
              </code>
            </pre>
          </div>

          {/* Animated cursor indicators */}
          <motion.div
            className="absolute top-[120px] left-[40px] md:top-[140px] md:left-[60px] flex items-center gap-2"
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, 100, 100, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#64748B] border-2 border-white/20 flex items-center justify-center text-xs">
              A
            </div>
          </motion.div>

          <motion.div
            className="absolute top-[160px] left-[80px] md:top-[200px] md:left-[120px] flex items-center gap-2"
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, -50, -50, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 0.5,
              ease: "easeInOut",
            }}
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#7DD3FC] to-[#F472B6] border-2 border-white/20 flex items-center justify-center text-xs">
              B
            </div>
          </motion.div>
        </PerspectiveScrollReveal>
      </div>
    </section >
  );
}
