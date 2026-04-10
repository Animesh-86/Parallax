import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { Mail, Github, Twitter, MessageSquare, Send } from "lucide-react";
import { useState } from "react";

export default function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
            <div className="fixed inset-0 z-0">
                <FluidFlowBackground
                    colors={["#1D4ED8", "#38BDF8", "#2DD4BF", "#A78BFA"]}
                    mouseForce={24}
                    cursorSize={130}
                    resolution={0.3}
                    autoDemo={true}
                    autoSpeed={0.55}
                    autoIntensity={2.4}
                    autoResumeDelay={1200}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
            <div className="pointer-events-none fixed inset-0 z-0 bg-[#060910]/45" />
            <Header />

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            Get in{" "}
                            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
                                Touch
                            </span>
                        </h1>
                        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
                            Questions, feedback, bug reports, or just want to say hi — I'm all ears.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Contact Form */}
                        <motion.div
                            className="lg:col-span-3 p-8 rounded-2xl bg-white/[0.04] border border-white/10"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-xl font-medium text-white mb-6">Send a Message</h2>
                            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                <div>
                                    <label htmlFor="name" className="block text-sm text-[#94A3B8] mb-1">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm text-[#94A3B8] mb-1">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm text-[#94A3B8] mb-1">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows={5}
                                        className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8]/50 transition-colors resize-none"
                                        placeholder="What's on your mind?"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </button>
                            </form>
                        </motion.div>

                        {/* Sidebar */}
                        <motion.div
                            className="lg:col-span-2 space-y-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            {[
                                { icon: Mail, title: "Email", value: "hello@parallax.dev", href: "mailto:hello@parallax.dev" },
                                { icon: Github, title: "GitHub", value: "github.com/parallax", href: "#" },
                                { icon: Twitter, title: "Twitter / X", value: "@parallaxdev", href: "#" },
                                { icon: MessageSquare, title: "Discord", value: "Coming soon", href: "#" },
                            ].map((item, index) => (
                                <a
                                    key={index}
                                    href={item.href}
                                    className="block p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-[#38BDF8]/20 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center">
                                            <item.icon className="w-4 h-4 text-[#2DD4BF]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.title}</p>
                                            <p className="text-xs text-[#94A3B8]">{item.value}</p>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
