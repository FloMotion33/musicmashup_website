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
        normalize: true,
        minPxPerSec: 50,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        fillParent: true,
        autoScroll: true,
        autoCenter: false,
        interact: true,
        peaks: false,
        forceDecode: true,
        splitChannels: false,
        pixelRatio: 1
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
    <div className="space-y-2">
      <div ref={waveformRef} className="bg-muted/10 rounded-lg overflow-hidden h-16" />
      <Button
        size="sm"
        variant="ghost"
        onClick={togglePlayback}
        className="hover:bg-primary/10"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}