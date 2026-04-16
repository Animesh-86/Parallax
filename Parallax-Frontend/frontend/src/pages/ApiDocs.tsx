import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { Code2, ArrowRight } from "lucide-react";

const endpoints = [
    {
        method: "POST",
        path: "/api/auth/login",
        desc: "Authenticate via OAuth provider and receive a JWT token.",
        methodColor: "text-[#4ADE80] bg-[#4ADE80]/10",
    },
    {
        method: "GET",
        path: "/api/projects",
        desc: "List all projects for the authenticated user.",
        methodColor: "text-[#D4AF37] bg-[#D4AF37]/10",
    },
    {
        method: "POST",
        path: "/api/projects",
        desc: "Create a new project with name, description, and language.",
        methodColor: "text-[#4ADE80] bg-[#4ADE80]/10",
    },
    {
        method: "GET",
        path: "/api/projects/:id/files",
        desc: "Fetch the file tree for a specific project.",
        methodColor: "text-[#D4AF37] bg-[#D4AF37]/10",
    },
    {
        method: "POST",
        path: "/api/execute",
        desc: "Submit code for sandboxed execution. Returns output and exit code.",
        methodColor: "text-[#4ADE80] bg-[#4ADE80]/10",
    },
    {
        method: "WS",
        path: "/ws/collaborate/:roomId",
        desc: "WebSocket endpoint for real-time collaboration in a room.",
        methodColor: "text-[#D4AF37] bg-[#D4AF37]/10",
    },
    {
        method: "POST",
        path: "/api/rooms",
        desc: "Create a new collaboration room with configurable settings.",
        methodColor: "text-[#4ADE80] bg-[#4ADE80]/10",
    },
    {
        method: "GET",
        path: "/api/rooms/:id",
        desc: "Get room details including participants and active status.",
        methodColor: "text-[#D4AF37] bg-[#D4AF37]/10",
    },
    {
        method: "PUT",
        path: "/api/user/profile",
        desc: "Update user profile information (display name, avatar, bio).",
        methodColor: "text-[#F59E0B] bg-[#F59E0B]/10",
    },
    {
        method: "DELETE",
        path: "/api/projects/:id",
        desc: "Delete a project and all associated files.",
        methodColor: "text-[#EF6461] bg-[#EF6461]/10",
    },
];

export default function ApiDocs() {
    return (
        <div className="min-h-screen bg-[#09090B] text-white relative overflow-hidden">
            <CosmicStars />
            <Header />

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm mb-4">
                            <Code2 className="w-4 h-4" />
                            API Reference
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            API{" "}
                            <span className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] bg-clip-text text-transparent">
                                Reference
                            </span>
                        </h1>
                        <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
                            Core endpoints for the Parallax platform. All requests require JWT authentication unless noted otherwise.
                        </p>
                    </motion.div>

                    {/* Base URL */}
                    <motion.div
                        className="mb-8 p-4 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="text-[#A1A1AA]">Base URL: </span>
                        <span className="text-[#D4AF37]">https://api.parallax.dev/v1</span>
                    </motion.div>

                    {/* Endpoints */}
                    <div className="space-y-3">
                        {endpoints.map((ep, index) => (
                            <motion.div
                                key={index}
                                className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors flex flex-col sm:flex-row sm:items-center gap-3"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.04, duration: 0.4 }}
                            >
                                <span className={`inline-flex items-center justify-center w-14 px-2 py-0.5 rounded text-xs font-bold ${ep.methodColor} shrink-0`}>
                                    {ep.method}
                                </span>
                                <code className="text-sm text-[#D4AF37] font-mono shrink-0">{ep.path}</code>
                                <span className="text-sm text-[#A1A1AA] sm:ml-auto">{ep.desc}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Note */}
                    <motion.div
                        className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/10 border border-[#D4AF37]/20 text-center space-y-3"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-[#CBD5E1]">
                            Full API documentation with request/response schemas is in progress.
                        </p>
                        <Link to="/docs" className="inline-flex items-center gap-1.5 text-[#D4AF37] text-sm hover:underline">
                            View general docs <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
