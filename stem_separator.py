import torch
import os
import tempfile
import json
import sys
from demucs.pretrained import get_model
from demucs.apply import apply_model
import numpy as np
from pydub import AudioSegment

def separate_stems(audio_path):
    """
    Separate an audio file into stems using Demucs.
    Returns paths to the separated audio files.
    """
    try:
        # Convert input to wav if needed
        audio = AudioSegment.from_file(audio_path)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            audio.export(temp_wav.name, format='wav')
            wav_path = temp_wav.name

        # Load model
        model = get_model('htdemucs')
        model.eval()
        if torch.cuda.is_available():
            model.cuda()

        # Load and separate
        wav = model.load_track(wav_path)
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()

        # Apply the model
        sources = apply_model(model, wav.unsqueeze(0), device='cuda' if torch.cuda.is_available() else 'cpu')[0]
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

        print(json.dumps(stem_paths))
        return stem_paths

    except Exception as e:
        print(f"Error in stem separation: {e}", file=sys.stderr)
        return None
    finally:
        if 'wav_path' in locals():
            try:
                os.unlink(wav_path)
            except:
                pass

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python stem_separator.py <audio_file>", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    separate_stems(audio_path)