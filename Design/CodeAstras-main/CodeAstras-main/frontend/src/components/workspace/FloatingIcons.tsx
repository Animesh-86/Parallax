import { useState, useEffect } from 'react';
import { GitBranch, Terminal, Users, Mic } from 'lucide-react';

interface FloatingIcon {
  id: number;
  Icon: any;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  speed: number;
}

export function FloatingIcons() {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);
  const [isHovered, setIsHovered] = useState<number | null>(null);

  useEffect(() => {
    const iconTypes = [GitBranch, Terminal, Users, Mic];
    const newIcons: FloatingIcon[] = [];

    for (let i = 0; i < 8; i++) {
      newIcons.push({
        id: i,
        Icon: iconTypes[i % iconTypes.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.5 + 0.3,
      });
    }

    setIcons(newIcons);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIcons((prevIcons) =>
        prevIcons.map((icon) => ({
          ...icon,
          rotation: (icon.rotation + icon.speed) % 360,
          y: (icon.y + icon.speed * 0.05) % 100,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-5 overflow-hidden">
      {icons.map((icon) => {
        const Icon = icon.Icon;
        const size = 40 * icon.scale;
        
        return (
          <div
            key={icon.id}
            className="absolute transition-all duration-300 pointer-events-auto cursor-pointer"
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              transform: `rotate(${icon.rotation}deg) scale(${isHovered === icon.id ? 1.3 : 1})`,
              opacity: 0.1,
            }}
            onMouseEnter={() => setIsHovered(icon.id)}
            onMouseLeave={() => setIsHovered(null)}
          >
            <div
              className="relative"
              style={{
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              {/* Glow effect */}
              {isHovered === icon.id && (
                <div
                  className="absolute inset-0 rounded-full blur-xl"
                  style={{
                    background: `radial-gradient(circle, rgba(43, 203, 255, 0.4) 0%, transparent 70%)`,
                  }}
                />
              )}
              
              {/* Icon */}
              <Icon
                className="w-full h-full"
                style={{
                  color: isHovered === icon.id ? '#2BCBFF' : '#666',
                  filter: isHovered === icon.id ? `drop-shadow(0 0 10px #2BCBFF)` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
