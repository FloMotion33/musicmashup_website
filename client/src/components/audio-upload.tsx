import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, Mic, Music2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type AudioFile } from "@shared/schema";

interface AudioUploadProps {
  onUpload: (file: AudioFile) => void;
  stemSettings: Record<number, {
    extractVocals: boolean;
    extractInstrumental: boolean;
  }>;
  onStemSettingsChange: (id: number, setting: 'extractVocals' | 'extractInstrumental', value: boolean) => void;
}

export default function AudioUpload({ onUpload, stemSettings, onStemSettingsChange }: AudioUploadProps) {
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-files"] });
      onUpload(data);
      toast({
        title: "Upload successful",
        description: "Audio file has been processed"
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav']
    },
    maxFiles: 1
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors hover:border-primary
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <p className="font-medium">
            {isDragActive ? "Drop the audio file here" : "Drag & drop an audio file"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports MP3 and WAV formats
          </p>
          <Button variant="outline" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading..." : "Select File"}
          </Button>
        </div>
      </div>

      <div className="bg-background/5 p-4 rounded-lg border border-border/50">
        <h3 className="font-medium mb-3">Stem Separation Settings</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="extract-vocals-default"
              checked={stemSettings[-1]?.extractVocals || false}
              onCheckedChange={(checked) => onStemSettingsChange(-1, 'extractVocals', checked)}
            />
            <Label htmlFor="extract-vocals-default" className="cursor-pointer flex items-center gap-1.5">
              <Mic className="h-4 w-4" />
              Extract Vocals
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="extract-instrumental-default"
              checked={stemSettings[-1]?.extractInstrumental || false}
              onCheckedChange={(checked) => onStemSettingsChange(-1, 'extractInstrumental', checked)}
            />
            <Label htmlFor="extract-instrumental-default" className="cursor-pointer flex items-center gap-1.5">
              <Music2 className="h-4 w-4" />
              Extract Instrumental
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}