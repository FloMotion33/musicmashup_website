import { useState } from "react";
import { Card } from "@/components/ui/card";
import AudioUpload from "@/components/audio-upload";
import Mixer from "@/components/mixer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Music, Trash2, Mic, Music2 } from "lucide-react";
import { type AudioFile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<AudioFile[]>([]);
  const [stemSettings, setStemSettings] = useState<Record<number, {
    extractVocals: boolean;
    extractInstrumental: boolean;
  }>>({});
  const { toast } = useToast();

  const { data: audioFiles = [], isLoading } = useQuery<AudioFile[]>({
    queryKey: ["/api/audio-files"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const res = await fetch(`/api/audio/${fileId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete file');
    },
    onSuccess: (_, deletedFileId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-files"] });
      setSelectedFiles(prev => prev.filter(file => file.id !== deletedFileId));
      setStemSettings(prev => {
        const { [deletedFileId]: _, ...rest } = prev;
        return rest;
      });
      toast({
        title: "File deleted",
        description: "Audio file has been removed"
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Could not delete the audio file",
        variant: "destructive"
      });
    }
  });

  const handleStemSettingsChange = (fileId: number, setting: 'extractVocals' | 'extractInstrumental', value: boolean) => {
    // Update stem settings
    setStemSettings(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [setting]: value
      }
    }));
    
    // Add the file to selected files if not already there
    // This ensures files with selected stems appear in the mixer
    const file = audioFiles?.find((f: AudioFile) => f.id === fileId);
    if (file && !selectedFiles.some(selected => selected.id === fileId)) {
      setSelectedFiles(prev => [...prev, file]);
    }
    
    // If both stems are turned off, remove the file from selection
    if (!value && 
        ((setting === 'extractVocals' && !stemSettings[fileId]?.extractInstrumental) || 
         (setting === 'extractInstrumental' && !stemSettings[fileId]?.extractVocals))) {
      setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const handleUpload = (file: AudioFile) => {
    setSelectedFiles(prev => [...prev, file]);
    setStemSettings(prev => ({
      ...prev,
      [file.id]: {
        extractVocals: false,
        extractInstrumental: false
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background/50 relative">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="p-6 backdrop-blur-sm bg-background/80">
              <h2 className="text-2xl font-semibold mb-4">Upload Audio</h2>
              <AudioUpload onUpload={handleUpload} />

              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading audio files...</p>
                </div>
              ) : audioFiles?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No audio files uploaded yet</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {audioFiles?.map((file: AudioFile) => (
                    <div key={file.id} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/80">
                      <div className="flex items-center gap-4">
                        <Music className="h-5 w-5" />
                        <div className="flex-1">
                          <p className="font-medium truncate max-w-[200px]">{file.filename}</p>
                          <p className="text-sm text-muted-foreground">BPM: {file.bpm}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate(file.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-6 px-4 py-2 rounded-md bg-background/50 border border-border">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`vocals-${file.id}`}
                              checked={stemSettings[file.id]?.extractVocals || false}
                              onCheckedChange={(checked) => handleStemSettingsChange(file.id, 'extractVocals', checked)}
                              className="data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor={`vocals-${file.id}`} className="cursor-pointer flex items-center gap-1.5 font-medium">
                              <Mic className="h-4 w-4" />
                              Vocals
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`instrumental-${file.id}`}
                              checked={stemSettings[file.id]?.extractInstrumental || false}
                              onCheckedChange={(checked) => handleStemSettingsChange(file.id, 'extractInstrumental', checked)}
                              className="data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor={`instrumental-${file.id}`} className="cursor-pointer flex items-center gap-1.5 font-medium">
                              <Music2 className="h-4 w-4" />
                              Instrumental
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 backdrop-blur-sm bg-background/80">
              <h2 className="text-2xl font-semibold mb-4">Mixer</h2>
              <Mixer
                audioFiles={selectedFiles}
                stemSettings={stemSettings}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}