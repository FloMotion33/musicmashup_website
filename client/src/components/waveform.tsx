import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { type AudioFile } from "@shared/schema";

interface WaveformProps {
  audioFile: AudioFile;
  onPlaybackChange?: (isPlaying: boolean) => void;
  playing?: boolean;
  onReady?: (wavesurfer: WaveSurfer) => void;  
  waveColor?: string;
  progressColor?: string;
  height?: number;
  hideControls?: boolean;
  isPlaybackMaster?: boolean;
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
  isPlaybackMaster = false
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const loadedRef = useRef(false);

  // Initialize WaveSurfer instance
  useEffect(() => {
    if (!waveformRef.current || loadedRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor,
      progressColor: isPlaybackMaster ? progressColor : waveColor,
      cursorColor: isPlaybackMaster ? progressColor : 'transparent',
      height,
      normalize: true,
      minPxPerSec: 10,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      fillParent: true,
      autoScroll: false,
      autoCenter: false,
      interact: isPlaybackMaster,
      plugins: []
    });

    const ws = wavesurfer.current;

    ws.on('ready', () => {
      const duration = ws.getDuration();
      const containerWidth = waveformRef.current?.clientWidth || 0;
      const zoom = containerWidth / duration;
      ws.zoom(zoom);
      loadedRef.current = true;
      if (onReady) onReady(ws);
    });

    if (isPlaybackMaster) {
      ws.on('play', () => onPlaybackChange?.(true));
      ws.on('pause', () => onPlaybackChange?.(false));
      ws.on('finish', () => onPlaybackChange?.(false));
    }

    // Load audio file
    ws.load(`/api/audio/${audioFile.id}`);

    // Cleanup
    return () => {
      if (ws) {
        ws.pause();
        ws.destroy();
        loadedRef.current = false;
      }
    };
  }, [audioFile.id, waveColor, progressColor, height, hideControls, isPlaybackMaster, onReady]);

  // Handle play/pause state
  useEffect(() => {
    if (!wavesurfer.current || !loadedRef.current) return;

    if (playing && !wavesurfer.current.isPlaying()) {
      wavesurfer.current.play();
    } else if (!playing && wavesurfer.current.isPlaying()) {
      wavesurfer.current.pause();
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