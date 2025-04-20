import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type AudioFile } from "@shared/schema";
import { Play, Pause, Save, Loader2, Volume2, Volume1, VolumeX, Music, Mic, Sliders } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Waveform from "./waveform";
import AnimatedBackground from "./animated-background";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [currentTime, setCurrentTime] = useState(0);
  const [soloMode, setSoloMode] = useState<number | null>(null);
  const [muteStates, setMuteStates] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("tracks");
  const { toast } = useToast();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Count total stems that need to be loaded
  const totalStems = audioFiles.reduce((count, file) => {
    const settings = stemSettings[file.id] || {};
    return count + (settings.extractVocals ? 1 : 0) + (settings.extractInstrumental ? 1 : 0);
  }, 0);

  const hasTwoOrMoreStems = totalStems >= 2;

  useEffect(() => {
    // Initialize volumes
    setVolumes(prev => {
      const newVolumes: Record<number, number> = {};
      audioFiles.forEach(file => {
        newVolumes[file.id] = prev[file.id] ?? 1;
      });
      return newVolumes;
    });

    // Initialize mute states for each track + stem
    const initialMuteStates: Record<string, boolean> = {};
    audioFiles.forEach(file => {
      if (stemSettings[file.id]?.extractVocals) {
        initialMuteStates[`${file.id}-vocals`] = false;
      }
      if (stemSettings[file.id]?.extractInstrumental) {
        initialMuteStates[`${file.id}-instrumental`] = false;
      }
    });
    setMuteStates(initialMuteStates);

    setIsPlaying(false);
    setReadyCount(0);
    setSoloMode(null);
  }, [audioFiles, stemSettings]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => prev + 0.1);
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
  }, [isPlaying]);

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

  const toggleMute = useCallback((stemKey: string) => {
    setMuteStates(prev => ({
      ...prev,
      [stemKey]: !prev[stemKey]
    }));
  }, []);

  const toggleSolo = useCallback((trackId: number) => {
    if (soloMode === trackId) {
      // Turn off solo mode
      setSoloMode(null);
    } else {
      // Turn on solo mode for this track
      setSoloMode(trackId);
    }
  }, [soloMode]);

  const getVolumeIcon = useCallback((stemKey: string) => {
    if (muteStates[stemKey]) {
      return <VolumeX className="h-4 w-4" />;
    } else if (volumes[parseInt(stemKey.split('-')[0])] < 0.5) {
      return <Volume1 className="h-4 w-4" />;
    } else {
      return <Volume2 className="h-4 w-4" />;
    }
  }, [muteStates, volumes]);

  const getStemStyle = useCallback((stemKey: string) => {
    const [fileId, stemType] = stemKey.split('-');
    
    // Check if this track should be dimmed because of solo mode
    if (soloMode !== null && parseInt(fileId) !== soloMode) {
      return { opacity: 0.4 };
    }
    
    // Check if this stem is muted
    if (muteStates[stemKey]) {
      return { opacity: 0.5 };
    }
    
    return {};
  }, [soloMode, muteStates]);

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
      
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            onClick={togglePlayback}
            disabled={readyCount !== totalStems}
            className="min-w-[80px]"
          >
            {readyCount !== totalStems ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <><Pause className="h-4 w-4 mr-2" /> Stop</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Play</>
            )}
          </Button>
          
          <TabsList className="grid grid-cols-2 w-[200px]">
            <TabsTrigger 
              value="tracks" 
              onClick={() => setActiveTab("tracks")}
              className={activeTab === "tracks" ? "bg-primary text-primary-foreground" : ""}
            >
              Tracks
            </TabsTrigger>
            <TabsTrigger 
              value="mixer" 
              onClick={() => setActiveTab("mixer")}
              className={activeTab === "mixer" ? "bg-primary text-primary-foreground" : ""}
            >
              Mixer
            </TabsTrigger>
          </TabsList>
        </div>

        <Button 
          className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
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

      {/* Master timeline/progress */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mt-2" ref={progressBarRef}>
        <div
          className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all"
          style={{ width: `${(currentTime / 100) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "tracks" ? (
          <div className="border rounded-lg bg-background/5 overflow-hidden">
            {audioFiles.map((file) => (
              <Card key={file.id} className="mb-4 border-0 rounded-none shadow-none">
                <div className="p-4 bg-card hover:bg-muted/10 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-muted/20">
                        Track {file.id}
                      </Badge>
                      <h3 className="font-semibold">{file.filename}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={soloMode === file.id ? "default" : "outline"} 
                        size="sm"
                        onClick={() => toggleSolo(file.id)}
                      >
                        Solo
                      </Button>
                      <Slider
                        value={[volumes[file.id] * 100]}
                        onValueChange={(value) => updateVolume(file.id, value[0] / 100)}
                        max={100}
                        step={1}
                        className="w-[120px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  {stemSettings[file.id]?.extractVocals && (
                    <div className="relative" style={getStemStyle(`${file.id}-vocals`)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">Vocals</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMute(`${file.id}-vocals`)}
                          className="h-8 w-8 p-0"
                        >
                          {getVolumeIcon(`${file.id}-vocals`)}
                        </Button>
                      </div>
                      <Waveform 
                        audioFile={file}
                        playing={isPlaying && !muteStates[`${file.id}-vocals`] && (soloMode === null || soloMode === file.id)}
                        onReady={handleWaveformReady}
                        waveColor="rgba(168, 85, 247, 0.6)" // Purple
                        progressColor="rgba(168, 85, 247, 0.9)"
                        height={64}
                        hideControls
                      />
                    </div>
                  )}
                  
                  {stemSettings[file.id]?.extractInstrumental && (
                    <div className="relative" style={getStemStyle(`${file.id}-instrumental`)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm font-medium">Instrumental</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMute(`${file.id}-instrumental`)}
                          className="h-8 w-8 p-0"
                        >
                          {getVolumeIcon(`${file.id}-instrumental`)}
                        </Button>
                      </div>
                      <Waveform 
                        audioFile={file}
                        playing={isPlaying && !muteStates[`${file.id}-instrumental`] && (soloMode === null || soloMode === file.id)}
                        onReady={handleWaveformReady}
                        waveColor="rgba(79, 70, 229, 0.4)" // Indigo
                        progressColor="rgba(79, 70, 229, 0.8)"
                        height={64}
                        hideControls
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg bg-background/5 p-6">
            <h3 className="font-semibold flex items-center mb-6">
              <Sliders className="mr-2 h-5 w-5" />
              Mixer Controls
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {audioFiles.map((file) => (
                <div key={file.id} className="space-y-4 border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{file.filename}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={soloMode === file.id}
                        onCheckedChange={() => toggleSolo(file.id)}
                      />
                      <Label>Solo</Label>
                    </div>
                  </div>
                  
                  {stemSettings[file.id]?.extractVocals && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Vocals</span>
                        <Switch
                          checked={!muteStates[`${file.id}-vocals`]}
                          onCheckedChange={() => toggleMute(`${file.id}-vocals`)}
                        />
                      </div>
                      <Slider
                        value={[volumes[file.id] * 100]}
                        onValueChange={(value) => updateVolume(file.id, value[0] / 100)}
                        max={100}
                        step={1}
                        disabled={muteStates[`${file.id}-vocals`]}
                      />
                    </div>
                  )}
                  
                  {stemSettings[file.id]?.extractInstrumental && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Instrumental</span>
                        <Switch
                          checked={!muteStates[`${file.id}-instrumental`]}
                          onCheckedChange={() => toggleMute(`${file.id}-instrumental`)}
                        />
                      </div>
                      <Slider
                        value={[volumes[file.id] * 100]}
                        onValueChange={(value) => updateVolume(file.id, value[0] / 100)}
                        max={100}
                        step={1}
                        disabled={muteStates[`${file.id}-instrumental`]}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}