import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { PenLine, ArrowRight } from "lucide-react";

const posts = [
    {
        date: "Mar 2026",
        title: "Launching Parallax: Why I Built a Collaborative Coding Platform Solo",
        excerpt: "The story behind Parallax — what frustrated me about existing interview platforms, what I decided to build instead, and where it's headed.",
        tag: "Launch",
        tagColor: "text-[#38BDF8] bg-[#38BDF8]/10",
    },
    {
        date: "Mar 2026",
        title: "Real-Time Collaboration with WebSockets and CRDTs",
        excerpt: "How Parallax handles multiple users editing the same file simultaneously without conflicts. The architecture behind live cursor sync, operation transforms, and eventual consistency.",
        tag: "Engineering",
        tagColor: "text-[#2DD4BF] bg-[#2DD4BF]/10",
    },
    {
        date: "Mar 2026",
        title: "Sandboxed Code Execution: Running Untrusted Code Safely",
        excerpt: "A deep dive into how Parallax runs user-submitted code in isolated Docker containers with strict resource limits, network isolation, and automatic cleanup.",
        tag: "Security",
        tagColor: "text-[#F472B6] bg-[#F472B6]/10",
    },
    {
        date: "Feb 2026",
        title: "Building a Space-Themed UI That Doesn't Look AI-Generated",
        excerpt: "The iterative process of finding a unique visual identity — from generic purple to Mars amber to the current stellar blue palette. Three rewrites and a lot of grep.",
        tag: "Design",
        tagColor: "text-[#FBBF24] bg-[#FBBF24]/10",
    },
];

export default function Blog() {
    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
            <CosmicStars />
            <Header />

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] text-sm mb-4">
                            <PenLine className="w-4 h-4" />
                            Blog
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            Building in{" "}
                            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
                                Public
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            Engineering decisions, design iterations, and lessons from building a collaborative platform solo.
                        </p>
                    </motion.div>

                    {/* Posts */}
                    <div className="space-y-4">
                        {posts.map((post, index) => (
                            <motion.article
                                key={index}
                                className="group p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-[#38BDF8]/20 transition-all duration-300 cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08, duration: 0.5 }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs text-[#94A3B8]">{post.date}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${post.tagColor} font-medium`}>
                                        {post.tag}
                                    </span>
                                </div>
                                <h2 className="text-xl font-medium text-white mb-2 group-hover:text-[#38BDF8] transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-sm text-[#94A3B8] leading-relaxed mb-3">
                                    {post.excerpt}
                                </p>
                                <span className="inline-flex items-center gap-1 text-sm text-[#2DD4BF] group-hover:gap-2 transition-all">
                                    Read more <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </motion.article>
                        ))}
                    </div>

                    {/* More coming */}
                    <motion.div
                        className="mt-12 text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-sm text-[#94A3B8]">
                            More posts coming as the project evolves. Building in public means sharing the process, not just the results.
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
