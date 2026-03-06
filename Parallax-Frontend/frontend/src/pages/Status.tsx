import { motion } from "motion/react";
import { Link } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CosmicStars } from "../components/workspace/CosmicStars";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

const services = [
    { name: "Web Application", status: "operational", uptime: "99.8%" },
    { name: "Collaboration Engine (WebSockets)", status: "operational", uptime: "99.5%" },
    { name: "Code Execution Service", status: "operational", uptime: "99.2%" },
    { name: "Authentication (OAuth)", status: "operational", uptime: "99.9%" },
    { name: "Database (PostgreSQL)", status: "operational", uptime: "99.7%" },
    { name: "Voice & Video (WebRTC)", status: "operational", uptime: "99.3%" },
];

const statusConfig = {
    operational: { icon: CheckCircle, color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10", label: "Operational" },
    degraded: { icon: AlertCircle, color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10", label: "Degraded" },
    outage: { icon: AlertCircle, color: "text-[#EF6461]", bg: "bg-[#EF6461]/10", label: "Outage" },
    maintenance: { icon: Clock, color: "text-[#38BDF8]", bg: "bg-[#38BDF8]/10", label: "Maintenance" },
};

export default function Status() {
    return (
        <div className="min-h-screen bg-[#060910] text-white relative overflow-hidden">
            <CosmicStars />
            <Header />

            <main className="relative z-10 pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            System{" "}
                            <span className="bg-gradient-to-r from-[#4ADE80] to-[#2DD4BF] bg-clip-text text-transparent">
                                Status
                            </span>
                        </h1>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20">
                            <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                            <span className="text-sm text-[#4ADE80] font-medium">All Systems Operational</span>
                        </div>
                    </motion.div>

                    {/* Service List */}
                    <div className="space-y-2 mb-12">
                        {services.map((service, index) => {
                            const config = statusConfig[service.status as keyof typeof statusConfig];
                            const StatusIcon = config.icon;

                            return (
                                <motion.div
                                    key={index}
                                    className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between"
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                                        <span className="text-sm text-white">{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-[#94A3B8]">{service.uptime} uptime</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                                            {config.label}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Note */}
                    <motion.div
                        className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-sm text-[#CBD5E1]">
                            Experiencing issues? Report them on the{" "}
                            <Link to="/support" className="text-[#38BDF8] hover:underline">support page</Link>.
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                            Status is manually updated during active development. Automated monitoring coming soon.
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
