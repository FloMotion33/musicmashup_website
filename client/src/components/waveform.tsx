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
        height: 80,
        normalize: true,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        minPxPerSec: 1,
        fillParent: true,
        autoScroll: false,
        autoCenter: false,
        interact: true
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
    <div className="space-y-2 bg-background/5 p-4 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium">{audioFile.filename}</span>
          {audioFile.bpm && (
            <span className="ml-2 text-sm text-muted-foreground">
              {audioFile.bpm} BPM
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={togglePlayback}
          className="bg-primary/10 hover:bg-primary/20"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={waveformRef} className="bg-muted/10 rounded-lg overflow-hidden" />
    </div>
  );
}