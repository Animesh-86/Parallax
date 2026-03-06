import React, { useEffect, useRef, useCallback } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    friction: number;
    ease: number;
}

interface BlackHoleParticlesProps {
    className?: string;
}

export const BlackHoleParticles: React.FC<BlackHoleParticlesProps> = ({ className = "" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const animationFrameRef = useRef<number>();
    const particlesRef = useRef<Particle[]>([]);

    // Mouse state tracks the cursor position relative to the viewport
    const mouseRef = useRef({ x: 0, y: 0, isActive: false });

    // Configuration constants
    const PARTICLE_COUNT = 150;
    const ATTRACTION_RADIUS = 300; // Range of black hole pull
    const ATTRACTION_STRENGTH = 0.05; // How fast they accelerate towards cursor
    const MAX_VELOCITY = 8;
    const BASE_FRICTION = 0.95;

    const colors = ["#2DD4BF", "#7DD3FC", "#F472B6", "#ffffff"]; // Cyan, Purple, Pink, White

    const initParticles = useCallback((width: number, height: number) => {
        const particles: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                size: Math.random() * 2 + 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                friction: BASE_FRICTION + Math.random() * 0.02,
                ease: Math.random() * 0.1 + 0.05
            });
        }
        particlesRef.current = particles;
    }, []);

    const updateParticles = useCallback((width: number, height: number, mouseX: number, mouseY: number) => {
        particlesRef.current.forEach(p => {
            // Attraction physics
            if (mouseRef.current.isActive) {
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < ATTRACTION_RADIUS && distance > 5) {
                    const force = (ATTRACTION_RADIUS - distance) / ATTRACTION_RADIUS;
                    const angle = Math.atan2(dy, dx);

                    // Pull towards mouse (Black hole gravity)
                    p.vx += Math.cos(angle) * force * ATTRACTION_STRENGTH * 10;
                    p.vy += Math.sin(angle) * force * ATTRACTION_STRENGTH * 10;
                }
            }

            // Apply velocity limit
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > MAX_VELOCITY) {
                p.vx = (p.vx / speed) * MAX_VELOCITY;
                p.vy = (p.vy / speed) * MAX_VELOCITY;
            }

            // Normal movement
            p.x += p.vx;
            p.y += p.vy;

            // Apply friction
            p.vx *= p.friction;
            p.vy *= p.friction;

            // Wrap around screen edges (Teleportation)
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
        });
    }, []);

    const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        particlesRef.current.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.6; // Slight transparency
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        updateParticles(canvas.width, canvas.height, mouseRef.current.x, mouseRef.current.y);
        drawParticles(ctx);

        animationFrameRef.current = requestAnimationFrame(render);
    }, [updateParticles, drawParticles]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        contextRef.current = ctx;

        // Resize handler
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles(canvas.width, canvas.height);
        };

        // Window Mouse Handlers
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            // Since canvas is fixed/absolute, client coordinates match canvas coordinates usually
            // But we calculate relative to canvas just in case
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
            mouseRef.current.isActive = true;
        };

        const handleMouseLeave = () => {
            mouseRef.current.isActive = false;
        };

        handleResize(); // Initial setup

        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);

        render();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [initParticles, render]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 z-0 pointer-events-none ${className}`}
            style={{ width: "100%", height: "100vh" }}
        />
    );
};
