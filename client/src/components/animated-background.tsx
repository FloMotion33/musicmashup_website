import { useEffect, useState, useRef } from "react";

interface AnimatedBackgroundProps {
  isPlaying: boolean;
  intensity?: number;
}

export default function AnimatedBackground({ isPlaying, intensity = 0.5 }: AnimatedBackgroundProps) {
  const [hue, setHue] = useState(250);
  const [amplitude, setAmplitude] = useState(0.3);
  const [pulse, setPulse] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      setAmplitude(0.3);
      setPulse(0);
      return;
    }

    // Create a pulsing effect based on a frequency that simulates music beats
    const animateBackground = (timestamp: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
      
      const deltaTime = timestamp - lastUpdateRef.current;
      
      if (deltaTime > 30) { // Limiting updates for performance
        lastUpdateRef.current = timestamp;
        
        // Move through hue space (subtle movement in the purple range)
        setHue(h => 250 + Math.sin(timestamp / 3000) * 10); // Stay in purple range
        
        // Create a pulsing effect
        setPulse(p => {
          const newPulse = (p + 0.08) % (Math.PI * 2);
          // Use sine wave for smooth pulsing
          const newAmplitude = 0.3 + (Math.sin(newPulse) * 0.5 + 0.5) * intensity * 0.2;
          setAmplitude(newAmplitude);
          return newPulse;
        });
      }
      
      frameRef.current = requestAnimationFrame(animateBackground);
    };
    
    frameRef.current = requestAnimationFrame(animateBackground);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, intensity]);

  return (
    <div className="absolute inset-0 z-0">
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isPlaying ? 0.6 : 0.15,
          background: `linear-gradient(to bottom, rgba(20, 20, 33, 0.8), rgba(0, 0, 0, 0.95)), 
            radial-gradient(circle at 50% 0%, 
              rgba(93, 95, 239, ${amplitude * 0.7}), 
              transparent 70%),
            radial-gradient(circle at 85% 30%, 
              rgba(93, 95, 239, ${amplitude * 0.5}), 
              transparent 60%),
            radial-gradient(circle at 20% 80%, 
              rgba(93, 95, 239, ${amplitude * 0.6}), 
              transparent 55%)`,
        }}
      />
      
      {/* Dynamic wave patterns */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(93, 95, 239, ${amplitude * 0.1}) 10px,
              rgba(93, 95, 239, ${amplitude * 0.1}) 11px
            )
          `,
          transform: `scale(${isPlaying ? 1 + amplitude * 0.03 : 1})`,
          transition: 'transform 0.5s ease-out'
        }}
      />
      
      {/* Pulsing glow effect at center */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          backgroundColor: `hsl(${hue}, 80%, 50%)`,
          width: `${200 + amplitude * 100}px`,
          height: `${200 + amplitude * 100}px`,
          opacity: isPlaying ? 0.15 : 0.05,
          transition: 'opacity 0.5s ease-out'
        }}
      />
    </div>
  );
}