import { useState, useEffect } from 'react';

export function AstraCore3D() {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);

    const pulseInterval = setInterval(() => {
      setPulse((prev) => (prev + 1) % 100);
    }, 30);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  const pulseScale = 1 + Math.sin(pulse * 0.1) * 0.1;

  return (
    <div
      className="relative w-16 h-16 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-[#0D1226]/90 backdrop-blur-md border border-[#2BCBFF]/50 rounded-lg text-xs whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          Workspace status — 3 users
        </div>
      )}

      {/* Outer glow rings */}
      <div
        className="absolute inset-0 rounded-full opacity-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, rgba(176, 67, 255, 0.3) 0%, transparent 70%)`,
          transform: `scale(${isHovered ? 1.3 : 1})`,
        }}
      />
      
      <div
        className="absolute inset-0 rounded-full opacity-20 animate-ping"
        style={{
          background: `radial-gradient(circle, rgba(43, 203, 255, 0.4) 0%, transparent 70%)`,
          animationDuration: '3s',
        }}
      />

      {/* Main orb */}
      <div
        className="absolute inset-2 rounded-full transition-all duration-300"
        style={{
          background: `radial-gradient(circle at 30% 30%, #3DF6FF, #2BCBFF, #B043FF)`,
          boxShadow: isHovered
            ? '0 0 40px rgba(43, 203, 255, 0.8), 0 0 80px rgba(176, 67, 255, 0.4)'
            : '0 0 20px rgba(43, 203, 255, 0.6), 0 0 40px rgba(176, 67, 255, 0.3)',
          transform: `scale(${isHovered ? 1.1 : pulseScale})`,
        }}
      >
        {/* Inner rotating gradient */}
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background: `conic-gradient(from ${rotation}deg, transparent, rgba(255, 255, 255, 0.3), transparent)`,
          }}
        />

        {/* Core highlight */}
        <div
          className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/80 blur-sm"
          style={{
            transform: `translate(${Math.cos(rotation * 0.05) * 2}px, ${Math.sin(rotation * 0.05) * 2}px)`,
          }}
        />
      </div>

      {/* Orbital rings */}
      <div
        className="absolute inset-0 border border-[#2BCBFF]/30 rounded-full"
        style={{
          transform: `rotate(${rotation * 0.5}deg) scale(1.2)`,
        }}
      />
      
      <div
        className="absolute inset-0 border border-[#B043FF]/20 rounded-full"
        style={{
          transform: `rotate(${-rotation * 0.7}deg) scale(1.4)`,
        }}
      />

      {/* Connection points (simulate active users) */}
      {[0, 120, 240].map((angle, idx) => {
        const x = Math.cos(((rotation + angle) * Math.PI) / 180) * 28;
        const y = Math.sin(((rotation + angle) * Math.PI) / 180) * 28;
        
        return (
          <div
            key={idx}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#3DF6FF] to-[#2BCBFF]"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              boxShadow: '0 0 10px rgba(61, 246, 255, 0.8)',
            }}
          />
        );
      })}
    </div>
  );
}
