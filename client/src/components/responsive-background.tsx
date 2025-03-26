import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveBackgroundProps {
  amplitude: number;
  className?: string;
}

export function ResponsiveBackground({ amplitude, className }: ResponsiveBackgroundProps) {
  useEffect(() => {
    // Update CSS custom properties based on amplitude
    document.documentElement.style.setProperty('--amplitude', amplitude.toString());
  }, [amplitude]);

  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 bg-gradient-to-br transition-all duration-300",
        "from-background via-background/95 to-primary/5",
        "animate-gradient",
        className
      )} 
      style={{
        // Use amplitude to affect the gradient
        '--gradient-position': `${Math.min(100, amplitude * 200)}%`,
        filter: `hue-rotate(${amplitude * 45}deg)`,
      } as React.CSSProperties}
    />
  );
}
