import { useEffect, useState, useRef } from "react";

interface AnimatedBackgroundProps {
  isPlaying: boolean;
  intensity?: number;
  audioElements?: HTMLAudioElement[];
}

// Class for audio analysis
class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyzers: AnalyserNode[] = [];
  private dataArrays: Uint8Array[] = [];
  private sources: MediaElementAudioSourceNode[] = [];
  private initialized = false;
  private fftSize = 1024;

  public initialize(audioElements: HTMLAudioElement[]) {
    if (this.initialized || !audioElements.length) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      audioElements.forEach((audioElement, index) => {
        // Create audio source from the audio element
        const source = this.audioContext!.createMediaElementSource(audioElement);
        
        // Create analyzer
        const analyzer = this.audioContext!.createAnalyser();
        analyzer.fftSize = this.fftSize;
        
        // Connect the source to both the analyzer and the destination (speakers)
        source.connect(analyzer);
        source.connect(this.audioContext!.destination);
        
        // Prepare the data array for this analyzer
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        this.analyzers.push(analyzer);
        this.dataArrays.push(dataArray);
        this.sources.push(source);
      });
      
      this.initialized = true;
    } catch (err) {
      console.error("Error initializing audio analyzer:", err);
    }
  }

  public getAverageIntensity(): number {
    if (!this.initialized || this.analyzers.length === 0) return 0;
    
    let totalIntensity = 0;
    
    this.analyzers.forEach((analyzer, index) => {
      // Get frequency data
      analyzer.getByteFrequencyData(this.dataArrays[index]);
      
      // Calculate average value across frequency range
      const values = this.dataArrays[index];
      let sum = 0;
      
      // Focus on meaningful frequency ranges (exclude very low and high frequencies)
      // Low frequencies (bass): 0-20
      const bassRange = { start: 0, end: 20, weight: 1.5 };
      // Mid frequencies: 20-60
      const midRange = { start: 20, end: 60, weight: 1.0 };
      // High frequencies: 60-100
      const highRange = { start: 60, end: 100, weight: 0.7 };
      
      let weightedSum = 0;
      let totalWeight = 0;
      
      // Process bass range with higher weight
      for (let i = bassRange.start; i < Math.min(bassRange.end, values.length); i++) {
        weightedSum += values[i] * bassRange.weight;
        totalWeight += bassRange.weight;
      }
      
      // Process mid range
      for (let i = midRange.start; i < Math.min(midRange.end, values.length); i++) {
        weightedSum += values[i] * midRange.weight;
        totalWeight += midRange.weight;
      }
      
      // Process high range with lower weight
      for (let i = highRange.start; i < Math.min(highRange.end, values.length); i++) {
        weightedSum += values[i] * highRange.weight;
        totalWeight += highRange.weight;
      }
      
      const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
      // Normalize to 0-1 range (frequency data is 0-255)
      const normalizedAverage = average / 255;
      
      totalIntensity += normalizedAverage;
    });
    
    // Return average across all analyzers
    return this.analyzers.length > 0 ? totalIntensity / this.analyzers.length : 0;
  }

  public cleanup() {
    if (this.audioContext) {
      this.sources.forEach(source => {
        try {
          source.disconnect();
        } catch (err) {
          console.error("Error disconnecting audio source:", err);
        }
      });
      
      this.analyzers = [];
      this.dataArrays = [];
      this.sources = [];
      this.initialized = false;
    }
  }
}

