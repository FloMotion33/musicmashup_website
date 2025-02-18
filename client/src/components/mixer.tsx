import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { type AudioFile } from "@shared/schema";
import { Volume2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MixerProps {
  audioFiles: AudioFile[];
}

export default function Mixer({ audioFiles }: MixerProps) {
  const [volumes, setVolumes] = useState<Record<number, number>>(
    Object.fromEntries(audioFiles.map(f => [f.id, 1]))
  );
  const { toast } = useToast();

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
      a.click();
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

  return (
    <div className="space-y-6 mt-6">
      {audioFiles.map((file) => (
        <div key={file.id} className="space-y-2">
          <div className="flex items-center gap-4">
            <Volume2 className="h-4 w-4" />
            <Slider
              value={[volumes[file.id] * 100]}
              onValueChange={(value) => {
                setVolumes({...volumes, [file.id]: value[0] / 100});
              }}
              max={100}
              step={1}
            />
          </div>
        </div>
      ))}

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
