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

  // Count total stems that need to be loaded
  const totalStems = audioFiles.reduce((count, file) => {
    const settings = stemSettings[file.id] || {};
    return count + (settings.extractVocals ? 1 : 0) + (settings.extractInstrumental ? 1 : 0);
  }, 0);

  const hasTwoOrMoreStems = totalStems >= 2;

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
  }, [audioFiles, stemSettings]);

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
    if (readyCount === totalStems) {
      setIsPlaying(!isPlaying);
    }
  }, [readyCount, totalStems, isPlaying]);

  if (!hasTwoOrMoreStems) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please select at least two stems from your audio files to start mixing
      </div>
    );
  }

  // Get the first audio file for the master playback
  const masterAudioFile = audioFiles[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={togglePlayback}
          disabled={readyCount !== totalStems}
          className="min-w-[100px]"
        >
          {readyCount !== totalStems ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <><Pause className="h-4 w-4 mr-2" /> Stop</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Play</>
          )}
        </Button>

        <Button 
          className="bg-primary hover:bg-primary/90"
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

      {/* Master playback waveform */}
      {masterAudioFile && (
        <div className="rounded-lg border p-4 mb-4">
          <Waveform 
            audioFile={masterAudioFile}
            playing={isPlaying}
            onReady={handleWaveformReady}
            height={48}
            waveColor="hsl(250 95% 60% / 0.2)"
            progressColor="hsl(250 95% 60%)"
          />
        </div>
      )}

      {/* Individual track waveforms without progress */}
      <div className="rounded-lg border">
        {audioFiles.map((file) => (
          <div key={file.id} className="p-4 border-b last:border-b-0">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">{file.filename}</span>
              <div className="flex items-center gap-4">
                {(stemSettings[file.id]?.extractVocals || stemSettings[file.id]?.extractInstrumental) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Volume</span>
                    <Slider
                      value={[volumes[file.id] * 100]}
                      onValueChange={(value) => updateVolume(file.id, value[0] / 100)}
                      max={100}
                      step={1}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {stemSettings[file.id]?.extractVocals && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Vocals</div>
                  <Waveform 
                    audioFile={file}
                    playing={isPlaying}
                    onReady={handleWaveformReady}
                    waveColor="hsl(250 95% 60% / 0.6)"
                    progressColor="hsl(250 95% 60%)"
                    height={48}
                    hideControls
                    disableProgress
                  />
                </div>
              )}
              {stemSettings[file.id]?.extractInstrumental && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Instrumental</div>
                  <Waveform 
                    audioFile={file}
                    playing={isPlaying}
                    onReady={handleWaveformReady}
                    waveColor="hsl(250 95% 60% / 0.3)"
                    progressColor="hsl(250 95% 60%)"
                    height={48}
                    hideControls
                    disableProgress
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}