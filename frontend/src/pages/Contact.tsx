import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { Mail, Github, Linkedin, MessageSquare, Send, Radio, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export default function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden font-sans">
            {/* Background System */}
            <div className="fixed inset-0 z-0 opacity-40">
                <FluidFlowBackground
                    colors={["#D4AF37", "#F59E0B", "#09090B", "#000000"]}
                    mouseForce={20}
                    cursorSize={120}
                    autoDemo={true}
                />
            </div>
            <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#09090B]/20 via-transparent to-[#09090B]" />

            <Header />

            <main className="relative z-10 pt-32 pb-24">
                <div className="max-w-5xl mx-auto px-6">
                    
                    {/* Architectural Header */}
                    <div className="text-center mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-4"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-white">
                                Contact Us
                            </h1>
                            <p className="text-[#A1A1AA] max-w-xl mx-auto text-sm tracking-wide pt-2">
                                Have questions or feedback? We'd love to hear from you.
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                        {/* Primary Communication Console */}
                        <motion.div
                            className="lg:col-span-4 rounded-[40px] bg-zinc-950/40 border border-white/5 backdrop-blur-xl relative overflow-hidden group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {/* Panel Header */}
                            <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <Radio className="w-4 h-4 text-[#D4AF37]" />
                                    <span className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">Send us a message</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40" />
                                </div>
                            </div>

                            <form className="p-10 space-y-8" onSubmit={(e) => e.preventDefault()}>
                                {/* System Status Notice */}
                                <div className="p-5 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-xs text-zinc-300 font-mono flex items-start gap-3">
                                    <Radio className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5 animate-pulse" />
                                    <div>
                                        <span className="text-[#D4AF37] font-bold uppercase tracking-wider block mb-1">System Status: Inactive</span>
                                        Form submission is offline as backend functionalities are still under development. Please reach out to us via direct email or social nodes on the right.
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-[9px] font-mono text-[#D4AF37] tracking-[0.2em] uppercase">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-0 py-2.5 bg-transparent border-b border-white/10 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-[#D4AF37] transition-all"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-[9px] font-mono text-[#D4AF37] tracking-[0.2em] uppercase">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-0 py-2.5 bg-transparent border-b border-white/10 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-[#D4AF37] transition-all"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-[9px] font-mono text-[#D4AF37] tracking-[0.2em] uppercase">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full px-0 py-2.5 bg-transparent border-b border-white/10 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-[#D4AF37] transition-all resize-none"
                                        placeholder="Write your message..."
                                    />
                                </div>

                                <div className="pt-4 flex items-center justify-end">
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group flex items-center gap-3 px-8 py-3.5 bg-[#D4AF37] text-black font-bold tracking-[0.2em] uppercase text-[10px]"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Send Message
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Communication Nodes Sidebar */}
                        <motion.div
                            className="lg:col-span-2 space-y-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {[
                                { icon: Mail, title: "Email", value: "animesh8sharma@gmail.com", href: "mailto:animesh8sharma@gmail.com", tag: "Active" },
                                { icon: Github, title: "GitHub", value: "github.com/Animesh-86/Parallax", href: "https://github.com/Animesh-86/Parallax.git", tag: "Public" },
                                { icon: Linkedin, title: "LinkedIn", value: "linkedin.com/in/animesh-sharma-adev", href: "https://www.linkedin.com/in/animesh-sharma-adev", tag: "Professional" },
                                { icon: MessageSquare, title: "Discord", value: "Coming Soon", href: "#", tag: "Coming Soon" },
                            ].map((item, index) => (
                                <motion.a
                                    key={index}
                                    href={item.href}
                                    target={item.href !== "#" ? "_blank" : undefined}
                                    rel={item.href !== "#" ? "noopener noreferrer" : undefined}
                                    whileHover={{ x: 6 }}
                                    className="block p-6 rounded-[28px] bg-zinc-950/20 border border-white/5 hover:border-[#D4AF37]/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                                            <item.icon className="w-4 h-4 text-[#71717A] group-hover:text-[#D4AF37] transition-colors" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[9px] font-mono text-[#71717A] tracking-wider">{item.title}</span>
                                                <span className={`text-[8px] font-mono ${item.tag === 'Coming Soon' ? 'text-zinc-600' : 'text-[#D4AF37]/60'}`}>{item.tag}</span>
                                            </div>
                                            <p className="text-sm font-bold tracking-wider text-white/90">{item.value}</p>
                                        </div>
                                    </div>
                                </motion.a>
                            ))}

                            {/* Additional Metadata Node */}
                            <div className="p-6 rounded-[28px] border border-white/5 bg-white/[0.01]">
                                <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600 uppercase mb-3">
                                    <LinkIcon className="w-3 h-3" />
                                    Security
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                                    All communications are encrypted. Data handling follows industry standards.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
