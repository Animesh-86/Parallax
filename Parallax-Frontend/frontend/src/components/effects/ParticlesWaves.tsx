
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

interface ParticlesWavesProps {
    width?: number;
    height?: number;
    amountX?: number;
    amountY?: number;
    separation?: number;
    gap?: number;
    amplitude?: number;
    freq?: number;
    speed?: number;
    sideMotion?: number;
    mouseParallaxStrength?: number; // New prop for mouse parallax
    particleColor?: string;
    pointSize?: number;
    dprLimit?: number;
    cameraFov?: number;
    cameraHeight?: number;
    cameraXdeg?: number;
    showLines?: boolean;
    lineColor?: string;
    showTrails?: boolean;
    trailCount?: number;
    trailLength?: number;
    trailThickness?: number;
    trailSpeed?: number;
    trailDirection?: "left-right" | "right-left";
    trailColorStart?: string;
    trailColorEnd?: string;
    glowSize?: number;
    fillMode?: "none" | "solid" | "gradient";
    fillColor?: string;
    gradientType?: "linear" | "radial";
    gradientAngle?: number;
    gradientColorA?: string;
    gradientColorB?: string;
    stopMotionInEditor?: boolean;
    className?: string;
}

const MAX_PIXELS = 5e6;

export const ParticlesWaves: React.FC<ParticlesWavesProps> = ({
    width,
    height,
    dprLimit = 2,
    amountX = 60,
    amountY = 60,
    separation = 100, // Reduced from 120 for tighter grid
    gap = 0,
    amplitude = 40,
    freq = 1,
    speed = 0.01,
    sideMotion = 0,
    mouseParallaxStrength = 0.5,
    particleColor = "#FFFFFF",
    pointSize = 4,
    cameraFov = 55,
    cameraHeight = 600,
    cameraXdeg = 0,
    showLines = true,
    lineColor = "rgba(255,255,255,0.2)",
    showTrails = false,
    trailCount = 12,
    trailLength = 0.3,
    trailThickness = 3,
    trailSpeed = 0.1,
    trailDirection = "left-right",
    trailColorStart = "#2DD4BF",
    trailColorEnd = "rgba(0,0,255,0)",
    glowSize = 24,
    fillMode = "none",
    fillColor = "rgba(0,0,0,0.2)",
    gradientType = "linear",
    gradientAngle = 45,
    gradientColorA = "rgba(0,0,0,0.0)",
    gradientColorB = "rgba(0,0,0,0.6)",
    stopMotionInEditor = true,
    className
}) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const state = useRef<{ raf: number; cleanup: () => void }>({ raf: 0, cleanup: () => { } });
    const trailsRef = useRef<any[]>([]);
    const mouse = useRef({ x: 0, y: 0 });
    const targetMouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;

        let disposed = false;
        cancelAnimationFrame(state.current.raf);
        el.textContent = "";

        const spacingRaw = separation + gap;
        const spacing = Math.sign(spacingRaw || 1) * Math.max(0.01, Math.abs(spacingRaw));

        // ---------- Renderer ----------
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false
        });
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.setClearColor(0, 0);
        renderer.domElement.style.backgroundColor = "transparent";
        renderer.toneMapping = THREE.NoToneMapping;
        el.appendChild(renderer.domElement);

        const onLost = (e: Event) => e.preventDefault();
        const onRestored = () => {
            setSize();
            writeAndRender(0);
        };
        renderer.domElement.addEventListener("webglcontextlost", onLost, false);
        renderer.domElement.addEventListener("webglcontextrestored", onRestored, false);

        // ---------- Scene / Camera ----------
        const scene = new THREE.Scene();
        const separationBase = Math.max(20, separation);
        const camera = new THREE.PerspectiveCamera(cameraFov, 1, 0.1, 1e5);
        const baseDist = separationBase * 12;
        camera.position.set(0, cameraHeight, baseDist);

        const applyCameraYaw = () => {
            const yaw = (cameraXdeg * Math.PI) / 180;
            // Apply mouse parallax to camera position
            const moveX = mouse.current.x * (separationBase * 20) * mouseParallaxStrength;
            const moveY = mouse.current.y * (separationBase * 10) * mouseParallaxStrength;
            
            camera.position.x = Math.sin(yaw) * baseDist + moveX;
            camera.position.y = cameraHeight + moveY;
            camera.position.z = Math.cos(yaw) * baseDist;
            camera.lookAt(0, 0, 0);
        };
        applyCameraYaw();

        // ---------- Helpers ----------
        const parseRGBA = (c: string) => {
            const m = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)$/i.exec(c || "");
            if (m)
                return {
                    r: +m[1] / 255,
                    g: +m[2] / 255,
                    b: +m[3] / 255,
                    a: m[4] ? Math.min(1, Math.max(0, +m[4])) : 1
                };
            const t = new THREE.Color(c || "#fff");
            return { r: t.r, g: t.g, b: t.b, a: 1 };
        };

        const solidDisc = (() => {
            const s = 64; // Reduced size for performance
            const c = document.createElement("canvas");
            c.width = c.height = s;
            const ctx = c.getContext("2d");
            if (!ctx) return new THREE.Texture();
            const r = s / 2;
            const g = ctx.createRadialGradient(r, r, 0, r, r, r);
            g.addColorStop(0, "rgba(255,255,255,1)");
            g.addColorStop(0.88, "rgba(255,255,255,1)");
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, s, s);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.NoColorSpace;
            return t;
        })();

        // ---------- Grid ----------
        const count = amountX * amountY;
        const positions = new Float32Array(count * 3);
        const halfX = (amountX - 1) * spacing * 0.5;
        const halfY = (amountY - 1) * spacing * 0.5;
        const baseX = new Float32Array(amountX);
        const baseZ = new Float32Array(amountY);

        for (let ix = 0; ix < amountX; ix++) baseX[ix] = ix * spacing - halfX;
        for (let iy = 0; iy < amountY; iy++) baseZ[iy] = iy * spacing - halfY;

        let i = 0;
        for (let ix = 0; ix < amountX; ix++) {
            for (let iy = 0; iy < amountY; iy++) {
                positions[i * 3 + 0] = baseX[ix];
                positions[i * 3 + 1] = 0; // y
                positions[i * 3 + 2] = baseZ[iy];
                i++;
            }
        }

        // ---------- Points ----------
        const pCol = parseRGBA(particleColor);
        const coreGeom = new THREE.BufferGeometry();
        const posAttr = new THREE.BufferAttribute(positions, 3);
        posAttr.setUsage(THREE.DynamicDrawUsage);
        coreGeom.setAttribute("position", posAttr);

        const coreMat = new THREE.PointsMaterial({
            color: new THREE.Color(pCol.r, pCol.g, pCol.b),
            opacity: pCol.a,
            transparent: true,
            alphaMap: solidDisc,
            size: pointSize,
            sizeAttenuation: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending,
            toneMapped: false
        });

        const pointsCore = new THREE.Points(coreGeom, coreMat);
        pointsCore.renderOrder = 2;
        scene.add(pointsCore);

        // ---------- Static Lines ----------
        let line2: Line2 | null = null;
        let lineGeom: LineSegmentsGeometry | null = null;
        let lineFlat: Float32Array | null = null;
        let linePairs: Int32Array | null = null;

        const buildLinePairs = () => {
            const segCount = amountX * (amountY - 1) + amountY * (amountX - 1);
            linePairs = new Int32Array(segCount * 2);
            let ptr = 0;
            // Rows
            for (let ix = 0; ix < amountX - 1; ix++) {
                for (let iy = 0; iy < amountY; iy++) {
                    const a = ix * amountY + iy;
                    const b = (ix + 1) * amountY + iy;
                    linePairs[ptr++] = a;
                    linePairs[ptr++] = b;
                }
            }
            // Cols
            for (let ix = 0; ix < amountX; ix++) {
                for (let iy = 0; iy < amountY - 1; iy++) {
                    const a = ix * amountY + iy;
                    const b = ix * amountY + (iy + 1);
                    linePairs[ptr++] = a;
                    linePairs[ptr++] = b;
                }
            }
            lineFlat = new Float32Array(segCount * 6);
        };

        const fillLineFlatFromPositions = (src: Float32Array | ArrayLike<number>, out: Float32Array) => {
            if (!linePairs) return;
            let p = 0;
            for (let i = 0; i < linePairs.length; i += 2) {
                const ai = linePairs[i] * 3;
                const bi = linePairs[i + 1] * 3;
                out[p++] = src[ai];
                out[p++] = src[ai + 1];
                out[p++] = src[ai + 2];
                out[p++] = src[bi];
                out[p++] = src[bi + 1];
                out[p++] = src[bi + 2];
            }
        };

        if (showLines) {
            buildLinePairs();
            lineGeom = new LineSegmentsGeometry();
            if (lineFlat && linePairs) {
                fillLineFlatFromPositions(coreGeom.getAttribute("position").array, lineFlat);
                lineGeom.setPositions(lineFlat);
            }
            const lc = parseRGBA(lineColor);
            const lineMat = new LineMaterial({
                color: new THREE.Color(lc.r, lc.g, lc.b).getHex(),
                opacity: lc.a,
                transparent: true,
                linewidth: 1, // Adjusted for LineMaterial quirks
                depthTest: false,
                depthWrite: false,
                dashed: false,
                toneMapped: false
            });
            lineMat.resolution.set(el.clientWidth, el.clientHeight);
            line2 = new Line2(lineGeom as any, lineMat);
            line2.renderOrder = 10;
            scene.add(line2);
        }

        // ---------- Animation ----------
        const clock = new THREE.Clock();
        const sinX = new Float32Array(amountX);
        const sinY = new Float32Array(amountY);
        const sX = new Float32Array(amountX);
        const sZ = new Float32Array(amountY);
        const ampJitterX = new Float32Array(amountX);
        const ampJitterY = new Float32Array(amountY);

        const freqValue = typeof freq === "number" && !isNaN(freq) ? freq : 1;
        const freqFactor = Math.max(0, freqValue);
        const jitterStrength = Math.max(0, Math.min(freqFactor * 0.4, 1));
        const phaseX = Math.random() * Math.PI * 2;
        const phaseY = Math.random() * Math.PI * 2;

        for (let ix = 0; ix < amountX; ix++) {
            const n = Math.sin(ix * 0.18 * freqFactor + phaseX);
            ampJitterX[ix] = 1 + n * jitterStrength;
        }
        for (let iy = 0; iy < amountY; iy++) {
            const n = Math.sin(iy * 0.22 * freqFactor + phaseY);
            ampJitterY[iy] = 1 + n * jitterStrength;
        }

        const setSize = () => {
            const w = Math.max(1, el.clientWidth || width || 800);
            const h = Math.max(1, el.clientHeight || height || 500);
            const pr = Math.min(dprLimit, window.devicePixelRatio || 1);

            renderer.setPixelRatio(pr);
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();

            if (line2 && line2.material) {
                line2.material.resolution.set(w, h);
            }
        };

        const writeAndRender = (phase: number) => {
            const baseWx = 0.3;
            const baseWy = 0.5;
            const baseSx = 0.2;
            const baseSz = 0.25;
            const wx = baseWx * freqFactor;
            const wy = baseWy * freqFactor;
            const sx = baseSx * freqFactor;
            const sz = baseSz * freqFactor;

            for (let ix = 0; ix < amountX; ix++) {
                // Wave travels across X
                sinX[ix] = Math.sin(ix * wx + phase);
                sX[ix] = sideMotion !== 0 ? Math.sin(ix * sx + phase) : 0;
            }
            for (let iy = 0; iy < amountY; iy++) {
                // Wave also varies across Y
                sinY[iy] = Math.sin(iy * wy + phase);
                sZ[iy] = sideMotion !== 0 ? Math.cos(iy * sz + phase) : 0;
            }

            let k = 0;
            const arr = coreGeom.getAttribute("position").array as Float32Array;

            for (let ix = 0; ix < amountX; ix++) {
                const ampX = amplitude * ampJitterX[ix];
                const yX = sinX[ix] * ampX;
                const sideXv = sX[ix] * sideMotion;
                const baseXi = baseX[ix];

                for (let iy = 0; iy < amountY; iy++) {
                    const ampY = amplitude * ampJitterY[iy];
                    const y = yX + sinY[iy] * ampY;
                    const x = baseXi + sideXv;
                    const z = baseZ[iy] + sZ[iy] * sideMotion;

                    const i3 = k * 3;
                    arr[i3 + 0] = x;
                    arr[i3 + 1] = y;
                    arr[i3 + 2] = z;
                    k++;
                }
            }

            coreGeom.getAttribute("position").needsUpdate = true;
            applyCameraYaw();

            if (line2 && lineGeom && lineFlat && linePairs) {
                fillLineFlatFromPositions(arr, lineFlat);
                lineGeom.setPositions(lineFlat);
            }

            renderer.render(scene, camera);
        };

        let lastMs = performance.now();
        const targetMs = 1000 / 60;

        const onMouseMove = (event: MouseEvent) => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            targetMouse.current.x = (event.clientX / w) * 2 - 1;
            targetMouse.current.y = -(event.clientY / h) * 2 + 1;
        };

        window.addEventListener("mousemove", onMouseMove);

        const tick = () => {
            if (disposed) return;
            state.current.raf = requestAnimationFrame(tick);
            
            // Smooth mouse movement
            mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.05;
            mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.05;

            const now = performance.now();
            if (now - lastMs < targetMs) return;
            lastMs = now;
            const phase = clock.getElapsedTime() * (speed * 60);
            writeAndRender(phase);
        };

        const onResize = () => {
            setSize();
            writeAndRender(0);
        };

        const ro = new ResizeObserver(onResize);
        ro.observe(el);
        window.addEventListener("resize", onResize);
        setSize();
        tick();

        state.current.cleanup = () => {
            disposed = true;
            cancelAnimationFrame(state.current.raf);
            ro.disconnect();
            window.removeEventListener("resize", onResize);
            window.removeEventListener("mousemove", onMouseMove);

            scene.clear();
            coreGeom.dispose();
            solidDisc.dispose();
            coreMat.dispose();
            if (line2 && lineGeom) {
                lineGeom.dispose();
                line2.material.dispose();
            }
            renderer.dispose();
        };

        return state.current.cleanup;
    }, [
        width, height, dprLimit, amountX, amountY, separation, gap,
        amplitude, freq, speed, sideMotion, particleColor, pointSize,
        cameraFov, cameraHeight, cameraXdeg, showLines, lineColor,
        showTrails, trailCount, trailLength, trailThickness, trailSpeed,
        trailDirection, trailColorStart, trailColorEnd, glowSize, fillMode,
        fillColor, gradientType, gradientAngle, gradientColorA, gradientColorB,
        stopMotionInEditor
    ]);

    return (
        <div
            ref={rootRef}
            className={className}
            style={{
                width: "100%",
                height: "100%",
                position: "absolute", // Enforce absolute positioning
                top: 0,
                left: 0,
                pointerEvents: "none", // Allow clicks to pass through
                overflow: "hidden"
            }}
        />
    );
};
