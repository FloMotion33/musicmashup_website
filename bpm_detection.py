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
    duration = min(len(samples) / sample_rate, 60)  # Analyze up to 60 seconds
    chunk_size = int(duration * sample_rate)
    samples = samples[:chunk_size]

    # Normalize samples
    max_sample = max(abs(min(samples)), abs(max(samples)))
    if max_sample == 0:
        return None
    samples = [s / max_sample for s in samples]

    # Split audio into chunks and calculate energy
    chunk_duration = 0.02  # 20ms chunks
    chunk_samples = int(chunk_duration * sample_rate)
    num_chunks = len(samples) // chunk_samples

    # Calculate energy for each chunk
    energies = []
    for i in range(num_chunks):
        chunk = samples[i * chunk_samples:(i + 1) * chunk_samples]
        energy = sum(abs(s) for s in chunk)
        energies.append(energy)

    # Find peaks in energy
    peaks = []
    window = 5  # Look at nearby chunks
    threshold = 1.3  # Energy must be this times higher than average

    for i in range(window, len(energies) - window):
        center = energies[i]
        window_energies = energies[i - window:i + window]
        avg_energy = sum(window_energies) / len(window_energies)

        if center > threshold * avg_energy:
            # Check if it's a local maximum
            if center == max(window_energies):
                peaks.append(i)

    if len(peaks) < 4:  # Need at least 4 peaks for reliable BPM detection
        return None

    # Calculate intervals between peaks
    intervals = defaultdict(int)
    for i in range(1, len(peaks)):
        interval = (peaks[i] - peaks[i-1]) * chunk_duration
        if 0.2 < interval < 2.0:  # Accept intervals for 30-300 BPM
            # Round to nearest 0.01 seconds
            rounded = round(interval * 100) / 100
            intervals[rounded] += 1

    if not intervals:
        return None

    # Find most common interval considering harmonics
    potential_bpms = []
    for interval, count in intervals.items():
        bpm = 60 / interval
        # Consider potential harmonics/sub-harmonics
        for factor in [0.5, 1, 2]:
            adjusted_bpm = bpm * factor
            if 50 <= adjusted_bpm <= 200:  # Most common BPM range
                potential_bpms.append((adjusted_bpm, count))

    if not potential_bpms:
        return None

    # Take the most common BPM
    bpm = round(max(potential_bpms, key=lambda x: x[1])[0])
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