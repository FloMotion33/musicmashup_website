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
        
        // Move through hue space
        setHue(h => (h + 0.5) % 360);
        
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

  // Calculate gradient positions that move with the beat
  const gradientSize = 50 + (amplitude * 20);

  return (
    <div 
      className="fixed inset-0 -z-10 transition-all duration-500"
      style={{
        opacity: isPlaying ? 0.9 : 0.2,
        background: `
          radial-gradient(circle at 0% 0%, 
            hsl(${hue}, 95%, 90%, ${amplitude}) 0%, 
            transparent ${gradientSize}%),
          radial-gradient(circle at 100% 0%, 
            hsl(${(hue + 60) % 360}, 95%, 90%, ${amplitude}) 0%, 
            transparent ${gradientSize}%),
          radial-gradient(circle at 100% 100%, 
            hsl(${(hue + 120) % 360}, 95%, 90%, ${amplitude}) 0%, 
            transparent ${gradientSize}%),
          radial-gradient(circle at 0% 100%, 
            hsl(${(hue + 180) % 360}, 95%, 90%, ${amplitude}) 0%, 
            transparent ${gradientSize}%)
        `,
        transform: `scale(${isPlaying ? 1 + amplitude * 0.05 : 1})`,
      }}
    />
  );
}