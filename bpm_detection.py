import wave
import array
import numpy as np
from scipy import signal
import os
import tempfile
from pydub import AudioSegment

def convert_to_wav(input_file):
    """Convert any audio file to WAV format using pydub."""
    try:
        audio = AudioSegment.from_file(input_file)
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
            samples = array.array('i', wf.readframes(n_frames))
            return np.array(samples), sample_rate
    except Exception as e:
        print(f"Error reading file: {e}")
        return None, None

def detect_bpm(filename):
    """Detect BPM from any audio file."""
    # Convert to WAV if needed
    temp_wav = None
    if not filename.lower().endswith('.wav'):
        temp_wav = convert_to_wav(filename)
        if not temp_wav:
            return None
        filename = temp_wav

    try:
        samples, sample_rate = read_wav(filename)
        if samples is None:
            return None

        # Convert stereo to mono if needed
        if len(samples) % 2 == 0:
            samples = np.mean(samples.reshape(-1, 2), axis=1)

        # Normalize audio
        samples = samples / np.abs(samples).max()

        # Work with a subset of samples for faster processing
        duration = min(len(samples) / sample_rate, 30)  # Analyze up to 30 seconds
        chunk_size = int(duration * sample_rate)
        samples = samples[:chunk_size]

        # Calculate energy in small windows with overlap
        window_size = int(0.02 * sample_rate)  # 20ms windows
        hop_size = window_size // 2  # 50% overlap
        energies = []

        for i in range(0, len(samples) - window_size, hop_size):
            window = samples[i:i + window_size]
            energy = np.sum(np.abs(window))
            energies.append(energy)

        # Normalize energies and apply low-pass filter
        energies = np.array(energies)
        energies = signal.savgol_filter(energies, 5, 2)  # Smooth energy curve
        energies = (energies - energies.mean()) / energies.std()

        # Find peaks with dynamic thresholding
        peaks = []
        min_distance = int(0.25 * sample_rate / hop_size)  # Minimum 0.25s between beats
        max_distance = int(1.2 * sample_rate / hop_size)   # Maximum 1.2s between beats

        # Use adaptive thresholding
        for i in range(3, len(energies) - 3):
            # Look at local window for thresholding
            local_window = energies[max(0, i-10):min(len(energies), i+10)]
            threshold = np.mean(local_window) + 0.5 * np.std(local_window)

            if energies[i] > threshold:
                # Ensure it's a clear peak
                if energies[i] > energies[i-1] and energies[i] > energies[i+1]:
                    if not peaks or min_distance <= (i - peaks[-1]) <= max_distance:
                        peaks.append(i)

        if len(peaks) < 6:  # Need enough beats for reliable detection
            return None

        # Calculate intervals between consecutive peaks
        intervals = []
        for i in range(1, len(peaks)):
            interval = (peaks[i] - peaks[i-1]) * hop_size / sample_rate
            # Only accept intervals that would result in 60-180 BPM
            if 60 <= (60 / interval) <= 180:
                intervals.append(interval)

        if len(intervals) < 4:  # Need enough valid intervals
            return None

        # Use median filtering to remove outliers
        intervals = np.array(intervals)
        median_interval = np.median(intervals)

        # Only use intervals close to the median
        valid_intervals = intervals[np.abs(intervals - median_interval) < 0.1]

        if len(valid_intervals) < 3:
            return None

        # Calculate BPM from average interval
        bpm = 60.0 / np.mean(valid_intervals)

        # Final validation of BPM range
        if not (60 <= bpm <= 180):
            return None

        return round(bpm, 1)

    finally:
        # Clean up temporary file
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