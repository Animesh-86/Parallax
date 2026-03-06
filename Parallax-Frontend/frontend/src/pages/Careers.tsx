import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { Code2, GitPullRequest, Star, Heart } from "lucide-react";

export default function Careers() {
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
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
                                Contribute
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            Parallax is solo-built, but that doesn't mean you can't be part of the journey. Here's how to get involved.
                        </p>
                    </motion.div>

                    <div className="space-y-5">
                        {[
                            {
                                icon: GitPullRequest,
                                title: "Open Source Contributions",
                                desc: "When Parallax opens its source, there'll be plenty of opportunities to contribute — from core features to bug fixes to documentation. Star the repo to get notified when it happens.",
                            },
                            {
                                icon: Code2,
                                title: "Beta Testing",
                                desc: "Use Parallax, break things, and tell me about it. Early feedback shapes the product more than anything else. Every bug report is a contribution.",
                            },
                            {
                                icon: Star,
                                title: "Feature Suggestions",
                                desc: "Have an idea that would make collaborative coding better? Open a feature request. The best ideas come from people who actually use the product.",
                            },
                            {
                                icon: Heart,
                                title: "Spread the Word",
                                desc: "If Parallax solves a real problem for you, tell someone. Share it with your team, mention it in a blog post, or just tweet about it. Word of mouth is how solo projects grow.",
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-colors"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08, duration: 0.5 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center shrink-0">
                                        <item.icon className="w-5 h-5 text-[#2DD4BF]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-1">{item.title}</h3>
                                        <p className="text-sm text-[#94A3B8] leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#38BDF8]/10 to-[#2DD4BF]/10 border border-[#38BDF8]/20 text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-[#CBD5E1]">
                            No open positions right now — it's a one-person operation. But if you're genuinely interested in building something together,{" "}
                            <Link to="/contact" className="text-[#38BDF8] hover:underline">reach out</Link>.
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
