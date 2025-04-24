import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { type AudioFile } from "@shared/schema";
import { Play, Pause, Save, Loader2, Volume2, VolumeX, Music, Mic, ChevronLeft, ChevronRight } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const waveformsRef = useRef<HTMLDivElement>(null);

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
        initialVolumes[stemKey] = 1; // 100% volume
        initialMuteStates[stemKey] = false;
      }
      if (stemSettings[file.id]?.extractInstrumental) {
        const stemKey = `${file.id}-instrumental`;
        initialVolumes[stemKey] = 0.64; // 64% volume for instrumental as shown in mockup
        initialMuteStates[stemKey] = false;
      }
    });

    setVolumes(initialVolumes);
    setMuteStates(initialMuteStates);
    setIsPlaying(false);
    setReadyCount(0);
    setCurrentTime(0);
    setDuration(0.1); // Will be updated with actual durations
  }, [audioFiles, stemSettings]);

  // Synchronize playback across all waveforms
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
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

  // Handle click anywhere in the waveform area to seek
  const handleWaveformClick = useCallback((e: React.MouseEvent) => {
    if (!waveformsRef.current || !duration) return;

    const rect = waveformsRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentX = clickX / rect.width;
    const newTime = percentX * duration;

    // Set the current time
    setCurrentTime(newTime);

    // Notify all waveforms to seek to this position
    document.querySelectorAll('.waveform-container').forEach(el => {
      const event = new CustomEvent('seek', { detail: { position: percentX } });
      el.dispatchEvent(event);
    });
  }, [duration]);

  // State to track timing offsets for each stem (for track alignment)
  const [timeOffsets, setTimeOffsets] = useState<Record<string, number>>({});

  // Button handlers to move tracks forward/backward by one bar
  const moveTrackForward = useCallback((stemKey: string) => {
    setTimeOffsets(prev => ({
      ...prev,
      [stemKey]: (prev[stemKey] || 0) + 0.25 // Move forward 1/4 of a second (approx one bar)
    }));
  }, []);

  const moveTrackBackward = useCallback((stemKey: string) => {
    setTimeOffsets(prev => ({
      ...prev,
      [stemKey]: Math.max(0, (prev[stemKey] || 0) - 0.25) // Move backward, minimum 0
    }));
  }, []);

  if (!hasTwoOrMoreStems) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please select at least two stems from your audio files to start mixing
      </div>
    );
  }

  return (
    <div 
      className="relative rounded-xl overflow-hidden bg-black"
      ref={containerRef}
    >
      {/* Full-width background animation */}
      <AnimatedBackground isPlaying={isPlaying} intensity={0.7} />

      <div className="p-3 space-y-4 relative z-10">
        {/* Play button and time display */}
        <div className="flex items-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlayback}
            disabled={readyCount !== totalStems}
            className="flex h-12 w-12 rounded-lg bg-indigo-700/90 hover:bg-indigo-600 text-white border-none mr-2"
          >
            {readyCount !== totalStems ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          <div className="font-mono text-xl font-bold text-white">
            {formatTime(currentTime)}
            <span className="text-zinc-400 text-sm ml-1">/ {formatTime(duration)}</span>
          </div>
        </div>

        {/* Track waveforms with single vertical playhead */}
        <div 
          className="relative cursor-pointer" 
          ref={waveformsRef}
          onClick={handleWaveformClick}
        >
          {/* Vertical playhead overlay (shared across all tracks) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-30 pointer-events-none" 
            style={{ 
              left: `${(currentTime / duration) * 100}%`,
              height: '100%' 
            }}
            ref={playheadRef}
          />

          {/* Tracks */}
          <div className="space-y-3">
            {audioFiles.map((file) => (
              <div key={file.id}>
                {stemSettings[file.id]?.extractVocals && (
                  <div className="bg-zinc-900/80 rounded-lg p-3 mb-3">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-300 text-sm truncate max-w-[80px]">Vocal</span>
                      </div>
                    </div>

                    {/* Main container with waveform and controls side by side */}
                    <div className="flex items-stretch gap-2">
                      {/* Waveform container */}
                      <div 
                        className="flex-grow relative" 
                        style={{ opacity: muteStates[`${file.id}-vocals`] ? 0.5 : 1 }}
                      >
                        <Waveform 
                          audioFile={file}
                          playing={isPlaying && !muteStates[`${file.id}-vocals`]}
                          onReady={handleWaveformReady}
                          waveColor="#5D5FEF"
                          progressColor="transparent" 
                          height={50}
                          hideControls
                          currentTime={currentTime}
                          timeOffset={timeOffsets[`${file.id}-vocals`] || 0}
                        />
                      </div>

                      {/* Controls stacked vertically on the right */}
                      <div className="w-20 flex flex-col items-center justify-between gap-2">
                        {/* Mute button at top */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMute(`${file.id}-vocals`)}
                          className="h-8 w-8 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center"
                        >
                          {muteStates[`${file.id}-vocals`] ? 
                            <VolumeX className="h-4 w-4 text-zinc-400" /> : 
                            <Volume2 className="h-4 w-4 text-zinc-400" />
                          }
                        </Button>

                        {/* Volume display and slider */}
                        <div className="flex flex-col items-center w-full">
                          <div className="w-16 h-10 bg-indigo-600 rounded-md flex items-center justify-center font-mono text-white font-bold mb-1">
                            {Math.round(volumes[`${file.id}-vocals`] * 100)}
                          </div>
                          
                          {/* Interactive volume slider */}
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={Math.round(volumes[`${file.id}-vocals`] * 100)} 
                            onChange={(e) => updateVolume(`${file.id}-vocals`, Number(e.target.value) / 100)}
                            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            style={{
                              accentColor: '#5D5FEF',
                              WebkitAppearance: 'none',
                              outline: 'none'
                            }}
                          />
                        </div>

                        {/* Track alignment buttons at bottom */}
                        <div className="w-full flex justify-center gap-2 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveTrackBackward(`${file.id}-vocals`)}
                            className="p-1.5 h-8 w-8 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center"
                            title="Shift track backward by one bar"
                          >
                            <ChevronLeft className="h-4 w-4 text-zinc-300" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveTrackForward(`${file.id}-vocals`)}
                            className="p-1.5 h-8 w-8 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center"
                            title="Shift track forward by one bar"
                          >
                            <ChevronRight className="h-4 w-4 text-zinc-300" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stemSettings[file.id]?.extractInstrumental && (
                  <div className="bg-zinc-900/80 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-300 text-sm truncate max-w-[80px]">Instrumental</span>
                      </div>
                    </div>

                    {/* Main container with waveform and controls side by side */}
                    <div className="flex items-stretch gap-2">
                      {/* Waveform container */}
                      <div 
                        className="flex-grow relative" 
                        style={{ opacity: muteStates[`${file.id}-instrumental`] ? 0.5 : 1 }}
                      >
                        <Waveform 
                          audioFile={file}
                          playing={isPlaying && !muteStates[`${file.id}-instrumental`]}
                          onReady={handleWaveformReady}
                          waveColor="#5D5FEF"
                          progressColor="transparent"
                          height={50}
                          hideControls
                          currentTime={currentTime}
                          timeOffset={timeOffsets[`${file.id}-instrumental`] || 0}
                        />
                      </div>

                      {/* Controls stacked vertically on the right */}
                      <div className="w-20 flex flex-col items-center justify-between gap-2">
                        {/* Mute button at top */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMute(`${file.id}-instrumental`)}
                          className="h-8 w-8 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center"
                        >
                          {muteStates[`${file.id}-instrumental`] ? 
                            <VolumeX className="h-4 w-4 text-zinc-400" /> : 
                            <Volume2 className="h-4 w-4 text-zinc-400" />
                          }
                        </Button>

                        {/* Volume display and slider */}
                        <div className="flex flex-col items-center w-full">
                          <div className="w-16 h-10 bg-indigo-600 rounded-md flex items-center justify-center font-mono text-white font-bold mb-1">
                            {Math.round(volumes[`${file.id}-instrumental`] * 100)}
                          </div>
                          
                          {/* Interactive volume slider */}
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={Math.round(volumes[`${file.id}-instrumental`] * 100)} 
                            onChange={(e) => updateVolume(`${file.id}-instrumental`, Number(e.target.value) / 100)}
                            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            style={{
                              accentColor: '#5D5FEF',
                              WebkitAppearance: 'none',
                              outline: 'none'
                            }}
                          />
                        </div>

                        {/* Track alignment buttons at bottom */}
                        <div className="w-full flex justify-center gap-2 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveTrackBackward(`${file.id}-instrumental`)}
                            className="p-1.5 h-8 w-8 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center"
                            title="Shift track backward by one bar"
                          >
                            <ChevronLeft className="h-4 w-4 text-zinc-300" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveTrackForward(`${file.id}-instrumental`)}
                            className="p-1.5 h-8 w-8 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center"
                            title="Shift track forward by one bar"
                          >
                            <ChevronRight className="h-4 w-4 text-zinc-300" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 mt-3 rounded-lg"
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
    </div>
  );
}