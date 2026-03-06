import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

export function InteractiveCodeBlock() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  return (
    <section className="relative py-8 md:py-12 px-4 md:px-8 overflow-hidden">
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
                  ? "rgba(0, 229, 255, 0.4)"
                  : i % 3 === 1
                  ? "rgba(168, 85, 247, 0.4)"
                  : "rgba(236, 72, 153, 0.4)",
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

      <div className="relative z-10 max-w-[1400px] mx-auto">
        {/* Section title */}
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
                Code in Perfect Harmony
              </span>
            </span>
          </h2>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
            Write, collaborate, and execute code in real-time with your entire team
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 md:mb-12">
          <button
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg ${
              activeTab === 0 ? "bg-gradient-to-r from-cyan-400 to-purple-600 text-white" : "bg-gray-100 text-gray-500"
            }`}
            onClick={() => setActiveTab(0)}
          >
            Collaborative Session
          </button>
          <button
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg ${
              activeTab === 1 ? "bg-gradient-to-r from-cyan-400 to-purple-600 text-white" : "bg-gray-100 text-gray-500"
            }`}
            onClick={() => setActiveTab(1)}
          >
            Real-time Sync
          </button>
        </div>

        {/* Code block */}
        <div className="relative rounded-2xl md:rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs md:text-sm text-gray-400">collaborative-session.js</span>
            <motion.button
              onClick={() => setIsTyping(!isTyping)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 transition-all duration-300 text-xs md:text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isTyping ? (
                <>
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
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
            <pre className="text-gray-300">
              <code>
                <span className="text-gray-500">// Real-time collaboration in action</span>
                {"\n"}
                <span className="text-purple-400">const</span> <span className="text-cyan-400">session</span> = <span className="text-purple-400">await</span> <span className="text-blue-400">CodeAstra</span>.<span className="text-yellow-400">join</span>({"{"}
                {"\n  "}
                <span className="text-cyan-400">room</span>: <span className="text-green-400">"cosmic-coders"</span>,
                {"\n  "}
                <span className="text-cyan-400">mode</span>: <span className="text-green-400">"collaborative"</span>
                {"\n}"});
                {"\n\n"}
                <span className="text-gray-500">// Share your cursor position</span>
                {"\n"}
                <span className="text-cyan-400">session</span>.<span className="text-yellow-400">on</span>(<span className="text-green-400">"cursorMove"</span>, (<span className="text-orange-400">user</span>, <span className="text-orange-400">pos</span>) {"=>"} {"{"}
                {"\n  "}
                <span className="text-yellow-400">renderCursor</span>(<span className="text-orange-400">user</span>.<span className="text-cyan-400">avatar</span>, <span className="text-orange-400">pos</span>);
                {"\n}"});
                {"\n\n"}
                <span className="text-gray-500">// Sync code changes instantly</span>
                {"\n"}
                <span className="text-cyan-400">session</span>.<span className="text-yellow-400">sync</span>(<span className="text-blue-400">editor</span>.<span className="text-yellow-400">getContent</span>());
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
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white/20 flex items-center justify-center text-xs">
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
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white/20 flex items-center justify-center text-xs">
              B
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}