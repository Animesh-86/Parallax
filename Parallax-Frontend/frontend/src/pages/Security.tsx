import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { Shield, Lock, Server, Eye, KeyRound, FileCheck } from "lucide-react";

const practices = [
    {
        icon: Lock,
        title: "Encrypted in Transit",
        desc: "All connections use TLS encryption. WebSocket channels, API requests, and file transfers are protected end-to-end. Nothing travels in plaintext.",
    },
    {
        icon: Server,
        title: "Isolated Execution",
        desc: "Every code run happens in a disposable Docker container with strict resource limits. Containers are destroyed after execution — no persistent state, no cross-contamination.",
    },
    {
        icon: KeyRound,
        title: "OAuth-Only Authentication",
        desc: "No passwords stored, ever. Authentication is handled entirely through Google and GitHub OAuth 2.0. Your credentials stay with your identity provider.",
    },
    {
        icon: Eye,
        title: "No Code Retention",
        desc: "Session code lives only for the duration of your session. Temporary rooms are fully cleaned up on disconnect. Your code isn't mined, analyzed, or stored beyond what you save.",
    },
    {
        icon: FileCheck,
        title: "Input Validation",
        desc: "All user input is validated and sanitized on both client and server. API endpoints enforce strict schemas. SQL injection, XSS, and command injection are mitigated at every layer.",
    },
    {
        icon: Shield,
        title: "Minimal Attack Surface",
        desc: "Dependencies are kept lean and audited. The backend exposes only necessary endpoints. Container networking is locked down to prevent lateral movement.",
    },
];

export default function Security() {
    return (
        <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden">
            <CosmicStars />
            <Header />

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            Security{" "}
                            <span className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] bg-clip-text text-transparent">
                                by Design
                            </span>
                        </h1>
                        <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
                            Security isn't a feature bolted on at the end — it's baked into every layer of Parallax from the ground up.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {practices.map((item, index) => (
                            <motion.div
                                key={index}
                                className="group p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-[#D4AF37]/20 transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08, duration: 0.5 }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                                    <item.icon className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom note */}
                    <motion.div
                        className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/10 border border-[#D4AF37]/20 text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-[#CBD5E1]">
                            Found a vulnerability? Reach out through the{" "}
                            <Link to="/contact" className="text-[#D4AF37] hover:underline">contact page</Link>.
                            {" "}Responsible disclosure is appreciated.
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
