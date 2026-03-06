import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { MessageCircle, Mail, Github, ArrowRight } from "lucide-react";

export default function Support() {
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
                                Support
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            Need help? Here's how to get it. As a solo-built project, response times are human — but I read everything.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                        {[
                            {
                                icon: Github,
                                title: "GitHub Issues",
                                desc: "Found a bug or have a feature request? Open an issue on GitHub. It's the fastest way to get things tracked and resolved.",
                                cta: "Open an Issue",
                                href: "#",
                            },
                            {
                                icon: Mail,
                                title: "Email",
                                desc: "For account issues, security concerns, or anything that doesn't fit a GitHub issue. I'll get back to you as soon as I can.",
                                cta: "Send Email",
                                href: "/contact",
                            },
                            {
                                icon: MessageCircle,
                                title: "Documentation",
                                desc: "Most questions are answered in the docs. Check there first — quick start guides, FAQ, and feature walkthroughs.",
                                cta: "Read Docs",
                                href: "/docs",
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mb-4">
                                    <item.icon className="w-5 h-5 text-[#2DD4BF]" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-[#94A3B8] leading-relaxed mb-4 flex-1">{item.desc}</p>
                                <Link to={item.href} className="inline-flex items-center gap-1.5 text-sm text-[#38BDF8] hover:underline">
                                    {item.cta} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-[#CBD5E1] mb-2">
                            Parallax is in active development. If something breaks, I want to know about it.
                        </p>
                        <p className="text-sm text-[#94A3B8]">
                            Every bug report makes the platform better for everyone.
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
