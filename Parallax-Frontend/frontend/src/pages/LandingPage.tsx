import { Header } from "../components/Header";
import { HoverFocusText } from "../components/effects/HoverFocusText";
import { WordRotator } from "../components/effects/WordRotator";
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
        <div className="relative bg-[#060910] text-white min-h-screen selection:bg-[#38BDF8]/30 selection:text-[#2DD4BF]">

            <div className="relative z-10">
                <Header />

                {/* Hero Section */}
                <section className="h-screen relative w-full overflow-hidden">

                    {/* Waves Effect - Behind text (z-20) but above background */}
                    <ParticlesWaves
                        className="absolute inset-0 z-20 pointer-events-none"
                        particleColor="#7DD3FC" // Purple
                        amountX={100}
                        amountY={100}
                        speed={0.03}
                        amplitude={30}
                    />

                    {/* Top Left: Welcome to */}
                    <div className="absolute top-[30%] left-[5%] md:left-[15%] z-30 pointer-events-none w-max">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="transform rotate-0"
                        >
                            <span className="text-4xl md:text-6xl font-thin text-[#CBD5E1] tracking-widest font-sans opacity-80 whitespace-nowrap block">
                                Welcome to
                            </span>
                        </motion.div>
                    </div>


                    {/* Center: Parallax */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center z-40">
                        <HoverFocusText
                            text="Parallax"
                            fontClassName="text-[18vw] font-bold tracking-tighter leading-none"
                        />
                    </div>

                    {/* Bottom Center: Sub-headline */}
                    <div className="absolute top-[62%] w-full flex justify-center z-30 pointer-events-none">
                        <div className="flex items-center gap-3 md:gap-4 text-4xl md:text-7xl lg:text-8xl font-medium text-[#2DD4BF]/80">
                            <div className="text-right text-[#7DD3FC] font-bold min-w-[200px] flex justify-end pt-3 md:pt-4">
                                <WordRotator words={["Build", "Ship", "Code", "Scale"]} />
                            </div>
                            <span className="whitespace-nowrap text-left">
                                in orbit
                            </span>
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
