import wave
import array
import math
from collections import defaultdict

def read_wav(filename):
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
    samples, sample_rate = read_wav(filename)
    if not samples:
        return None

    # Work with a subset of samples for faster processing
    chunk_size = min(len(samples), sample_rate * 30)  # 30 seconds max
    samples = samples[:chunk_size]

    # Find peaks in amplitude
    threshold = 0.6 * max(abs(x) for x in samples)
    peaks = []
    was_peak = False

    for i in range(1, len(samples) - 1):
        if abs(samples[i]) > threshold:
            if not was_peak and abs(samples[i]) > abs(samples[i-1]):
                peaks.append(i)
                was_peak = True
        else:
            was_peak = False

    if not peaks:
        return None

    # Calculate intervals between peaks
    intervals = defaultdict(int)
    for i in range(1, len(peaks)):
        interval = (peaks[i] - peaks[i-1]) / sample_rate
        if 0.2 < interval < 2.0:  # Accept intervals corresponding to 30-300 BPM
            # Round to nearest 0.05 seconds to group similar intervals
            rounded = round(interval * 20) / 20
            intervals[rounded] += 1

    if not intervals:
        return None

    # Find most common interval
    most_common = max(intervals.items(), key=lambda x: x[1])[0]
    bpm = round(60 / most_common)

    # Constrain BPM to reasonable range
    if not (30 <= bpm <= 300):
        return None

    return bpm

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