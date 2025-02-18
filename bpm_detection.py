import numpy as np
from scipy.signal import butter, lfilter
import wave
import array
import os
import tempfile
from pydub import AudioSegment

# From: https://github.com/scaperot/the-BPM-detector-python
def butter_bandpass(lowcut, highcut, fs, order=1):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def butter_bandpass_filter(data, lowcut, highcut, fs, order=1):
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    y = lfilter(b, a, data)
    return y

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

def detect_bpm(filename):
    # Convert to WAV if needed
    temp_wav = None
    if not filename.lower().endswith('.wav'):
        temp_wav = convert_to_wav(filename)
        if not temp_wav:
            return None
        filename = temp_wav

    try:
        # Read audio file
        data, fs = read_wav(filename)
        if data is None:
            return None

        # Convert stereo to mono by averaging channels if needed
        if len(data.shape) == 2:
            data = np.mean(data, axis=1)

        # Filter the data to get better results
        filtered = butter_bandpass_filter(data, 0.1, 200.0, fs)

        # Create a window of 0.1 seconds
        window_size = int(0.1 * fs)
        window = np.ones(window_size) / window_size
        energy = np.convolve(filtered ** 2, window, 'same')

        # Find peaks in energy
        threshold = np.mean(energy) + 0.1 * np.std(energy)
        peaks = []
        for i in range(1, len(energy) - 1):
            if energy[i] > energy[i-1] and energy[i] > energy[i+1] and energy[i] > threshold:
                peaks.append(i)

        if len(peaks) < 2:
            return None

        # Calculate intervals between peaks
        intervals = np.diff(peaks) / fs  # Convert to seconds

        # Calculate BPM from intervals
        bpms = 60 / intervals

        # Filter out unreasonable BPMs
        valid_bpms = bpms[(bpms >= 60) & (bpms <= 200)]

        if len(valid_bpms) < 1:
            return None

        # Use the median BPM as it's more robust to outliers
        bpm = float(np.median(valid_bpms))

        # Round to 1 decimal place
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