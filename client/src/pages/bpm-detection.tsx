import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { type AudioFile } from "@shared/schema";
import { Upload, BarChart2, Music, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Create a custom audio upload component specific to BPM detection
// that doesn't add files to the main application state
function BpmAudioUpload({ onUpload }: { onUpload: (file: AudioFile) => void }) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

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
      // Don't invalidate global query cache
      // Just pass the file data to the parent component
      onUpload(data);
      
      toast({
        title: "Analysis complete",
        description: "Audio file has been analyzed"
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Please try again with a different file",
        variant: "destructive"
      });
    }
  });

  // Function to generate a mock musical key for demonstration
  function getMockKey(bpm: number | null): string {
    if (!bpm) return "Unknown";
    
    // Simple algorithm to assign keys based on BPM ranges
    const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const modes = ["Major", "Minor"];
    
    const keyIndex = Math.floor((bpm % 12));
    const modeIndex = Math.floor(bpm / 100) % 2;
    
    return `${keys[keyIndex]} ${modes[modeIndex]}`;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(files[0]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary">
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept="audio/*" 
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <p className="font-medium">
            Drop an audio file or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Supports MP3, WAV, and other audio formats
          </p>
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Analyzing audio...
              </p>
            </div>
          ) : (
            <Button variant="outline" disabled={isUploading}>
              Select File
            </Button>
          )}
        </div>
      </label>
    </div>
  );
}

export default function BpmDetection() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const { toast } = useToast();

  const handleUpload = (file: AudioFile) => {
    setAudioFiles(prev => [...prev, file]);
    
    toast({
      title: "Analysis complete",
      description: `Detected BPM: ${file.bpm || "Unknown"}, Key: ${file.key || "Unknown"}`,
    });
  };
  
  const handleRemoveFile = (id: number) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto">
        <Card className="w-full bg-zinc-950 border-zinc-800 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">BPM and Key Detection</CardTitle>
            <CardDescription className="text-zinc-400">
              Upload any audio file to automatically detect its beats per minute (BPM) and musical key
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Upload area */}
              <div className="bg-zinc-900/60 rounded-lg p-8 text-center">
                <BpmAudioUpload onUpload={handleUpload} />
              </div>
              
              {/* Results area */}
              {audioFiles.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Music className="mr-2 h-5 w-5 text-indigo-500" /> 
                    Uploaded Tracks
                  </h3>
                  
                  <div className="divide-y divide-zinc-800">
                    {audioFiles.map((file) => (
                      <div key={file.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-indigo-600/20 rounded-full flex items-center justify-center">
                            <Music className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-sm">{file.filename}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <div>
                              <p className="text-2xl font-mono font-bold text-indigo-400">
                                {file.bpm ? `${file.bpm} BPM` : "Unknown BPM"}
                              </p>
                              <p className="text-lg font-mono font-medium text-purple-400">
                                {file.key || "Unknown Key"}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(file.id)}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}