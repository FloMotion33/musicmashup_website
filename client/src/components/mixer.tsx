import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { type AudioFile } from "@shared/schema";
import { Play, Pause, Save, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Waveform from "./waveform";

interface MixerProps {
  audioFiles: AudioFile[];
  stemSettings: Record<number, {
    extractVocals: boolean;
    extractInstrumental: boolean;
  }>;
}

export default function Mixer({ audioFiles, stemSettings }: MixerProps) {
  const [volumes, setVolumes] = useState<Record<number, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setVolumes(prev => {
      const newVolumes: Record<number, number> = {};
      audioFiles.forEach(file => {
        newVolumes[file.id] = prev[file.id] ?? 1;
      });
      return newVolumes;
    });

    setIsPlaying(false);
    setReadyCount(0);
  }, [audioFiles]);

  const mixMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mashups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Mashup",
          audioFileIds: audioFiles.map(f => f.id),
          mixSettings: {
            volumes,
            extractVocals: Object.values(stemSettings).some(s => s.extractVocals),
            extractInstrumental: Object.values(stemSettings).some(s => s.extractInstrumental)
          }
        })
      });
      if (!res.ok) throw new Error("Failed to save mashup");
      return res.blob();
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mashup.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Mashup saved",
        description: "Your mashup has been downloaded"
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Could not save the mashup",
        variant: "destructive"
      });
    }
  });

  const updateVolume = useCallback((fileId: number, value: number) => {
    setVolumes(prev => ({
      ...prev,
      [fileId]: value
    }));
  }, []);

  const handleWaveformReady = useCallback(() => {
    setReadyCount(count => count + 1);
  }, []);

  const togglePlayback = useCallback(() => {
    if (readyCount === audioFiles.length) {
      setIsPlaying(!isPlaying);
    }
  }, [readyCount, audioFiles.length, isPlaying]);

  return (
    <div className="space-y-6">
      <div className="relative border rounded-lg p-6 bg-background/5">
        <div className="space-y-6">
          {audioFiles.map((file) => (
            <div key={file.id} className="space-y-4">
              {stemSettings[file.id]?.extractVocals && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Waveform 
                      audioFile={file}
                      playing={isPlaying}
                      onReady={handleWaveformReady}
                      waveColor="hsl(250 95% 60% / 0.6)"
                      progressColor="hsl(250 95% 60%)"
                      height={48}
                      hideControls
                    />
                  </div>
                  <div className="w-24">
                    <Slider
                      orientation="vertical"
                      value={[volumes[file.id] * 100]}
                      onValueChange={(value) => updateVolume(file.id, value[0] / 100)}
                      max={100}
                      step={1}
                      className="h-[120px]"
                    />
                  </div>
                </div>
              )}
              {stemSettings[file.id]?.extractInstrumental && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Waveform 
                      audioFile={file}
                      playing={isPlaying}
                      onReady={handleWaveformReady}
                      waveColor="hsl(250 95% 60% / 0.3)"
                      progressColor="hsl(250 95% 60%)"
                      height={48}
                      hideControls
                    />
                  </div>
                  <div className="w-24">
                    <Slider
                      orientation="vertical"
                      value={[volumes[file.id] * 100]}
                      onValueChange={(value) => updateVolume(file.id, value[0] / 100)}
                      max={100}
                      step={1}
                      className="h-[120px]"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={togglePlayback}
            disabled={readyCount !== audioFiles.length}
          >
            {isPlaying ? (
              <><Pause className="h-4 w-4" /></>
            ) : (
              <><Play className="h-4 w-4" /></>
            )}
          </Button>
          <span className="text-sm font-medium">00:00</span>
        </div>
      </div>

      <Button 
        className="w-full bg-primary hover:bg-primary/90"
        onClick={() => mixMutation.mutate()}
        disabled={mixMutation.isPending}
      >
        {mixMutation.isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Mashup
          </>
        )}
      </Button>
    </div>
  );
}