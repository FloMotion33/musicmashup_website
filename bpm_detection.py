import wave
import array
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

    # Analyze first 30 seconds only
    samples = samples[:min(len(samples), sample_rate * 30)]

    # Normalize samples
    max_amplitude = max(abs(min(samples)), abs(max(samples)))
    if max_amplitude == 0:
        return None

    # Calculate energy in small windows
    window_size = int(0.05 * sample_rate)  # 50ms windows
    energies = []

    for i in range(0, len(samples) - window_size, window_size):
        window = samples[i:i + window_size]
        energy = sum(abs(s) for s in window)
        energies.append(energy)

    # Find peaks (beats)
    peaks = []
    min_distance = int(0.2 * sample_rate / window_size)  # Minimum 0.2s between beats

    for i in range(2, len(energies) - 2):
        if energies[i] > energies[i-1] and energies[i] > energies[i+1]:
            if energies[i] > 1.2 * sum(energies[i-2:i+3]) / 5:  # Local energy spike
                if not peaks or i - peaks[-1] >= min_distance:
                    peaks.append(i)

    if len(peaks) < 4:  # Need at least 4 beats for reliable detection
        return None

    # Calculate time between peaks
    intervals = []
    for i in range(1, len(peaks)):
        interval = (peaks[i] - peaks[i-1]) * window_size / sample_rate
        if 0.2 <= interval <= 1.5:  # Accept intervals for 40-300 BPM
            intervals.append(interval)

    if not intervals:
        return None

    # Calculate average interval and convert to BPM
    avg_interval = sum(intervals) / len(intervals)
    bpm = int(round(60 / avg_interval))

    # Validate BPM is in reasonable range
    if not (60 <= bpm <= 200):
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