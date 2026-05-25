import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden">
            <CosmicStars />
            <Header />

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    <motion.div
                        className="mb-12 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            Privacy <span className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] bg-clip-text text-transparent">Policy</span>
                        </h1>
                        <p className="text-[#A1A1AA]">Last Updated: May 25, 2026</p>
                    </motion.div>

                    <motion.div
                        className="space-y-8 text-[#CBD5E1] leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">1. Information We Collect</h2>
                            <p>
                                At Parallax, we believe in minimizing data collection to only what is strictly necessary to operate our collaborative engineering environment. We collect:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-[#A1A1AA]">
                                <li><strong>Account Data:</strong> Information provided via OAuth (GitHub or Google), such as your email, name, and profile picture.</li>
                                <li><strong>Workspace Data:</strong> Code, project files, and chat messages generated while using Parallax. Please note that code executed in ephemeral containers is not retained after the container is destroyed unless explicitly saved to your persistent project workspace.</li>
                                <li><strong>Usage Telemetry:</strong> Anonymized analytical data related to application performance, feature usage, and error reporting to help us improve the system.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">2. How We Use Your Data</h2>
                            <p>We use your data solely to provide, maintain, and secure the Parallax platform. Specifically, to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-[#A1A1AA]">
                                <li>Authenticate your identity and sync your collaborative sessions across devices.</li>
                                <li>Facilitate real-time Operational Transformation (OT) for simultaneous editing.</li>
                                <li>Broker WebRTC signaling for peer-to-peer voice and video calls. (Note: Media streams are entirely peer-to-peer and are never routed through or recorded on our servers).</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">3. Data Sharing and Security</h2>
                            <p>
                                Parallax does not sell, rent, or trade your personal information. We may share limited data with trusted third-party service providers solely for infrastructure hosting (e.g., Docker container provisioning) and analytics, under strict confidentiality agreements.
                            </p>
                            <p>
                                We employ industry-standard security measures, including TLS encryption in transit, strict OAuth-based authentication, and sandboxed execution environments to protect your intellectual property.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">4. Your Rights</h2>
                            <p>
                                You have the right to access, update, or delete your account information at any time. If you wish to completely remove your data from our systems, you can initiate an account deletion request through your Profile settings, which will permanently scrub all associated workspace files and chat history.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">5. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:animesh8sharma@gmail.com" className="text-[#D4AF37] hover:underline">animesh8sharma@gmail.com</a>.
                            </p>
                        </section>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
