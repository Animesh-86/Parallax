import React, { useState, useEffect, useMemo, useRef } from "react";

const scrambleChars = "!<>-_\\/[]{}—=+*^?#________";

interface ScramblyTextProps {
    text: string | string[];
    fontSize?: number;
    fontWeight?: number | string;
    letterSpacing?: number;
    lineHeight?: number;
    scrambleDuration?: number;
    lineDelay?: number;
    className?: string;
}

export const ScramblyText: React.FC<ScramblyTextProps> = ({
    text = "Scrambly text.",
    fontSize = 32,
    fontWeight = 700,
    letterSpacing = -0.02,
    lineHeight = 1.2,
    scrambleDuration = 0.5,
    lineDelay = 1.5,
    className = "",
}) => {
    const lines = useMemo(() => {
        if (Array.isArray(text)) return text;
        return text.split("\n");
    }, [text]);

    const [displayHTML, setDisplayHTML] = useState("");
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isMeasuring, setIsMeasuring] = useState(true);
    const [charWidths, setCharWidths] = useState<number[][] | null>(null);

    // Measure character widths to prevent layout shift during scramble
    useEffect(() => {
        const measureContainer = document.createElement("div");
        measureContainer.style.position = "absolute";
        measureContainer.style.visibility = "hidden";
        measureContainer.style.whiteSpace = "pre";
        measureContainer.style.fontSize = fontSize + "px";
        measureContainer.style.fontWeight = String(fontWeight);
        measureContainer.style.letterSpacing = letterSpacing + "em";
        measureContainer.style.lineHeight = String(lineHeight);
        measureContainer.style.padding = "0";
        measureContainer.style.margin = "0";
        document.body.appendChild(measureContainer);

        const measuredLines: number[][] = [];
        lines.forEach((line) => {
            const widths: number[] = [];
            for (let i = 0; i < line.length; i++) {
                measureContainer.textContent = line[i] === " " ? "\xa0" : line[i];
                widths.push(measureContainer.getBoundingClientRect().width || 0.1);
            }
            measuredLines.push(widths);
        });

        document.body.removeChild(measureContainer);
        setCharWidths(measuredLines);
        setIsMeasuring(false);
    }, [lines, fontSize, fontWeight, letterSpacing, lineHeight]);

    useEffect(() => {
        if (isMeasuring || !charWidths) return;

        let cancelled = false;
        let requestId: number | null = null;
        let timeoutId: number | null = null;

        const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

        const scrambleLine = (index: number) => {
            return new Promise((resolve) => {
                const line = lines[index];
                const widths = charWidths[index];
                const queue: any[] = [];
                const durationFactor = scrambleDuration;
                const baseFrames = 50 * durationFactor;
                const staggerFrames = 6 * durationFactor;
                const centerIndex = (line.length - 1) / 2;

                for (let i = 0; i < line.length; i++) {
                    const distanceFromCenter = Math.abs(i - centerIndex);
                    const start = Math.round(distanceFromCenter * staggerFrames);
                    const end = start + baseFrames + Math.floor(Math.random() * baseFrames);
                    queue.push({ to: line[i], start, end, index: i });
                }

                let frame = 0;
                const update = () => {
                    if (cancelled) return;

                    let complete = 0;
                    let output = "";

                    for (let i = 0; i < line.length; i++) {
                        const item = queue[i];
                        let char = "";
                        let style = `display:inline-block; width:${widths[i]}px;`;

                        if (frame >= item.end) {
                            char = item.to;
                            complete++;
                        } else if (frame >= item.start) {
                            char = randomChar();
                            style += "opacity:0.4;";
                        }

                        const safeChar = char.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        output += `<span style="${style}">${safeChar}</span>`;
                    }

                    setDisplayHTML(output);

                    if (complete === queue.length) {
                        resolve(true);
                    } else {
                        frame++;
                        requestId = requestAnimationFrame(update);
                    }
                };

                update();
            });
        };

        const loop = async () => {
            let idx = 0;
            while (!cancelled) {
                await scrambleLine(idx);
                if (cancelled) break;
                
                await new Promise((res) => {
                    timeoutId = window.setTimeout(res, lineDelay * 1000);
                });
                
                if (cancelled) break;
                idx = (idx + 1) % lines.length;
                setCurrentLineIndex(idx);
            }
        };

        loop();

        return () => {
            cancelled = true;
            if (requestId) cancelAnimationFrame(requestId);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isMeasuring, charWidths, lines, scrambleDuration, lineDelay]);

    return (
        <div 
            className={`inline-block min-h-[1.2em] ${className}`}
            style={{ fontWeight, fontSize, letterSpacing: `${letterSpacing}em`, lineHeight }}
            dangerouslySetInnerHTML={{ __html: displayHTML }}
        />
    );
};
