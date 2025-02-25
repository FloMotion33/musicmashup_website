import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { type AudioFile } from "@shared/schema";
import { Volume2, VolumeX, Mic, Music2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MixerProps {
  audioFiles: AudioFile[];
}

export default function Mixer({ audioFiles }: MixerProps) {
  const [volumes, setVolumes] = useState<Record<number, number>>(
    Object.fromEntries(audioFiles.map(f => [f.id, 1]))
  );
  const [extractVocals, setExtractVocals] = useState(false);
  const [extractInstrumental, setExtractInstrumental] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setVolumes(Object.fromEntries(audioFiles.map(f => [f.id, 1])));
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
            extractVocals,
            extractInstrumental
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

  return (
    <div className="space-y-6 mt-6">
      {audioFiles.map((file) => (
        <div key={file.id} className="bg-background/5 p-6 rounded-lg border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{file.filename}</span>
            <span className="text-sm text-muted-foreground">
              Volume: {Math.round(volumes[file.id] * 100)}%
            </span>
          </div>

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
                  checked={extractVocals}
                  onCheckedChange={setExtractVocals}
                />
                <Label htmlFor={`extract-vocals-${file.id}`} className="cursor-pointer flex items-center gap-1.5">
                  <Mic className="h-4 w-4" />
                  Vocals
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`extract-instrumental-${file.id}`}
                  checked={extractInstrumental}
                  onCheckedChange={setExtractInstrumental}
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