export default function AnimatedBackground({ isPlaying, intensity = 0.5, audioElements = [] }: AnimatedBackgroundProps) {
  const [hue, setHue] = useState(250);
  const [amplitude, setAmplitude] = useState(0.3);
  const [pulse, setPulse] = useState(0);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const intensityHistory = useRef<number[]>([]);

  // Initialize audio analyzer
  useEffect(() => {
    if (!audioElements.length) return;
    
    if (!audioAnalyzerRef.current) {
      audioAnalyzerRef.current = new AudioAnalyzer();
    }
    
    // Only initialize with valid audio elements that are ready
    const validAudioElements = audioElements.filter(el => 
      el && !el.paused && el.readyState >= 3);
    
    if (validAudioElements.length > 0) {
      audioAnalyzerRef.current.initialize(validAudioElements);
    }
    
    return () => {
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.cleanup();
        audioAnalyzerRef.current = null;
      }
    };
  }, [audioElements]);

  useEffect(() => {
    if (!isPlaying) {
      setAmplitude(0.3);
      setPulse(0);
      setAudioIntensity(0);
      return;
    }

    // Create a pulsing effect based on audio intensity or fallback to simulation
    const animateBackground = (timestamp: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
      
      const deltaTime = timestamp - lastUpdateRef.current;
      
      if (deltaTime > 30) { // Limiting updates for performance
        lastUpdateRef.current = timestamp;
        
        // Get real audio intensity if available
        let currentIntensity = 0;
        
        if (audioAnalyzerRef.current) {
          // Get intensity from audio analyzer
          const rawIntensity = audioAnalyzerRef.current.getAverageIntensity();
          
          // Add to history for smoothing
          intensityHistory.current.push(rawIntensity);
          // Keep only the last 5 values for smooth transitions
          if (intensityHistory.current.length > 5) {
            intensityHistory.current.shift();
          }
          
          // Calculate smoothed intensity
          const avgIntensity = intensityHistory.current.reduce((sum, val) => sum + val, 0) / 
            intensityHistory.current.length;
          
          // Apply non-linear scaling for more dramatic effect on bass drops
          // but still keep it subtle for quieter parts
          currentIntensity = Math.pow(avgIntensity, 0.8) * intensity;
          
          // Ensure it's in a reasonable range
          currentIntensity = Math.min(1, Math.max(0.1, currentIntensity));
          
          setAudioIntensity(currentIntensity);
        } else {
          // Fallback to simulated pulsing if no audio analysis is available
          setPulse(p => {
            const newPulse = (p + 0.08) % (Math.PI * 2);
            // Use sine wave for smooth pulsing
            const simulatedIntensity = (Math.sin(newPulse) * 0.5 + 0.5) * intensity * 0.4;
            setAudioIntensity(simulatedIntensity + 0.1); // Base value + pulsing
            return newPulse;
          });
        }
        
        // Move through hue space (subtle movement in the purple range)
        setHue(h => 250 + Math.sin(timestamp / 3000) * 15); // Stay in purple range
        
        // Update amplitude based on audio intensity or fallback pulse
        const targetAmplitude = 0.3 + audioIntensity * 0.7;
        // Smooth transitions for amplitude
        setAmplitude(current => {
          return current + (targetAmplitude - current) * 0.3;
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
  }, [isPlaying, intensity, audioIntensity]);

  // Calculate dynamic styles based on audio intensity
  const glowSize = 200 + amplitude * 300;
  const glowOpacity = isPlaying ? 0.15 + amplitude * 0.2 : 0.05;
  const backgroundOpacity = isPlaying ? 0.5 + amplitude * 0.3 : 0.15;
  const waveIntensity = amplitude * 0.15;
  const scaleAmount = isPlaying ? 1 + amplitude * 0.05 : 1;
  
  // Create dynamic particle effects based on audio intensity
  const particleCount = Math.floor(5 + amplitude * 20); // More particles with higher intensity

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Base gradient background */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: backgroundOpacity,
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
          transition: 'all 0.3s ease-out'
        }}
      />
      
      {/* Dynamic wave patterns */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              ${45 + amplitude * 20}deg,
              transparent,
              transparent ${10 - amplitude * 5}px,
              rgba(93, 95, 239, ${waveIntensity}) ${10 - amplitude * 5}px,
              rgba(93, 95, 239, ${waveIntensity}) ${11 - amplitude * 5}px
            )
          `,
          transform: `scale(${scaleAmount})`,
          transition: 'all 0.3s ease-out'
        }}
      />
      
      {/* Dynamic horizontal light bars that react to beats */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div 
          key={`bar-${i}`}
          className="absolute h-px left-0 right-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          style={{
            top: `${25 + i * 25}%`,
            opacity: amplitude * 0.6,
            height: `${1 + amplitude * 2}px`,
            filter: `blur(${1 + amplitude * 3}px)`,
            transform: `scaleX(${0.7 + amplitude * 0.4})`,
            transition: 'all 0.2s ease-out'
          }}
        />
      ))}
      
      {/* Floating particles that react to the music */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = 4 + Math.random() * 6 * amplitude;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = i * 0.2;
        const duration = 2 + Math.random() * 3;
        const hueShift = Math.floor(Math.random() * 30) - 15;
        
        return (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${posX}%`,
              top: `${posY}%`,
              backgroundColor: `hsl(${hue + hueShift}, 80%, 60%)`,
              opacity: isPlaying ? 0.1 + amplitude * 0.3 : 0,
              filter: `blur(${size / 2}px)`,
              transform: `scale(${amplitude * 2})`,
              transition: `opacity 0.5s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
              animationDuration: `${duration + amplitude * 2}s`,
              animationDelay: `${delay}s`,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
              animationName: i % 2 === 0 ? 'float-y' : 'float-x',
            }}
          />
        );
      })}
      
      {/* Pulsing glow effect at center */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          backgroundColor: `hsl(${hue}, 80%, 50%)`,
          width: `${glowSize}px`,
          height: `${glowSize}px`,
          opacity: glowOpacity,
          transition: 'all 0.3s ease-out'
        }}
      />
      
      {/* CSS for floating animations */}
      <style jsx>{`
        @keyframes float-y {
          0% { transform: translateY(0) scale(${amplitude * 2}); }
          100% { transform: translateY(${20 * amplitude}px) scale(${amplitude * 1.5}); }
        }
        
        @keyframes float-x {
          0% { transform: translateX(0) scale(${amplitude * 2}); }
          100% { transform: translateX(${20 * amplitude}px) scale(${amplitude * 1.5}); }
        }
      `}</style>
    </div>
  );
}