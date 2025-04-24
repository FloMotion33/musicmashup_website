import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { type AudioFile } from "@shared/schema";
import { Upload, BarChart2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AudioUpload from "@/components/audio-upload";

export default function BpmDetection() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const { toast } = useToast();

  const handleUpload = (file: AudioFile) => {
    setAudioFiles(prev => [...prev, file]);
    
    toast({
      title: "File uploaded",
      description: `Successfully detected BPM: ${file.bpm || "Unknown"}`,
    });
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
                <AudioUpload onUpload={handleUpload} />
              </div>
              
              {/* Results area */}
              {audioFiles.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BarChart2 className="mr-2 h-5 w-5 text-indigo-500" /> 
                    Detection Results
                  </h3>
                  
                  <div className="divide-y divide-zinc-800">
                    {audioFiles.map((file) => (
                      <div key={file.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-indigo-600/20 rounded-full flex items-center justify-center">
                            <BarChart2 className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-sm">{file.filename}</p>
                            <p className="text-xs text-zinc-400">Uploaded {new Date().toLocaleTimeString()}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div>
                            <p className="text-2xl font-mono font-bold text-indigo-400">
                              {file.bpm ? `${file.bpm} BPM` : "Unknown BPM"}
                            </p>
                            <p className="text-lg font-mono font-medium text-purple-400">
                              {file.key ? file.key : "Analyzing key..."}
                            </p>
                          </div>
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