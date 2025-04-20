import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { type AudioFile } from "@shared/schema";

interface WaveformProps {
  audioFile: AudioFile;
  onPlaybackChange?: (isPlaying: boolean) => void;
  playing?: boolean;
  onReady?: (duration: number) => void; // Updated to pass duration when ready
  waveColor?: string;
  progressColor?: string;
  height?: number;
  hideControls?: boolean;
  currentTime?: number; // Add currentTime prop for synchronized playback
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
  currentTime
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const audioId = audioFile.id; // Get id for API call
  
  // Setup waveform
  useEffect(() => {
    if (waveformRef.current) {
      // Create wavesurfer instance with proper type-safe options
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor,
        progressColor,
        cursorColor: 'transparent', // Hide default cursor
        height,
        normalize: true,
        minPxPerSec: 1, // Allow very compressed view 
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        fillParent: true, // This ensures the waveform stretches to fit the container
        autoScroll: false, // Disable auto-scrolling
        autoCenter: false,
        interact: !hideControls,
        forceDecode: true,
        pixelRatio: 1,
        responsive: true,
        partialRender: true,
      } as any); // Type casting to any to avoid type errors

      wavesurfer.current.load(`/api/audio/${audioId}`);

      wavesurfer.current.on('ready', () => {
        // Calculate zoom to fit entire audio in the container
        const duration = wavesurfer.current?.getDuration() || 0;
        const containerWidth = waveformRef.current?.clientWidth || 0;
        
        // Ensure the entire track is visible by adjusting minPxPerSec
        // We'll set minPxPerSec to a value that makes the waveform fit the container
        const minPxPerSec = containerWidth / duration;
        
        // Apply optimal zoom level
        wavesurfer.current?.zoom(minPxPerSec);
        
        setLoaded(true);
        
        // Pass duration to parent component when ready
        onReady?.(duration);
      });

      wavesurfer.current.on('play', () => onPlaybackChange?.(true));
      wavesurfer.current.on('pause', () => onPlaybackChange?.(false));
      wavesurfer.current.on('finish', () => onPlaybackChange?.(false));
      
      // Add class for event handling with custom seek events
      waveformRef.current.classList.add('waveform-container');
      
      // Listen for seek events from parent component
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

  // Synchronize with playback state
  useEffect(() => {
    if (wavesurfer.current) {
      if (playing && !wavesurfer.current.isPlaying()) {
        wavesurfer.current.play();
      } else if (!playing && wavesurfer.current.isPlaying()) {
        wavesurfer.current.pause();
      }
    }
  }, [playing]);
  
  // Sync with currentTime (if provided by parent)
  useEffect(() => {
    if (wavesurfer.current && loaded && currentTime !== undefined) {
      // Only seek if not playing to avoid conflicts
      if (!playing) {
        const duration = wavesurfer.current.getDuration();
        if (duration > 0) {
          const position = currentTime / duration;
          wavesurfer.current.seekTo(position);
        }
      }
    }
  }, [currentTime, loaded, playing]);

  // Adjust zoom when window is resized to maintain the entire track being visible
  useEffect(() => {
    const handleResize = () => {
      if (wavesurfer.current && loaded && waveformRef.current) {
        const duration = wavesurfer.current.getDuration() || 0;
        const containerWidth = waveformRef.current.clientWidth || 0;
        const minPxPerSec = containerWidth / duration;
        wavesurfer.current.zoom(minPxPerSec);
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