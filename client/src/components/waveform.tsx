import { useEffect, useRef } from "react";
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
  disableProgress?: boolean;
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
  disableProgress = false
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor,
        progressColor: disableProgress ? waveColor : progressColor,
        cursorColor: 'transparent',
        height,
        normalize: true,
        minPxPerSec: 10,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        fillParent: true,
        autoScroll: false,
        autoCenter: false,
        interact: !hideControls && !disableProgress,
        peaks: false,
        forceDecode: true,
        splitChannels: false,
        pixelRatio: 1,
        responsive: true,
        partialRender: true,
      });

      wavesurfer.current.load(`/api/audio/${audioFile.id}`);

      wavesurfer.current.on('ready', () => {
        const duration = wavesurfer.current?.getDuration() || 0;
        const containerWidth = waveformRef.current?.clientWidth || 0;
        const zoom = containerWidth / duration;
        wavesurfer.current?.zoom(zoom);
        onReady?.();
      });

      if (!disableProgress) {
        wavesurfer.current.on('play', () => onPlaybackChange?.(true));
        wavesurfer.current.on('pause', () => onPlaybackChange?.(false));
        wavesurfer.current.on('finish', () => onPlaybackChange?.(false));
      }
    }

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioFile, onPlaybackChange, onReady, waveColor, progressColor, height, hideControls, disableProgress]);

  useEffect(() => {
    if (wavesurfer.current && !disableProgress) {
      if (playing && !wavesurfer.current.isPlaying()) {
        wavesurfer.current.play();
      } else if (!playing && wavesurfer.current.isPlaying()) {
        wavesurfer.current.pause();
      }
    }
  }, [playing, disableProgress]);

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