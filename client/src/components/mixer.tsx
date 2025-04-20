import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { type AudioFile } from "@shared/schema";
import { Play, Pause, Save, Loader2, Volume2, VolumeX, Music, Mic } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Waveform from "./waveform";
import AnimatedBackground from "./animated-background";

interface MixerProps {
  audioFiles: AudioFile[];
  stemSettings: Record<number, {
    extractVocals: boolean;
    extractInstrumental: boolean;
  }>;
}

export default function Mixer({ audioFiles, stemSettings }: MixerProps) {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muteStates, setMuteStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  // Count total stems that need to be loaded
  const totalStems = audioFiles.reduce((count, file) => {
    const settings = stemSettings[file.id] || {};
    return count + (settings.extractVocals ? 1 : 0) + (settings.extractInstrumental ? 1 : 0);
  }, 0);

  const hasTwoOrMoreStems = totalStems >= 2;

  // Format time display (mm:ss format)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Initialize volume and mute states for each stem
    const initialVolumes: Record<string, number> = {};
    const initialMuteStates: Record<string, boolean> = {};
    
    audioFiles.forEach(file => {
      if (stemSettings[file.id]?.extractVocals) {
        const stemKey = `${file.id}-vocals`;
        initialVolumes[stemKey] = volumes[stemKey] ?? 1;
        initialMuteStates[stemKey] = false;
      }
      if (stemSettings[file.id]?.extractInstrumental) {
        const stemKey = `${file.id}-instrumental`;
        initialVolumes[stemKey] = volumes[stemKey] ?? 0.64; // Default instrumental a bit lower
        initialMuteStates[stemKey] = false;
      }
    });
    
    setVolumes(initialVolumes);
    setMuteStates(initialMuteStates);
    setIsPlaying(false);
    setReadyCount(0);
    setCurrentTime(0);
    setDuration(5 * 60); // Default 5 minute duration until we get real duration
  }, [audioFiles, stemSettings]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          // Stop at duration
          if (prev >= duration) {
            clearInterval(timerRef.current!);
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, duration]);

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
            extractInstrumental: Object.values(stemSettings).some(s => s.extractInstrumental),
            muteStates
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

  const updateVolume = useCallback((stemKey: string, value: number) => {
    setVolumes(prev => ({
      ...prev,
      [stemKey]: value
    }));
  }, []);

  const handleWaveformReady = useCallback((fileDuration: number) => {
    setReadyCount(count => count + 1);
    // Update duration to the longest track
    setDuration(prev => Math.max(prev, fileDuration));
  }, []);

  const togglePlayback = useCallback(() => {
    if (readyCount === totalStems) {
      setIsPlaying(!isPlaying);
    }
  }, [readyCount, totalStems, isPlaying]);

  const toggleMute = useCallback((stemKey: string) => {
    setMuteStates(prev => ({
      ...prev,
      [stemKey]: !prev[stemKey]
    }));
  }, []);

  // Handle click on progress bar to seek
  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentX = clickX / rect.width;
    const newTime = percentX * duration;
    
    setCurrentTime(newTime);
    
    // Update all waveforms to this position
    document.querySelectorAll('.waveform-container').forEach(el => {
      const event = new CustomEvent('seek', { detail: { position: percentX } });
      el.dispatchEvent(event);
    });
  }, [duration]);

  if (!hasTwoOrMoreStems) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please select at least two stems from your audio files to start mixing
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatedBackground isPlaying={isPlaying} intensity={0.7} />
      
      {/* Play button and time display */}
      <div className="flex items-center justify-start gap-4 pb-2">
        <Button
          size="lg"
          variant="ghost"
          onClick={togglePlayback}
          disabled={readyCount !== totalStems}
          className="text-primary h-16 w-16 rounded-full"
        >
          {readyCount !== totalStems ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : isPlaying ? (
            <Pause className="h-8 w-8 text-primary" />
          ) : (
            <Play className="h-8 w-8 text-primary pl-1" />
          )}
        </Button>
        
        <div className="text-3xl font-bold tracking-widest text-primary">
          {formatTime(currentTime)} <span className="text-muted-foreground text-lg">/ {formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Tracks */}
      <div className="space-y-4">
        {audioFiles.map((file) => (
          <div key={file.id}>
            {stemSettings[file.id]?.extractVocals && (
              <div className="bg-zinc-900/80 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-zinc-400" />
                    <span className="text-zinc-300 font-medium truncate max-w-[150px]">Vocal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMute(`${file.id}-vocals`)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                    >
                      {muteStates[`${file.id}-vocals`] ? 
                        <VolumeX className="h-5 w-5" /> : 
                        <Volume2 className="h-5 w-5" />
                      }
                    </Button>
                  </div>
                </div>
                
                <div className="relative" style={{ opacity: muteStates[`${file.id}-vocals`] ? 0.5 : 1 }}>
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 z-10" 
                    style={{ 
                      left: `${(currentTime / duration) * 100}%`,
                      height: '100%' 
                    }}
                    ref={playheadRef}
                  />
                  <Waveform 
                    audioFile={file}
                    playing={isPlaying && !muteStates[`${file.id}-vocals`]}
                    onReady={handleWaveformReady}
                    waveColor="#6366f1"
                    progressColor="#818cf8"
                    height={60}
                    hideControls
                    currentTime={currentTime}
                  />
                </div>
                
                <div className="mt-2 flex items-center justify-end gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold text-lg bg-indigo-950/50 py-1 px-3 rounded-md">
                      {Math.round(volumes[`${file.id}-vocals`] * 100) || 100}
                    </span>
                  </div>
                  <Slider
                    value={[volumes[`${file.id}-vocals`] * 100 || 100]}
                    onValueChange={(value) => updateVolume(`${file.id}-vocals`, value[0] / 100)}
                    max={100}
                    step={1}
                    className="w-[150px]"
                  />
                </div>
              </div>
            )}
            
            {stemSettings[file.id]?.extractInstrumental && (
              <div className="bg-zinc-900/80 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-zinc-400" />
                    <span className="text-zinc-300 font-medium truncate max-w-[150px]">Instrumental</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMute(`${file.id}-instrumental`)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                    >
                      {muteStates[`${file.id}-instrumental`] ? 
                        <VolumeX className="h-5 w-5" /> : 
                        <Volume2 className="h-5 w-5" />
                      }
                    </Button>
                  </div>
                </div>
                
                <div className="relative" style={{ opacity: muteStates[`${file.id}-instrumental`] ? 0.5 : 1 }}>
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 z-10" 
                    style={{ 
                      left: `${(currentTime / duration) * 100}%`,
                      height: '100%' 
                    }}
                  />
                  <Waveform 
                    audioFile={file}
                    playing={isPlaying && !muteStates[`${file.id}-instrumental`]}
                    onReady={handleWaveformReady}
                    waveColor="#6366f1"
                    progressColor="#818cf8"
                    height={60}
                    hideControls
                    currentTime={currentTime}
                  />
                </div>
                
                <div className="mt-2 flex items-center justify-end gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold text-lg bg-indigo-950/50 py-1 px-3 rounded-md">
                      {Math.round(volumes[`${file.id}-instrumental`] * 100) || 64}
                    </span>
                  </div>
                  <Slider
                    value={[volumes[`${file.id}-instrumental`] * 100 || 64]}
                    onValueChange={(value) => updateVolume(`${file.id}-instrumental`, value[0] / 100)}
                    max={100}
                    step={1}
                    className="w-[150px]"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Clickable progress bar */}
      <div 
        className="relative h-1 bg-zinc-800 rounded-full overflow-hidden mt-2 cursor-pointer"
        ref={progressBarRef}
        onClick={handleProgressBarClick}
      >
        <div
          className="absolute h-full bg-indigo-500 transition-all"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      {/* Save button */}
      <Button 
        className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg mt-4"
        onClick={() => mixMutation.mutate()}
        disabled={mixMutation.isPending}
      >
        {mixMutation.isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </div>
        ) : (
          <>
            <Save className="mr-2 h-5 w-5" />
            Save Mashup
          </>
        )}
      </Button>
    </div>
  );
}