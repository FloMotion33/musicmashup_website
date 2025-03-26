import { useState, useEffect } from 'react';

export function useAudioAnalysis(wavesurfer: any) {
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    if (!wavesurfer) return;

    const analyzeAudio = () => {
      if (!wavesurfer.isPlaying()) return;
      
      // Get audio data from wavesurfer
      const audioData = wavesurfer.backend.getPeaks(100);
      if (!audioData) return;
      
      // Calculate current amplitude (average of absolute values)
      const currentAmplitude = audioData.reduce((sum: number, val: number) => sum + Math.abs(val), 0) / audioData.length;
      setAmplitude(currentAmplitude);
    };

    // Analyze audio every 100ms while playing
    const interval = setInterval(analyzeAudio, 100);

    return () => clearInterval(interval);
  }, [wavesurfer]);

  return amplitude;
}
