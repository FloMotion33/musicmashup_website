import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { type AudioFile } from "@shared/schema";
import { Upload, Music, Mic, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AudioUpload from "@/components/audio-upload";
import Waveform from "@/components/waveform";

export default function VocalRemover() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessedFiles, setHasProcessedFiles] = useState(false);
  const { toast } = useToast();

  const processMutation = useMutation({
    mutationFn: async (file: AudioFile) => {
      // In a real implementation, this would call a backend API to process the file
      // For this prototype, we'll simulate processing
      setIsProcessing(true);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsProcessing(false);
      setHasProcessedFiles(true);
      
      return {
        vocals: {
          ...file,
          id: file.id + 1000, // Simulate different IDs for the separated stems
          filename: file.filename.replace('.mp3', '_vocals.mp3')
        },
        instrumental: {
          ...file,
          id: file.id + 2000,
          filename: file.filename.replace('.mp3', '_instrumental.mp3')
        }
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Separation complete",
        description: "Vocals and instrumental tracks have been extracted successfully",
      });
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Separation failed",
        description: "There was an error processing your audio file",
        variant: "destructive"
      });
    }
  });

  const handleUpload = (file: AudioFile) => {
    setAudioFiles([file]); // Replace any existing file
    setHasProcessedFiles(false); // Reset processed state
    
    toast({
      title: "File uploaded",
      description: "Your audio file is ready for vocal separation",
    });
  };

  const handleProcess = () => {
    if (audioFiles.length > 0) {
      processMutation.mutate(audioFiles[0]);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto">
        <Card className="w-full bg-zinc-950 border-zinc-800 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Vocal Remover</CardTitle>
            <CardDescription className="text-zinc-400">
              Separate vocals from instrumental tracks using advanced AI technology
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Upload area */}
              <div className="bg-zinc-900/60 rounded-lg p-8 text-center">
                {audioFiles.length === 0 ? (
                  <AudioUpload onUpload={handleUpload} />
                ) : (
                  <div className="space-y-4">
                    <div className="bg-zinc-900 rounded-lg p-4">
                      <div className="font-medium text-sm mb-2 flex items-center">
                        <Music className="h-4 w-4 mr-2 text-indigo-400" />
                        {audioFiles[0].filename}
                      </div>
                      <Waveform 
                        audioFile={audioFiles[0]}
                        waveColor="#5D5FEF"
                        progressColor="#8A8BFF"
                        height={80}
                      />
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setAudioFiles([])}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                      >
                        Upload Different File
                      </Button>
                      
                      <Button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Separate Vocals
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Results area */}
              {hasProcessedFiles && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Music className="mr-2 h-5 w-5 text-indigo-500" /> 
                    Separated Tracks
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Vocals track */}
                    <div className="bg-zinc-900 rounded-lg p-4">
                      <div className="font-medium text-sm mb-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <Mic className="h-4 w-4 mr-2 text-indigo-400" />
                          Vocals
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="bg-zinc-800/50 h-16 rounded flex items-center justify-center">
                        <span className="text-xs text-zinc-500">Waveform visualization</span>
                      </div>
                    </div>
                    
                    {/* Instrumental track */}
                    <div className="bg-zinc-900 rounded-lg p-4">
                      <div className="font-medium text-sm mb-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <Music className="h-4 w-4 mr-2 text-indigo-400" />
                          Instrumental
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="bg-zinc-800/50 h-16 rounded flex items-center justify-center">
                        <span className="text-xs text-zinc-500">Waveform visualization</span>
                      </div>
                    </div>
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