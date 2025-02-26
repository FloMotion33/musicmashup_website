import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { type AudioFile } from "@shared/schema";
import { Volume2, VolumeX, Mic, Music2, Play, Pause } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Waveform from "./waveform";

interface MixerProps {
  audioFiles: AudioFile[];
}

export default function Mixer({ audioFiles }: MixerProps) {
  const [volumes, setVolumes] = useState<Record<number, number>>({});
  const [stemSettings, setStemSettings] = useState<Record<number, {
    extractVocals: boolean;
    extractInstrumental: boolean;
  }>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Reset volumes and stem settings when audio files change
    setVolumes(prev => {
      const newVolumes: Record<number, number> = {};
      audioFiles.forEach(file => {
        newVolumes[file.id] = prev[file.id] ?? 1;
      });
      return newVolumes;
    });

    setStemSettings(prev => {
      const newSettings: Record<number, any> = {};
      audioFiles.forEach(file => {
        newSettings[file.id] = prev[file.id] ?? {
          extractVocals: false,
          extractInstrumental: false
        };
      });
      return newSettings;
    });

    // Reset playback state when files change
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
            bpm: Math.max(...audioFiles.map(f => f.bpm || 0)),
            extractVocals: Object.values(stemSettings).some(s => s.extractVocals),
            extractInstrumental: Object.values(stemSettings).some(s => s.extractInstrumental)
          }
        })
      });
      if (!res.ok) throw new Error("Mix failed");
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
        title: "Mashup created",
        description: "Your mashup has been downloaded"
      });
    },
    onError: () => {
      toast({
        title: "Mix failed",
        description: "Please try again",
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

  const updateStemSettings = useCallback((fileId: number, setting: 'extractVocals' | 'extractInstrumental', value: boolean) => {
    setStemSettings(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [setting]: value
      }
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
    <div className="space-y-6 mt-6">
      <div className="flex justify-center mb-4">
        <Button
          size="lg"
          onClick={togglePlayback}
          disabled={readyCount !== audioFiles.length}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isPlaying ? (
            <><Pause className="mr-2 h-4 w-4" /> Pause All</>
          ) : (
            <><Play className="mr-2 h-4 w-4" /> Play All</>
          )}
        </Button>
      </div>

      {audioFiles.map((file) => (
        <div key={file.id} className="bg-background/5 p-6 rounded-lg border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{file.filename}</span>
            <span className="text-sm text-muted-foreground">
              Volume: {Math.round(volumes[file.id] * 100)}%
            </span>
          </div>

          <Waveform 
            audioFile={file}
            playing={isPlaying}
            onReady={handleWaveformReady}
          />

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <VolumeX 
                className={cn(
                  "h-4 w-4 transition-opacity cursor-pointer hover:text-primary",
                  volumes[file.id] === 0 ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => updateVolume(file.id, 0)}
              />
              <Slider
                value={[volumes[file.id] * 100]}
                onValueChange={(value) => {
                  updateVolume(file.id, value[0] / 100);
                }}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 
                className={cn(
                  "h-4 w-4 transition-opacity cursor-pointer hover:text-primary",
                  volumes[file.id] === 1 ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => updateVolume(file.id, 1)}
              />
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Switch
                  id={`extract-vocals-${file.id}`}
                  checked={stemSettings[file.id]?.extractVocals || false}
                  onCheckedChange={(checked) => updateStemSettings(file.id, 'extractVocals', checked)}
                />
                <Label htmlFor={`extract-vocals-${file.id}`} className="cursor-pointer flex items-center gap-1.5">
                  <Mic className="h-4 w-4" />
                  Vocals
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`extract-instrumental-${file.id}`}
                  checked={stemSettings[file.id]?.extractInstrumental || false}
                  onCheckedChange={(checked) => updateStemSettings(file.id, 'extractInstrumental', checked)}
                />
                <Label htmlFor={`extract-instrumental-${file.id}`} className="cursor-pointer flex items-center gap-1.5">
                  <Music2 className="h-4 w-4" />
                  Instrumental
                </Label>
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button 
        className="w-full bg-primary hover:bg-primary/90"
        onClick={() => mixMutation.mutate()}
        disabled={mixMutation.isPending}
      >
        {mixMutation.isPending ? "Creating mashup..." : "Create Mashup"}
      </Button>
    </div>
  );
}