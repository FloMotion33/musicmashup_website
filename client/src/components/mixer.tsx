import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { type AudioFile } from "@shared/schema";
import { Volume2, VolumeX } from "lucide-react";
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
  const { toast } = useToast();

  // Reset volumes when audio files change
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
            bpm: Math.max(...audioFiles.map(f => f.bpm || 0))
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

  const updateVolume = (fileId: number, value: number) => {
    setVolumes(prev => ({...prev, [fileId]: value}));
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="grid gap-4">
        {audioFiles.map((file) => (
          <div key={file.id} className="bg-card p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{file.filename}</span>
              <span className="text-sm text-muted-foreground">
                Volume: {Math.round(volumes[file.id] * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <VolumeX className={cn(
                "h-4 w-4 transition-opacity",
                volumes[file.id] === 0 ? "opacity-100" : "opacity-50"
              )} />
              <Slider
                value={[volumes[file.id] * 100]}
                onValueChange={(value) => {
                  updateVolume(file.id, value[0] / 100);
                }}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className={cn(
                "h-4 w-4 transition-opacity",
                volumes[file.id] === 1 ? "opacity-100" : "opacity-50"
              )} />
            </div>
          </div>
        ))}
      </div>

      <Button 
        className="w-full"
        onClick={() => mixMutation.mutate()}
        disabled={mixMutation.isPending}
      >
        {mixMutation.isPending ? "Creating mashup..." : "Create Mashup"}
      </Button>
    </div>
  );
}