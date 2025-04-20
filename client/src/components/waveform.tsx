import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { type AudioFile } from "@shared/schema";

interface WaveformProps {
  audioFile: AudioFile;
  onPlaybackChange?: (isPlaying: boolean) => void;
  playing?: boolean;
  onReady?: () => void;
  waveColor?: string;
  progressColor?: string;
  height?: number;
  hideControls?: boolean;
}

export default function Waveform({ 
  audioFile, 
  onPlaybackChange, 
  playing = false, 
  onReady,
  waveColor = 'hsl(250 95% 60% / 0.4)',
  progressColor = 'hsl(250 95% 60%)',
  height = 64,
  hideControls = false
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor,
        progressColor,
        cursorColor: progressColor,
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
        peaks: false,
        forceDecode: true,
        splitChannels: false,
        pixelRatio: 1,
        responsive: true,
        partialRender: true,
      });

      wavesurfer.current.load(`/api/audio/${audioFile.id}`);

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
        onReady?.();
      });

      wavesurfer.current.on('play', () => onPlaybackChange?.(true));
      wavesurfer.current.on('pause', () => onPlaybackChange?.(false));
      wavesurfer.current.on('finish', () => onPlaybackChange?.(false));
    }

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioFile, onPlaybackChange, onReady, waveColor, progressColor, height, hideControls]);

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

  useEffect(() => {
    if (wavesurfer.current) {
      if (playing && !wavesurfer.current.isPlaying()) {
        wavesurfer.current.play();
      } else if (!playing && wavesurfer.current.isPlaying()) {
        wavesurfer.current.pause();
      }
    }
  }, [playing]);

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