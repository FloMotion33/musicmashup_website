import { useEffect, useState } from "react";

interface AnimatedBackgroundProps {
  isPlaying: boolean;
  intensity?: number;
}

export default function AnimatedBackground({ isPlaying, intensity = 0.5 }: AnimatedBackgroundProps) {
  const [hue, setHue] = useState(250);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setHue(h => (h + 1) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div 
      className="fixed inset-0 -z-10 transition-opacity duration-1000"
      style={{
        opacity: isPlaying ? 0.8 : 0.3,
        background: `
          radial-gradient(circle at 0% 0%, 
            hsl(${hue}, 95%, 90%, 0.1) 0%, 
            transparent 50%),
          radial-gradient(circle at 100% 0%, 
            hsl(${(hue + 60) % 360}, 95%, 90%, 0.1) 0%, 
            transparent 50%),
          radial-gradient(circle at 100% 100%, 
            hsl(${(hue + 120) % 360}, 95%, 90%, 0.1) 0%, 
            transparent 50%),
          radial-gradient(circle at 0% 100%, 
            hsl(${(hue + 180) % 360}, 95%, 90%, 0.1) 0%, 
            transparent 50%)
        `
      }}
    />
  );
}
