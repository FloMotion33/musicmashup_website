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

  // Instead of fixed size gradients, we'll use relative sizes to fit rounded cards better
  const gradientSize = 80 + (amplitude * 30); // Larger base size for better coverage

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg">
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{
          opacity: isPlaying ? 0.65 : 0.15, // Reduced opacity to be less distracting
          background: `
            radial-gradient(circle at 30% 30%, 
              hsl(${hue}, 95%, 50%, ${amplitude}) 0%, 
              transparent ${gradientSize}%),
            radial-gradient(circle at 70% 30%, 
              hsl(${(hue + 60) % 360}, 95%, 50%, ${amplitude}) 0%, 
              transparent ${gradientSize}%),
            radial-gradient(circle at 70% 70%, 
              hsl(${(hue + 120) % 360}, 95%, 50%, ${amplitude}) 0%, 
              transparent ${gradientSize}%),
            radial-gradient(circle at 30% 70%, 
              hsl(${(hue + 180) % 360}, 95%, 50%, ${amplitude}) 0%, 
              transparent ${gradientSize}%)
          `,
          transform: `scale(${isPlaying ? 1 + amplitude * 0.05 : 1})`,
          filter: 'blur(30px)', // Added blur for a more diffuse effect
        }}
      />
      <div 
        className="absolute inset-0 bg-black/40" 
        style={{ backdropFilter: 'blur(5px)' }}
      />
    </div>
  );
}