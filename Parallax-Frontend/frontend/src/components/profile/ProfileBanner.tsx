import { useRef, useEffect, useMemo } from 'react';
import { cn } from "../../components/ui/utils";

interface ProfileBannerProps {
    username?: string;
    stats?: {
        projects: number;
        contributions: number;
        streak: number;
        roomsJoined: number;
    };
    className?: string;
}

// Deterministic RNG (Mulberry32)
function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// String to Hash Number
function cyrb128(str: string): number {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1 ^ h2 ^ h3 ^ h4) >>> 0;
}

interface Star {
    x: number;
    y: number;
    size: number;
    baseOpacity: number;
    twinkleSpeed: number;
    twinklePhase: number;
    isConstellationNode: boolean;
}

interface ConstellationLine {
    from: number; // index in stars array
    to: number;   // index in stars array
    opacity: number;
}

export function ProfileBanner({ username = "default", stats, className }: ProfileBannerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Derived Visual Parameters based on Stats
    const config = useMemo(() => {
        // Base seed from username
        const seed = cyrb128(username);
        const rng = mulberry32(seed);

        // Activity encoding
        // 1. Density: Logarithmic scale of projects (min 40, max 100)
        const projectCount = stats?.projects || 0;
        const starCount = Math.min(100, 40 + Math.log(projectCount + 1) * 15);

        // 2. Glow/Brightness: Contributions (max 1.0)
        // const contribIntensity = Math.min(1, (stats?.contributions || 0) / 500);

        // 3. Twinkle Speed: Streak
        // Higher streak = calmer, slower twinkle? Or more active? User said "calm".
        // Let's make streak stabilize the stars (less erratic).
        const streakStability = Math.min(0.8, (stats?.streak || 0) / 100);

        return { seed, rng, starCount, streakStability };
    }, [username, stats]); // Re-run if data changes

    // Generate Static Data (Stars & Lines)
    const { stars, lines } = useMemo(() => {
        const { rng, starCount } = config;
        const generatedStars: Star[] = [];
        const generatedLines: ConstellationLine[] = [];

        // Generate Stars
        for (let i = 0; i < starCount; i++) {
            const isConstellationNode = i < 12; // First 12 stars are potential constellation nodes
            generatedStars.push({
                x: rng(), // 0-1 normalized position
                y: rng(), // 0-1 normalized position
                size: rng() * 1.5 + (isConstellationNode ? 1.5 : 0.5),
                baseOpacity: rng() * 0.5 + 0.1,
                twinkleSpeed: rng() * 0.002 + 0.0005,
                twinklePhase: rng() * Math.PI * 2,
                isConstellationNode
            });
        }

        // Generate Constellation Lines (deterministic connections)
        // Connect the first few stars to form a shape
        const nodes = generatedStars.filter(s => s.isConstellationNode);
        // sort nodes by x to make cleaner lines
        nodes.sort((a, b) => a.x - b.x);

        // Simple strategy: Connect to nearest neighbor that has higher index
        // Or just a chain for simplicity and aesthetic "constellation" look
        for (let i = 0; i < nodes.length - 1; i++) {
            // Determine if we should connect (70% chance)
            if (rng() > 0.3) {
                // Find original indices
                const fromIndex = generatedStars.indexOf(nodes[i]);
                const toIndex = generatedStars.indexOf(nodes[i + 1]);

                // Add secondary connection sometimes
                generatedLines.push({ from: fromIndex, to: toIndex, opacity: 0.2 });
            }
        }

        // Add a few cross connections for complexity
        for (let i = 0; i < 3; i++) {
            const idx1 = Math.floor(rng() * nodes.length);
            const idx2 = Math.floor(rng() * nodes.length);
            if (idx1 !== idx2) {
                const fromIndex = generatedStars.indexOf(nodes[idx1]);
                const toIndex = generatedStars.indexOf(nodes[idx2]);
                generatedLines.push({ from: fromIndex, to: toIndex, opacity: 0.15 });
            }
        }

        return { stars: generatedStars, lines: generatedLines };
    }, [config]);

    // Canvas Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            const rect = container.getBoundingClientRect();
            // Handle high DPI displays
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
        };

        const render = () => {
            if (!ctx || !container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;

            // Clear but keep gradient background visible (canvas is transparent)
            ctx.clearRect(0, 0, width, height);

            // Draw Lines
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; // Purple-ish
            ctx.lineWidth = 1;

            ctx.beginPath();
            lines.forEach(line => {
                const s1 = stars[line.from];
                const s2 = stars[line.to];

                // Subtle breathing for lines
                const breathing = Math.sin(time * 0.001) * 0.05 + 1;

                ctx.moveTo(s1.x * width, s1.y * height);
                ctx.lineTo(s2.x * width, s2.y * height);
            });
            ctx.stroke();

            // Draw Stars
            stars.forEach(star => {
                // Twinkle Logic
                const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
                // Map [-1, 1] to opacity range
                const opacity = star.baseOpacity + (twinkle * 0.2);

                // Color: Cyan/White mix
                // Constellation nodes are slightly more cyan/purple
                const fillStyle = star.isConstellationNode
                    ? `rgba(220, 230, 255, ${opacity * 1.5})`
                    : `rgba(255, 255, 255, ${opacity})`;

                ctx.fillStyle = fillStyle;
                ctx.beginPath();
                ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            time += 16; // approx 60fps ms increment
            animationFrameId = requestAnimationFrame(render);
        };

        // Init
        resize();
        window.addEventListener('resize', resize);
        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [stars, lines]);

    return (
        <div
            ref={containerRef}
            className={cn("h-40 bg-[#060910] relative overflow-hidden", className)}
        >
            {/* Background Gradient Layer - Static & performant */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C1220] via-[#060910] to-[#0C1220]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0C1220]/20 via-transparent to-transparent opacity-50" />

            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block w-full h-full"
            />

            {/* Vignette/Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        </div>
    );
}


