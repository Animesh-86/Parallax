import { Header } from "../components/Header";
import { HoverFocusText } from "../components/effects/HoverFocusText";
import { ScramblyText } from "../components/effects/ScramblyText";
import { WordRotator } from "../components/effects/WordRotator";
import { TextIlluminate } from "../components/effects/TextIlluminate";
import { ParticlesWaves } from "../components/effects/ParticlesWaves";
import { SuperPoweredSection } from "../components/SuperPoweredSection";
import { FeatureTabs } from "../components/FeatureTabs";
import { Footer } from "../components/Footer";
import { AstraCore } from "../components/AstraCore";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function LandingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Skip redirect if the user explicitly came from the dashboard
        if (location.state?.fromDashboard) {
            return;
        }

        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (decoded.exp > currentTime) {
                    navigate("/dashboard");
                } else {
                    localStorage.removeItem("access_token");
                }
            } catch (error) {
                localStorage.removeItem("access_token");
            }
        }
    }, [navigate, location]);

    return (
        <div className="relative bg-[#09090B] text-white min-h-screen selection:bg-[#D4AF37]/30 selection:text-[#FAFAFA]">
            {/* Material Texture: Grain */}
            <div className="grain-overlay" />

            <div className="relative z-10">
                <Header />

                {/* Hero Section */}
                <section className="h-screen relative w-full overflow-hidden flex flex-col items-center justify-center">

                    {/* Waves Effect - Stellar Nebula */}
                    <ParticlesWaves
                        className="absolute inset-0 z-20 pointer-events-none"
                        particleColor="#F8FAFC" // Diamond White Stars
                        lineColor="rgba(212, 175, 55, 0.15)" // Subtle Golden Nebula lines
                        amountX={120}
                        amountY={120}
                        separation={140}
                        cameraHeight={150}
                        cameraXdeg={0}
                        amplitude={55} // Increased frequency for "galactic" feel
                        speed={0.015} // Slightly slower, more majestic
                        mouseParallaxStrength={0.8}
                    />

                    {/* Content Container */}
                    <div className="relative z-30 flex flex-col items-center text-center px-4 max-w-6xl">
                        
                        {/* Welcome Text */}
                        <div className="mb-4">
                            <ScramblyText 
                                text="Welcome to"
                                fontSize={24}
                                fontWeight={300}
                                letterSpacing={0.5}
                                className="text-zinc-500 font-serif italic"
                            />
                        </div>

                        {/* Center Headline: Parallax */}
                        <div className="mb-10 w-full overflow-visible">
                            <TextIlluminate
                                text="PARALLAX"
                                theme="stellar"
                                fontSize="min(13vw, 10vw)"
                                textAlign="center"
                                fontFamily="var(--font-sans)"
                                fontWeight={700}
                                reveal={{
                                    trigger: "onView",
                                    direction: "center",
                                    stagger: 0.1,
                                    duration: 1.5
                                }}
                                glow={{
                                    enabled: true,
                                    intensity: 30
                                }}
                                className="tracking-[0.25em] uppercase leading-none whitespace-nowrap"
                            />
                        </div>

                        {/* Sub-headline: Rotating Words */}
                        <div className="mb-16">
                            <div className="flex flex-row items-baseline justify-center gap-3 md:gap-6 text-3xl md:text-7xl lg:text-8xl font-bold">
                                <WordRotator 
                                    words={["Build", "Ship", "Code", "Scale"]} 
                                    className="text-[#D4AF37]"
                                />
                                <span className="text-zinc-400 whitespace-nowrap opacity-90 font-serif italic">
                                    in orbit
                                </span>
                            </div>
                        </div>

                    </div>

                </section>

                {/* Super Powered Section */}
                <SuperPoweredSection />

                {/* Feature Tabs Section */}
                <FeatureTabs />

                {/* Final CTA Section */}
                <section className="relative w-full py-24 overflow-hidden border-t border-white/5 bg-[#09090B]">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            
                            {/* Left Text */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="text-left"
                            >
                                <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white">
                                    Ready to Launch Your Next <span className="text-[#D4AF37]">Project?</span>
                                </h2>
                                <p className="text-xl text-[#A1A1AA] mb-10 max-w-lg">
                                    Join Parallax today and experience the future of collaborative engineering.
                                </p>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black bg-[#D4AF37] rounded-xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)]"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Initialize Workspace
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                </button>
                            </motion.div>

                            {/* Right 3D Visual */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="relative h-[400px] md:h-[500px] flex items-center justify-center"
                            >
                                {/* Subtle background glow */}
                                <div className="absolute inset-0 bg-[#D4AF37]/5 blur-[100px] rounded-full" />
                                
                                {/* Scaled AstraCore to fit neatly */}
                                <div className="scale-[0.5] md:scale-[0.65] origin-center absolute flex items-center justify-center">
                                    <AstraCore />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <Footer />
            </div >
        </div >
    );
}
