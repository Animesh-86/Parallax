import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FluidFlowBackground } from "../components/effects/FluidFlowBackground";
import { Check, Sparkles, Zap, Rocket, Building, Star } from "lucide-react";

const plans = [
    {
        name: "Stardust",
        icon: Star,
        tagline: "Perfect for Getting Started",
        price: "Coming Soon",
        priceDetail: "Forever",
        gradient: "from-[#2DD4BF] to-[#64748B]",
        glowColor: "rgba(45, 212, 191, 0.3)",
        popular: false,
        features: [
            "1 active project",
            "Basic real-time collaboration",
            "2 collaborators max",
            "Basic voice chat",
            "Limited code sandbox",
            "Community workspace",
            "Standard compute resources",
            "Public room hosting",
            "Community support",
        ],
    },
    {
        name: "Nova",
        icon: Sparkles,
        tagline: "Students & Hackathons",
        price: "Coming Soon",
        priceDetail: "Event or Student Access",
        gradient: "from-[#7DD3FC] to-[#F472B6]",
        glowColor: "rgba(56, 189, 248, 0.3)",
        popular: true,
        features: [
            "Up to 10 collaborators",
            "Fast compute resources",
            "Multi-file workspace",
            "Temporary team rooms",
            "Event storage allocation",
            "'Hack Mode' theme",
            "Extended session duration",
            "Event-specific tools",
            "Student verification system",
        ],
    },
    {
        name: "Supernova",
        icon: Zap,
        tagline: "For Professional Developers",
        price: "Coming Soon",
        priceDetail: "",
        gradient: "from-[#F59E0B] via-[#F472B6] to-[#38BDF8]",
        glowColor: "rgba(249, 115, 22, 0.3)",
        popular: false,
        features: [
            "Unlimited projects",
            "Unlimited collaborators",
            "Private coding rooms",
            "Fast compute & execution",
            "Full AI assistance",
            "Complete version history",
            "Advanced voice + screen sync",
            "Custom themes",
            "Personal cloud storage",
        ],
    },
    {
        name: "Galaxy",
        icon: Rocket,
        tagline: "Team Collaboration",
        price: "Coming Soon",
        priceDetail: "",
        gradient: "from-[#4ADE80] via-[#94A3B8] to-[#64748B]",
        glowColor: "rgba(16, 185, 129, 0.3)",
        popular: false,
        features: [
            "Team workspace dashboard",
            "Multiple team rooms",
            "Role-based access control",
            "Shared AI resource pool",
            "Faster compute tier",
            "Team file sharing",
            "Team version history",
            "Project voice channels",
            "Usage analytics",
        ],
    },
    {
        name: "Astra Core",
        icon: Building,
        tagline: "Enterprise Solution",
        price: "Coming Soon",
        priceDetail: "Contact Sales",
        gradient: "from-[#7DD3FC] via-[#38BDF8] to-[#F472B6]",
        glowColor: "rgba(99, 102, 241, 0.3)",
        popular: false,
        features: [
            "Organization workspace",
            "SSO & SAML integration",
            "Custom compute allocation",
            "Dedicated cloud nodes",
            "Unlimited rooms & projects",
            "Comprehensive audit logs",
            "End-to-end encryption",
            "Custom branding",
            "Priority 24/7 support",
        ],
    },
];

export default function Pricing() {
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

            {/* Dark Overlay (Same as About.tsx) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden bg-[#060910]/80 backdrop-blur-3xl">
                <div className="absolute top-20 left-10 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#94A3B8]/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10">
                <Header />

                {/* Structural Spacer to force content down below fixed header */}
                <div style={{ height: '12vh', minHeight: '100px' }} />

                <main className="container mx-auto px-6 pb-20">
                    <div className="text-center mb-16 space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold"
                        >
                            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7DD3FC] to-[#2DD4BF]">Universe</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-[#94A3B8] text-lg max-w-2xl mx-auto"
                        >
                            From solo developers to enterprise teams, find the perfect plan to power your collaborative coding journey.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {plans.map((plan, index) => (
                            <PricingCard key={index} plan={plan} index={index} />
                        ))}
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

function PricingCard({ plan, index }: { plan: typeof plans[0], index: number }) {
    const isPopular = plan.popular;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-6 rounded-2xl border backdrop-blur-sm bg-white/5 flex flex-col h-full group ${isPopular ? 'border-[#38BDF8]/50 shadow-[0_0_30px_rgba(56, 189, 248,0.15)]' : 'border-white/10 hover:border-white/20'
                }`}
        >
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#38BDF8] to-[#F472B6] text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                </div>
            )}

            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} bg-opacity-20 flex items-center justify-center mb-4`}>
                <plan.icon className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className="text-sm text-[#94A3B8] mb-4 h-10">{plan.tagline}</p>

            <div className="mb-6">
                <div className="text-3xl font-bold">{plan.price}</div>
                <div className="text-xs text-[#64748B]">{plan.priceDetail}</div>
            </div>

            <div className="space-y-3 flex-grow mb-6">
                {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                        <Check className={`w-4 h-4 mt-0.5 text-[#2DD4BF] shrink-0`} />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <button className={`w-full py-2.5 rounded-lg font-medium transition-all ${isPopular
                ? 'bg-gradient-to-r from-[#38BDF8] to-[#F472B6] text-white hover:opacity-90'
                : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                Get Started
            </button>
        </motion.div>
    );
}
