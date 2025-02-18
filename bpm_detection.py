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

def onset_strength(samples, sample_rate):
    """Calculate onset strength envelope."""
    # Compute spectrogram with higher resolution
    hop_length = int(sample_rate * 0.005)  # 5ms hop for higher precision
    n_fft = 4096  # Larger FFT window for better frequency resolution

    # Calculate STFT
    f, t, spec = signal.stft(samples, 
                            fs=sample_rate,
                            nperseg=n_fft,
                            noverlap=n_fft-hop_length)

    # Split into frequency bands
    bands = [
        (0, 200),    # Sub-bass
        (200, 800),  # Bass
        (800, 2000), # Low-mids
        (2000, 8000) # High-mids and treble
    ]

    onset_bands = []
    for low, high in bands:
        # Find frequency bin indices for this band
        band_mask = (f >= low) & (f <= high)
        band_spec = spec[band_mask]

        # Calculate onset envelope for this band
        band_onset = np.zeros(spec.shape[1])
        for i in range(1, spec.shape[1]):
            # Spectral flux with logarithmic compression
            diff = np.log1p(np.abs(band_spec[:, i])) - np.log1p(np.abs(band_spec[:, i-1]))
            band_onset[i] = np.sum(diff[diff > 0])

        onset_bands.append(band_onset)

    # Combine onset envelopes with weights
    weights = [0.4, 0.3, 0.2, 0.1]  # More weight to lower frequencies
    onset_env = np.zeros_like(onset_bands[0])
    for band, weight in zip(onset_bands, weights):
        onset_env += weight * band

    return onset_env, hop_length

def comb_filter_analysis(onset_env, hop_length, sample_rate):
    """Analyze tempo using comb filter resonance."""
    # Normalize onset envelope
    onset_env = onset_env - onset_env.mean()
    onset_env = onset_env / onset_env.std()

    # Range of BPMs to check (60-200 BPM in 0.1 BPM steps)
    bpms = np.arange(60, 200.1, 0.1)
    resonances = []

    for bpm in bpms:
        period = int(60.0 * sample_rate / (bpm * hop_length))
        max_n = min(10, len(onset_env) // period)  # Number of impulses to consider

        # Create comb filter impulse response
        impulse = np.zeros(len(onset_env))
        for n in range(max_n):
            if n * period < len(impulse):
                impulse[n * period] = 1.0 / (n + 1)  # Decay over time

        # Convolve with onset envelope
        response = signal.convolve(onset_env, impulse, mode='valid')
        resonances.append(np.mean(np.abs(response)))

    return bpms, np.array(resonances)

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
        # Read audio file
        samples, sample_rate = read_wav(filename)
        if samples is None:
            return None

        # Convert stereo to mono if needed
        if len(samples) % 2 == 0:
            samples = np.mean(samples.reshape(-1, 2), axis=1)

        # Normalize audio
        samples = samples / np.abs(samples).max()

        # Calculate onset strength with multiple frequency bands
        onset_env, hop_length = onset_strength(samples, sample_rate)

        # Perform comb filter analysis
        bpms, resonances = comb_filter_analysis(onset_env, hop_length, sample_rate)

        # Find peaks in resonance curve
        peak_indices = signal.find_peaks(resonances, distance=10)[0]  # Min 1 BPM separation
        peak_bpms = bpms[peak_indices]
        peak_resonances = resonances[peak_indices]

        if len(peak_bpms) == 0:
            return None

        # Weight peaks by resonance strength and tempo likelihood
        weights = []
        for bpm, res in zip(peak_bpms, peak_resonances):
            # Strong preference for common tempo ranges
            if 115 <= bpm <= 135:
                tempo_weight = 1.0
            elif 90 <= bpm <= 150:
                tempo_weight = 0.8
            else:
                tempo_weight = 0.6

            # Check for period doubling/halving relationships
            harmonic_relations = [bpm/2, bpm*2]
            for related_bpm in harmonic_relations:
                if any(abs(p - related_bpm) < 1.0 for p in peak_bpms):
                    tempo_weight *= 1.2  # Boost weight if harmonically related peaks exist

            weights.append(res * tempo_weight)

        # Select BPM with highest weight
        best_idx = np.argmax(weights)
        bpm = peak_bpms[best_idx]

        # Round to nearest 0.1 BPM for high precision
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