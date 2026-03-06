import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { CosmicStars } from '../components/workspace/CosmicStars';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ArrowRight, Code2, Zap, Target, Sparkles, Rocket, Terminal, Globe, Shield } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
            {/* Cosmic Background */}
            <CosmicStars />

            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-10 w-96 h-96 bg-[#38BDF8]/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2DD4BF]/15 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#64748B]/10 rounded-full blur-[120px]" />
            </div>

            {/* Navigation Header */}
            <Header />

            {/* Main Content */}
            <main className="relative z-10 pb-20">

                {/* Hero */}
                <section className="relative pt-28 pb-16">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <motion.div
                            className="text-center space-y-6"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-4xl md:text-5xl xl:text-6xl font-semibold tracking-tight">
                                The Story Behind{" "}
                                <span className="relative inline-block">
                                    <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] opacity-20" />
                                    <span className="relative bg-gradient-to-r from-[#38BDF8] via-[#F472B6] to-[#2DD4BF] bg-clip-text text-transparent">
                                        Parallax
                                    </span>
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-[#94A3B8] max-w-3xl mx-auto leading-relaxed">
                                A solo-built platform for real-time collaborative coding, live interviews, and team problem-solving — built because the existing tools weren't good enough.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Two-column: Origin + Why */}
                <section className="relative py-12">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div
                            className="p-8 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-2xl font-semibold text-[#38BDF8] mb-4">Why I Built This</h2>
                            <div className="space-y-4 text-[#CBD5E1] leading-relaxed">
                                <p>
                                    I got tired of watching technical interviews happen on platforms that feel nothing like actual engineering. Whiteboard questions, isolated sandboxes, no real collaboration — it's a broken process.
                                </p>
                                <p>
                                    I wanted something where two people could open a file, write code together, run it instantly, talk through problems, and actually see how someone thinks — not just what they memorized.
                                </p>
                                <p className="text-[#2DD4BF] font-medium">
                                    So I started building it myself.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="p-8 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-2xl font-semibold text-[#2DD4BF] mb-4">What Parallax Is</h2>
                            <div className="space-y-4 text-[#CBD5E1] leading-relaxed">
                                <p>
                                    Parallax is a real-time collaborative coding platform. You create a session, invite people, and start coding together — with live cursors, shared file trees, integrated terminals, voice chat, and instant code execution.
                                </p>
                                <p>
                                    It's designed for technical interviews, pair programming, mentoring sessions, and any scenario where multiple developers need to work on the same codebase simultaneously.
                                </p>
                                <p className="text-[#38BDF8] font-medium">
                                    Think Google Docs, but for code — with actual execution.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="relative py-12">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <motion.h2
                            className="text-2xl md:text-3xl font-semibold text-center mb-10"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            What's <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">Under the Hood</span>
                        </motion.h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                { icon: Code2, title: "Live Collaborative Editor", desc: "Real-time multi-cursor editing with syntax highlighting, powered by Monaco Editor and WebSockets." },
                                { icon: Terminal, title: "Sandboxed Execution", desc: "Isolated Docker containers run your code safely — Python, Java, JavaScript, and more, with zero setup." },
                                { icon: Globe, title: "Voice & Video Chat", desc: "Built-in WebRTC voice and video so you can discuss code while writing it. No switching tabs." },
                                { icon: Zap, title: "Instant Sessions", desc: "Create a room, share a link, start coding. No accounts required for guests. Zero friction onboarding." },
                                { icon: Shield, title: "Secure by Default", desc: "OAuth 2.0 auth, encrypted connections, sandboxed execution environments. Security isn't an afterthought." },
                                { icon: Rocket, title: "Built to Scale", desc: "Spring Boot backend, React frontend, PostgreSQL, Docker orchestration — production-grade architecture from day one." },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    className="group p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-[#38BDF8]/20 transition-all duration-300"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.08, duration: 0.5 }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mb-4 group-hover:bg-[#38BDF8]/20 transition-colors">
                                        <item.icon className="w-5 h-5 text-[#2DD4BF]" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-[#94A3B8] leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tech Stack + Solo Dev */}
                <section className="relative py-12">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Solo Dev Note */}
                        <motion.div
                            className="lg:col-span-2 p-8 rounded-2xl bg-gradient-to-br from-[#38BDF8]/10 to-[#2DD4BF]/5 border border-[#38BDF8]/20 backdrop-blur-sm"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Sparkles className="w-6 h-6 text-[#38BDF8]" />
                                <h2 className="text-2xl font-semibold text-white">Solo Built</h2>
                            </div>
                            <div className="space-y-4 text-[#CBD5E1] leading-relaxed">
                                <p>
                                    Every line of code in Parallax — frontend, backend, infrastructure, design — is written by one person. No team, no agency, no templates.
                                </p>
                                <p>
                                    I'm building this because I genuinely believe collaborative coding platforms can be better. This isn't a startup pitch — it's a craft project that happens to solve a real problem.
                                </p>
                                <p className="text-[#2DD4BF] font-medium text-sm">
                                    Currently in active development. Shipping fast, breaking nothing.
                                </p>
                            </div>
                        </motion.div>

                        {/* Tech Stack */}
                        <motion.div
                            className="lg:col-span-3 p-8 rounded-2xl bg-white/[0.04] border border-white/10"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <h2 className="text-2xl font-semibold text-[#2DD4BF] mb-6">Tech Stack</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Frontend", tech: "React, TypeScript, Tailwind CSS, Vite, Framer Motion" },
                                    { label: "Backend", tech: "Java 17, Spring Boot 4, Hibernate, WebSockets" },
                                    { label: "Database", tech: "PostgreSQL on Render" },
                                    { label: "Auth", tech: "Google & GitHub OAuth 2.0, JWT" },
                                    { label: "Execution", tech: "Dockerized sandboxed runners per language" },
                                    { label: "Real-time", tech: "WebSockets, WebRTC, CRDT sync" },
                                ].map((item, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-white/[0.04] border border-white/5">
                                        <p className="text-xs text-[#38BDF8] font-medium uppercase tracking-wider mb-1">{item.label}</p>
                                        <p className="text-sm text-[#CBD5E1]">{item.tech}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Who It's For */}
                <section className="relative py-12">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <motion.div
                            className="p-8 rounded-2xl bg-white/[0.04] border border-white/10"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent mb-6">
                                Who It's For
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { icon: Target, label: "Interviewers", desc: "Run live coding interviews that actually reflect real engineering work." },
                                    { icon: Code2, label: "Candidates", desc: "Show how you think and collaborate, not just what you've memorized." },
                                    { icon: Sparkles, label: "Mentors", desc: "Teach and review code in real-time with zero setup overhead." },
                                    { icon: Zap, label: "Dev Teams", desc: "Pair program, debug together, or brainstorm with shared execution." },
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#2DD4BF]/20 transition-all"
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.08, duration: 0.4 }}
                                    >
                                        <item.icon className="w-5 h-5 text-[#38BDF8] mb-3" />
                                        <h3 className="text-base font-medium text-white mb-1">{item.label}</h3>
                                        <p className="text-sm text-[#94A3B8] leading-relaxed">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* CTA */}
                <section className="relative pt-8 pb-24">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <motion.div
                            className="p-10 md:p-14 rounded-2xl bg-gradient-to-br from-[#38BDF8]/15 via-[#060910] to-[#2DD4BF]/15 border border-[#38BDF8]/20 text-center space-y-6"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-[#2DD4BF] bg-clip-text text-transparent">
                                Try It Out
                            </h2>
                            <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                                Create a session, invite someone, and start coding together. No credit card, no setup, no friction.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                                <Link
                                    to="/signup"
                                    className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] text-white font-medium text-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-[#38BDF8]/20"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/"
                                    className="px-8 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-lg hover:bg-white/15 transition-all"
                                >
                                    Back to Home
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
