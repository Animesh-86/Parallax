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

                {/* Footer */}
                <Footer />
            </div >
        </div >
    );
}
