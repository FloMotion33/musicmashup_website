import { useEffect, useRef } from "react";
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
        waveColor: 'var(--primary)',
        progressColor: 'var(--primary)',
        cursorColor: 'var(--primary)',
        height: 80,
        normalize: true,
      });

      wavesurfer.current.load(`/api/audio/${audioFile.id}`);

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{audioFile.filename}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={waveformRef} />
    </div>
  );
}
