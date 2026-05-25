import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";

export default function Terms() {
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
                            Terms of <span className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] bg-clip-text text-transparent">Service</span>
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
                            <h2 className="text-2xl font-medium text-white">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the Parallax collaborative development platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access or use our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">2. Acceptable Use Policy</h2>
                            <p>
                                Parallax provides ephemeral code execution environments and real-time collaboration tools. You agree not to misuse the platform. Specifically, you shall not:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-[#A1A1AA]">
                                <li>Use the execution sandboxes for cryptocurrency mining, network scanning, DDoS attacks, or any malicious activity.</li>
                                <li>Attempt to bypass container isolation, resource quotas, or access underlying host infrastructure.</li>
                                <li>Upload or execute code that violates the intellectual property rights of others.</li>
                                <li>Use the chat or WebRTC features to distribute spam, abusive, or illegal content.</li>
                            </ul>
                            <p>
                                We reserve the right to immediately terminate accounts and ban IP addresses that violate this policy.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">3. Intellectual Property</h2>
                            <p>
                                You retain all rights and ownership to the code and content you create, upload, or collaborate on within Parallax. Parallax claims no ownership over your intellectual property. By using the platform, you grant us a limited license solely to host, execute, and broadcast your code to your authorized collaborators as necessary to operate the service.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">4. Service Availability & Disclaimers</h2>
                            <p>
                                Parallax is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for 99.9% uptime, we do not guarantee that the service will be uninterrupted, error-free, or completely secure. Code executed within our sandboxes may be terminated if it exceeds resource constraints. We are not liable for any data loss, service interruptions, or damages arising from the use of our platform.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-medium text-white">5. Governing Law</h2>
                            <p>
                                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Parallax operates, without regard to its conflict of law provisions.
                            </p>
                        </section>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
