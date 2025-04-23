import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { type AudioFile } from "@shared/schema";

interface WaveformProps {
  audioFile: AudioFile;
  onPlaybackChange?: (isPlaying: boolean) => void;
  playing?: boolean;
  onReady?: (duration: number) => void;
  waveColor?: string;
  progressColor?: string;
  height?: number;
  hideControls?: boolean;
  currentTime?: number;
  timeOffset?: number; // To adjust track timing for alignment
}

export default function Waveform({ 
  audioFile, 
  onPlaybackChange, 
  playing = false, 
  onReady,
  waveColor = 'hsl(250 95% 60% / 0.4)',
  progressColor = 'hsl(250 95% 60%)',
  height = 64,
  hideControls = false,
  currentTime,
  timeOffset = 0
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const audioId = audioFile.id;
  const lastTimeRef = useRef<number>(0);
  
  // Setup waveform
  useEffect(() => {
    if (waveformRef.current) {
      // Create wavesurfer instance with enhanced visualization
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor,
        progressColor,
        cursorColor: 'transparent', // Hide default cursor since we use a shared vertical line
        height,
        // Always normalize to make even quiet tracks visible
        normalize: true, 
        minPxPerSec: 1,
        // Enhanced visualization settings
        barWidth: 2,
        barGap: 1,
        barRadius: 2, 
        barHeight: 5, // Higher bars for better contrast across various audio intensities
        fillParent: true,
        interact: !hideControls,
        autoScroll: false,
        autoCenter: false,
        // Enhanced decoding for better waveform representation
        forceDecode: true,
        // Set splitChannels to false to get a combined waveform
        splitChannels: false,
        pixelRatio: 1.5, // Higher pixel ratio for better quality
        responsive: true,
      } as any);

      wavesurfer.current.load(`/api/audio/${audioId}`);

      wavesurfer.current.on('ready', () => {
        const duration = wavesurfer.current?.getDuration() || 0;
        const containerWidth = waveformRef.current?.clientWidth || 0;
        
        // Calculate zoom level to fit the entire track
        const minPxPerSec = containerWidth / duration;
        wavesurfer.current?.zoom(minPxPerSec);
        
        // Enhanced visualization after loading
        // We use a simpler approach that works reliably with all WaveSurfer versions
        try {
          // Apply contrast settings to make the waveform more visible
          if (wavesurfer.current) {
            // Force a redraw with optimized settings for better visualization
            const barHeight = 5;
            const barWidth = 2;
            const barGap = 1;
            const barRadius = 2;
            
            // Apply these settings for maximum clarity
            // This uses the as any cast to avoid TypeScript errors with WaveSurfer options
            wavesurfer.current.setOptions({
              barHeight,
              barWidth,
              barGap,
              barRadius,
              // Increase contrast
              normalize: true,
            } as any);
          }
        } catch (err) {
          console.log("Could not apply custom waveform settings", err);
        }
        
        setLoaded(true);
        onReady?.(duration);
      });

      // Handle playback events
      wavesurfer.current.on('play', () => onPlaybackChange?.(true));
      wavesurfer.current.on('pause', () => onPlaybackChange?.(false));
      wavesurfer.current.on('finish', () => onPlaybackChange?.(false));
      
      // Handle seeking from parent component
      waveformRef.current.classList.add('waveform-container');
      
      const handleSeek = (e: CustomEvent) => {
        if (wavesurfer.current && e.detail?.position !== undefined) {
          wavesurfer.current.seekTo(e.detail.position);
        }
      };
      
      waveformRef.current.addEventListener('seek', handleSeek as EventListener);
      
      return () => {
        waveformRef.current?.removeEventListener('seek', handleSeek as EventListener);
        wavesurfer.current?.destroy();
      };
    }
    
    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioId, onPlaybackChange, onReady, waveColor, progressColor, height, hideControls]);

  // Handle play/pause state
  useEffect(() => {
    if (!wavesurfer.current || !loaded) return;
    
    try {
      if (playing && !wavesurfer.current.isPlaying()) {
        wavesurfer.current.play();
      } else if (!playing && wavesurfer.current.isPlaying()) {
        wavesurfer.current.pause();
      }
    } catch (err) {
      console.error("Error controlling wavesurfer playback:", err);
    }
  }, [playing, loaded]);
  
  // Handle time synchronization with parent
  useEffect(() => {
    if (!wavesurfer.current || !loaded || currentTime === undefined) return;
    
    // Apply time offset (positive moves track forward, negative moves it backward)
    const adjustedTime = Math.max(0, currentTime - timeOffset);
    
    // Prevent unnecessary updates and audio glitches
    if (Math.abs((lastTimeRef.current || 0) - adjustedTime) < 0.05) return;
    
    try {
      const duration = wavesurfer.current.getDuration();
      if (duration > 0) {
        // Calculate position as percentage (0-1)
        const position = adjustedTime / duration;
        
        // Only seek if it's a significant change to avoid stuttering
        if (Math.abs(wavesurfer.current.getCurrentTime() - adjustedTime) > 0.1) {
          // We need to pause before seeking to avoid audio glitches
          const wasPlaying = wavesurfer.current.isPlaying();
          if (wasPlaying) wavesurfer.current.pause();
          
          wavesurfer.current.seekTo(position);
          
          // Resume playback if it was playing
          if (wasPlaying && playing) {
            setTimeout(() => wavesurfer.current?.play(), 10);
          }
        }
      }
      
      lastTimeRef.current = adjustedTime;
    } catch (err) {
      console.error("Error seeking wavesurfer:", err);
    }
  }, [currentTime, timeOffset, loaded, playing]);

  // Handle window resize for responsive waveform display
  useEffect(() => {
    const handleResize = () => {
      if (!wavesurfer.current || !loaded || !waveformRef.current) return;
      
      try {
        const duration = wavesurfer.current.getDuration() || 0;
        const containerWidth = waveformRef.current.clientWidth || 0;
        
        if (duration > 0 && containerWidth > 0) {
          const minPxPerSec = containerWidth / duration;
          wavesurfer.current.zoom(minPxPerSec);
        }
      } catch (err) {
        console.error("Error resizing wavesurfer:", err);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded]);

  return (
    <div className="relative w-full">
      <div 
        ref={waveformRef} 
        className="rounded-lg overflow-hidden" 
        style={{ height }}
      />
    </div>
  );
}