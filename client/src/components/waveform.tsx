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
        waveColor: 'hsl(var(--primary) / 0.8)',
        progressColor: 'hsl(var(--primary))',
        cursorColor: 'hsl(var(--primary))',
        height: 120,
        normalize: true,
        minPxPerSec: 100, // Increased time scale for better visibility
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        cursorWidth: 2,
        fillParent: true,
        autoCenter: true,
        interact: true,
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
    <div className="space-y-3 bg-card p-4 rounded-lg border">
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
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={waveformRef} className="bg-muted/30 rounded-lg overflow-hidden" />
    </div>
  );
}