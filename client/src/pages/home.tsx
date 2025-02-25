import { useState } from "react";
import { Card } from "@/components/ui/card";
import AudioUpload from "@/components/audio-upload";
import Mixer from "@/components/mixer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Music, Trash2 } from "lucide-react";
import { type AudioFile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<AudioFile[]>([]);
  const { toast } = useToast();

  const { data: audioFiles, isLoading } = useQuery({
    queryKey: ["/api/audio-files"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const res = await fetch(`/api/audio/${fileId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete file');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-files"] });
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            MusicMashup
          </h1>
          <p className="text-muted-foreground">
            Create unique mashups by mixing your favorite tracks
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Upload Audio</h2>
            <AudioUpload onUpload={(file) => setSelectedFiles([...selectedFiles, file])} />

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
                  <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                    <Music className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium">{file.filename}</p>
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
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Mixer</h2>
            {selectedFiles.length > 0 ? (
              <Mixer audioFiles={selectedFiles} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select audio files to start mixing
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}