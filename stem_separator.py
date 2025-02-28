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
        print("Converting audio to WAV...", file=sys.stderr)
        audio = AudioSegment.from_file(audio_path)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            audio.export(temp_wav.name, format='wav')
            wav_path = temp_wav.name

        print("Loading Demucs model...", file=sys.stderr)
        model = get_model('htdemucs')
        model.eval()
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        if device == 'cuda':
            model.cuda()
        print(f"Using device: {device}", file=sys.stderr)

        print("Processing audio...", file=sys.stderr)
        wav = model.load_track(wav_path)
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()

        print("Applying model for stem separation...", file=sys.stderr)
        sources = apply_model(model, wav.unsqueeze(0), device=device)[0]
        sources = sources * ref.std() + ref.mean()

        print("Exporting stems...", file=sys.stderr)
        stem_paths = {}
        stems = ['vocals', 'drums', 'bass', 'other']

        for i, source in enumerate(sources):
            stem_name = stems[i]
            print(f"Processing {stem_name}...", file=sys.stderr)

            source = source.cpu().numpy()
            source = source.T
            source = source * 32768
            source = source.astype(np.int16)

            # Create unique filename in temp directory
            temp_stem = tempfile.NamedTemporaryFile(suffix=f'_{stem_name}.mp3', delete=False)

            # Create AudioSegment and export
            source_audio = AudioSegment(
                source.tobytes(),
                frame_rate=44100,
                sample_width=2,
                channels=2
            )

            source_audio.export(
                temp_stem.name,
                format='mp3',
                parameters=["-q:a", "0"]
            )

            stem_paths[stem_name] = os.path.basename(temp_stem.name)

        print("Stem separation complete!", file=sys.stderr)
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
            except Exception as e:
                print(f"Error cleaning up temp file: {str(e)}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python stem_separator.py <audio_file>", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(f"Error: File not found: {audio_path}", file=sys.stderr)
        sys.exit(1)

    separate_stems(audio_path)