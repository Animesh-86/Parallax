import React, { useEffect, useRef, useCallback } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    baseOpacity: number;
    opacity: number;
    mass: number;
}

interface GravityParticlesProps {
    className?: string;
}

export const GravityParticles: React.FC<GravityParticlesProps> = ({ className = "" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const particlesRef = useRef<Particle[]>([]);

    // Configuration
    const particleCount = 100;
    const particleSize = 2; // Base size
    const particleColor = "#ffffff"; // White particles
    const mouseInfluence = 150; // Radius of influence
    const gravityStrength = 20; // Strength of attraction

    const initParticles = useCallback((width: number, height: number) => {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * particleSize + 1,
            baseOpacity: Math.random() * 0.5 + 0.1,
            opacity: 0,
            mass: Math.random() * 0.5 + 0.5,
        }));
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Update and draw particles
        const mouse = mouseRef.current;

        particlesRef.current.forEach((p) => {
            // Calculate physics
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouseInfluence) {
                const force = (mouseInfluence - distance) / mouseInfluence;
                const normDx = dx / distance;
                const normDy = dy / distance;
                const grab = force * gravityStrength * 0.05; // Pull factor

                p.vx += normDx * grab;
                p.vy += normDy * grab;
                p.opacity = Math.min(1, p.baseOpacity + force * 0.8);
            } else {
                // Friction/return to normal
                p.opacity = Math.min(1, Math.max(p.baseOpacity, p.opacity - 0.01));
            }

            // Apply velocity
            p.x += p.vx;
            p.y += p.vy;

            // Friction
            p.vx *= 0.96;
            p.vy *= 0.96;

            // Bounce off walls
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Keep within bounds strongly if wandering
            if (p.x < -50) p.x = width;
            if (p.x > width + 50) p.x = 0;
            if (p.y < -50) p.y = height;
            if (p.y > height + 50) p.y = 0;

            // Draw
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = canvas.width;
        let height = canvas.height;

        const handleResize = () => {
            if (!canvas) return;
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                width = canvas.width;
                height = canvas.height;
                initParticles(width, height);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        }

        window.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        const animate = () => {
            draw(ctx, width, height);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [initParticles, draw]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-0 pointer-events-none ${className}`}
            style={{ width: "100%", height: "100%" }}
        />
    );
};
