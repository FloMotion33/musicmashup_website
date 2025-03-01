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

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor,
        progressColor,
        cursorColor: progressColor,
        height,
        normalize: true,
        minPxPerSec: 50,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        fillParent: true,
        autoScroll: true,
        autoCenter: true,
        interact: !hideControls,
        peaks: false,
        forceDecode: true,
        splitChannels: false,
        pixelRatio: 1
      });

      wavesurfer.current.load(`/api/audio/${audioFile.id}`);

      wavesurfer.current.on('ready', () => {
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

  // Control playback from parent
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
    <div ref={waveformRef} className="rounded-lg overflow-hidden" style={{ height }} />
  );
}