import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type AudioFile } from "@shared/schema";

interface AudioUploadProps {
  onUpload: (file: AudioFile) => void;
}

export default function AudioUpload({ onUpload }: AudioUploadProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

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

  const [totalFiles, setTotalFiles] = useState<File[]>([]);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploadingFiles = new Set(uploadingFiles);
    setTotalFiles(acceptedFiles);

    for (const file of acceptedFiles) {
      newUploadingFiles.add(file.name);
      setUploadingFiles(newUploadingFiles);

      try {
        await uploadMutation.mutateAsync(file);
      } finally {
        newUploadingFiles.delete(file.name);
        setUploadingFiles(new Set(newUploadingFiles));
      }
    }
  }, [uploadMutation, uploadingFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav']
    },
    multiple: true
  });

  const isUploading = uploadingFiles.size > 0;

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted'}`}
    >
      <input {...getInputProps()} />
      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <div className="space-y-2">
        <p className="font-medium">
          {isDragActive ? "Drop the audio files here" : "Drag & drop audio files"}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports multiple MP3 and WAV files
        </p>
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">
              Uploading {acceptedFiles.length} file(s)...
            </p>
          </div>
        ) : (
          <Button variant="outline" disabled={isUploading}>
            Select Files
          </Button>
        )}
      </div>
    </div>
  );
}