import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { type AudioFile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface WaveformProps {
  audioFile: AudioFile;
}

export default function Waveform({ audioFile }: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'hsl(250 95% 60% / 0.4)',
        progressColor: 'hsl(250 95% 60%)',
        cursorColor: 'hsl(250 95% 60%)',
        height: 64,
        normalize: false,
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        minPxPerSec: 1,
        fillParent: true,
        autoScroll: false,
        autoCenter: false,
        interact: true,
        peaks: true,
        splitChannels: false,
        pixelRatio: window.devicePixelRatio
      });

      wavesurfer.current.load(`/api/audio/${audioFile.id}`);

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));
    }

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioFile]);

  const togglePlayback = () => {
    wavesurfer.current?.playPause();
  };

  return (
    <div ref={waveformRef} className="bg-muted/10 rounded-lg overflow-hidden h-16" />
  );
}