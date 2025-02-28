import torch
import os
import tempfile
from demucs.pretrained import get_model
from demucs.apply import apply_model
import numpy as np
from pydub import AudioSegment

class StemSeparator:
    def __init__(self):
        self.model = get_model('htdemucs')
        self.model.eval()
        if torch.cuda.is_available():
            self.model.cuda()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    def separate_stems(self, audio_path):
        """
        Separate an audio file into stems (vocals, drums, bass, other)
        Returns paths to the separated audio files
        """
        try:
            # Convert input to wav if needed
            audio = AudioSegment.from_file(audio_path)
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                audio.export(temp_wav.name, format='wav')
                wav_path = temp_wav.name

            # Load and separate
            self.model.cpu()
            wav = self.model.load_track(wav_path)
            ref = wav.mean(0)
            wav = (wav - ref.mean()) / ref.std()
            
            # Apply the model
            sources = apply_model(self.model, wav.unsqueeze(0), device=self.device, progress=True)[0]
            sources = sources * ref.std() + ref.mean()

            # Export each stem
            stem_paths = {}
            stems = ['vocals', 'drums', 'bass', 'other']
            for i, source in enumerate(sources):
                stem_name = stems[i]
                source = source.cpu().numpy()
                
                # Convert to audio segment
                source_audio = AudioSegment(
                    source.tobytes(), 
                    frame_rate=44100,
                    sample_width=2, 
                    channels=2
                )
                
                # Export to temporary file
                temp_stem = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
                source_audio.export(temp_stem.name, format='mp3')
                stem_paths[stem_name] = temp_stem.name

            return stem_paths

        except Exception as e:
            print(f"Error in stem separation: {e}")
            return None
        finally:
            # Cleanup temporary wav file
            if 'wav_path' in locals():
                try:
                    os.unlink(wav_path)
                except:
                    pass
