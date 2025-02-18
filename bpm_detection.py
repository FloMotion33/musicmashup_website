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

        # Design bandpass filter for beat frequency range (20-200 Hz)
        nyquist = sample_rate / 2
        low = 20 / nyquist
        high = 200 / nyquist
        b, a = signal.butter(4, [low, high], btype='band')
        filtered = signal.filtfilt(b, a, samples)

        # Calculate RMS energy in overlapping windows
        window_size = int(0.02 * sample_rate)  # 20ms windows
        hop_size = window_size // 4  # 75% overlap for better precision
        num_windows = (len(filtered) - window_size) // hop_size + 1
        energies = np.zeros(num_windows)

        for i in range(num_windows):
            start = i * hop_size
            window = filtered[start:start + window_size]
            energies[i] = np.sqrt(np.mean(window ** 2))

        # Smooth energy curve
        energies = signal.savgol_filter(energies, 7, 3)

        # Find peaks with adaptive thresholding
        peaks = []
        window_length = int(2 * sample_rate / hop_size)  # 2-second window for local stats

        for i in range(window_length, len(energies) - window_length):
            local_window = energies[i - window_length:i + window_length]
            local_mean = np.mean(local_window)
            local_std = np.std(local_window)
            threshold = local_mean + 0.5 * local_std

            if energies[i] > threshold:
                if energies[i] == max(energies[max(0, i-3):min(len(energies), i+4)]):
                    peaks.append(i)

        # Calculate intervals between peaks
        intervals = np.diff(peaks) * hop_size / sample_rate

        # Filter out intervals that would give unreasonable BPMs
        valid_intervals = intervals[(intervals >= 60/200) & (intervals <= 60/60)]

        if len(valid_intervals) < 6:  # Need enough intervals for accurate detection
            return None

        # Use autocorrelation to find the dominant period
        correlation = np.correlate(energies, energies, mode='full')
        correlation = correlation[len(correlation)//2:]

        # Find peaks in correlation
        corr_peaks = signal.find_peaks(correlation)[0]
        if len(corr_peaks) < 2:
            return None

        # Convert peak positions to BPM
        bpms = 60 * sample_rate / (corr_peaks * hop_size)
        valid_bpms = bpms[(bpms >= 60) & (bpms <= 200)]

        if len(valid_bpms) == 0:
            return None

        # Calculate the final BPM using both interval and correlation analysis
        interval_bpm = 60 / np.median(valid_intervals)
        corr_bpm = valid_bpms[0]

        # Use the correlation-based BPM if it's close to the interval-based BPM
        if abs(interval_bpm - corr_bpm) < 5:
            bpm = (interval_bpm + corr_bpm) / 2
        else:
            bpm = interval_bpm

        # Ensure the BPM is in a reasonable range
        if not (60 <= bpm <= 200):
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