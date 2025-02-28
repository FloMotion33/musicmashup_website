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

        print("Loading model...", file=sys.stderr)
        # Load model
        model = get_model('htdemucs')
        model.eval()
        if torch.cuda.is_available():
            model.cuda()

        print("Processing audio...", file=sys.stderr)
        # Load and separate
        wav = model.load_track(wav_path)
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()

        # Apply the model
        sources = apply_model(model, wav.unsqueeze(0), device='cuda' if torch.cuda.is_available() else 'cpu')[0]
        sources = sources * ref.std() + ref.mean()

        print("Exporting stems...", file=sys.stderr)
        # Export each stem
        stem_paths = {}
        stems = ['vocals', 'drums', 'bass', 'other']

        for i, source in enumerate(sources):
            stem_name = stems[i]
            source = source.cpu().numpy()

            # Create a unique filename in the temp directory
            temp_stem = tempfile.NamedTemporaryFile(suffix=f'_{stem_name}.mp3', delete=False)

            # Convert source to the correct format for pydub
            # Ensure the audio data is in the correct shape and format
            source = source.T  # Transpose to get channels last
            source = source * 32768  # Scale to 16-bit integer range
            source = source.astype(np.int16)

            # Create AudioSegment
            source_audio = AudioSegment(
                source.tobytes(), 
                frame_rate=44100,
                sample_width=2,  # 16-bit audio
                channels=2
            )

            # Export to MP3
            source_audio.export(temp_stem.name, format='mp3', parameters=["-q:a", "0"])
            stem_paths[stem_name] = os.path.basename(temp_stem.name)

        print(json.dumps(stem_paths))
        return stem_paths

    except Exception as e:
        print(f"Error in stem separation: {str(e)}", file=sys.stderr)
        return None
    finally:
        # Clean up temporary wav file
        if 'wav_path' in locals():
            try:
                os.unlink(wav_path)
            except:
                pass

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python stem_separator.py <audio_file>", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    separate_stems(audio_path)