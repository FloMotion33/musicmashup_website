import os
from pydub import AudioSegment

def mix_audio_files(file_paths, volumes, output_path):
    """
    Mix multiple audio files with specified volumes.
    
    Args:
        file_paths: List of paths to audio files
        volumes: Dictionary mapping file indices to volume levels (0-1)
        output_path: Path to save the mixed audio
    """
    try:
        mixed = None
        for i, path in enumerate(file_paths):
            # Load audio and apply volume
            audio = AudioSegment.from_file(path)
            volume_db = 20 * volumes.get(i, 1.0)  # Convert to dB
            
            if mixed is None:
                mixed = audio.apply_gain(volume_db)
            else:
                mixed = mixed.overlay(audio.apply_gain(volume_db))
        
        if mixed:
            # Export mixed audio
            mixed.export(output_path, format='mp3')
            return True
    except Exception as e:
        print(f"Error mixing audio: {e}")
        return False

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) != 4:
        print("Usage: python audio_processor.py <files_json> <volumes_json> <output_path>")
        sys.exit(1)
    
    files = json.loads(sys.argv[1])
    volumes = json.loads(sys.argv[2])
    output_path = sys.argv[3]
    
    success = mix_audio_files(files, volumes, output_path)
    print("success" if success else "error")
