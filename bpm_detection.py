import wave
import array
from collections import defaultdict
import os
import tempfile
from pydub import AudioSegment

def convert_to_wav(input_file):
    """Convert any audio file to WAV format using pydub."""
    try:
        audio = AudioSegment.from_file(input_file)

        # Create temporary WAV file
        temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        audio.export(temp_wav.name, format='wav')
        return temp_wav.name
    except Exception as e:
        print(f"Error converting file: {e}")
        return None

def read_wav(filename):
    """Read WAV file and return samples and sample rate."""
    try:
        with wave.open(filename, 'rb') as wf:
            n_frames = wf.getnframes()
            sample_rate = wf.getframerate()
            samples = array.array('h', wf.readframes(n_frames))
            return samples, sample_rate
    except Exception as e:
        print(f"Error reading file: {e}")
        return None, None

def detect_bpm(filename):
    """Detect BPM from any audio file."""
    # Convert to WAV if not already WAV
    temp_wav = None
    if not filename.lower().endswith('.wav'):
        temp_wav = convert_to_wav(filename)
        if not temp_wav:
            return None
        filename = temp_wav

    try:
        samples, sample_rate = read_wav(filename)
        if not samples:
            return None

        # Work with mono audio for consistency
        if len(samples) % 2 == 0:  # Stereo to mono conversion
            samples = array.array('h', [sum(samples[i:i+2])//2 for i in range(0, len(samples), 2)])

        # Analyze first 30 seconds only
        samples = samples[:min(len(samples), sample_rate * 30)]

        # Normalize samples
        max_amplitude = max(abs(min(samples)), abs(max(samples)))
        if max_amplitude == 0:
            return None

        # Calculate energy in small windows
        window_size = int(0.02 * sample_rate)  # 20ms windows
        hop_size = window_size // 2  # 50% overlap
        energies = []

        for i in range(0, len(samples) - window_size, hop_size):
            window = samples[i:i + window_size]
            energy = sum(abs(s) for s in window) / window_size
            energies.append(energy)

        # Find peaks (beats)
        peaks = []
        min_distance = int(0.2 * sample_rate / hop_size)  # Minimum 0.2s between beats

        # Calculate dynamic threshold
        avg_energy = sum(energies) / len(energies)
        threshold = avg_energy * 1.3

        for i in range(3, len(energies) - 3):
            if energies[i] > threshold:
                if energies[i] == max(energies[i-3:i+4]):  # Local maximum
                    if not peaks or i - peaks[-1] >= min_distance:
                        peaks.append(i)

        if len(peaks) < 6:  # Need enough beats for reliable detection
            return None

        # Calculate intervals between consecutive peaks
        intervals = []
        for i in range(1, len(peaks)):
            interval = (peaks[i] - peaks[i-1]) * hop_size / sample_rate
            if 0.2 <= interval <= 1.0:  # Accept intervals for 60-300 BPM
                intervals.append(interval)

        if not intervals:
            return None

        # Calculate average interval and convert to BPM
        avg_interval = sorted(intervals)[len(intervals)//2]  # Use median for robustness
        bpm = int(round(60 / avg_interval))

        # Validate BPM is in reasonable range
        if not (60 <= bpm <= 200):
            return None

        return bpm

    finally:
        # Clean up temporary file if created
        if temp_wav and os.path.exists(temp_wav):
            os.unlink(temp_wav)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python bpm_detection.py <audio_file>")
        sys.exit(1)

    audio_path = sys.argv[1]
    bpm = detect_bpm(audio_path)
    if bpm is not None:
        print(bpm)
    else:
        print("Could not detect BPM in this file")