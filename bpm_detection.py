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
            samples = array.array('h', wf.readframes(n_frames))
            return np.array(samples, dtype=np.float32), sample_rate
    except Exception as e:
        print(f"Error reading file: {e}")
        return None, None

def onset_strength(samples, sample_rate):
    """Calculate onset strength envelope."""
    # Compute spectrogram
    hop_length = int(sample_rate * 0.01)  # 10ms hop
    n_fft = 2048

    # Calculate STFT
    f, t, spec = signal.stft(samples, 
                            fs=sample_rate,
                            nperseg=n_fft,
                            noverlap=n_fft-hop_length)

    # Convert to power spectrogram
    spec = np.abs(spec)**2

    # Calculate onset envelope
    onset_env = np.zeros(spec.shape[1])
    for i in range(1, spec.shape[1]):
        # Spectral flux
        diff = spec[:, i] - spec[:, i-1]
        onset_env[i] = np.sum(diff[diff > 0])

    return onset_env, hop_length

def detect_tempo(onset_env, hop_length, sample_rate):
    """Estimate tempo using autocorrelation."""
    # Normalize onset envelope
    onset_env = onset_env - onset_env.mean()
    onset_env = onset_env / onset_env.std()

    # Calculate autocorrelation
    ac = signal.correlate(onset_env, onset_env, mode='full')
    ac = ac[len(ac)//2:]

    # Convert lag to BPM
    bpms = 60 * sample_rate / (np.arange(1, len(ac)) * hop_length)

    # Find peaks in autocorrelation
    peaks = signal.find_peaks(ac, distance=int(sample_rate * 0.5 / hop_length))[0]
    if len(peaks) == 0:
        return None

    # Filter peaks to reasonable BPM range
    valid_peaks = [(i, bpms[i]) for i in peaks if 60 <= bpms[i] <= 200]
    if not valid_peaks:
        return None

    # Weight peaks by their correlation value and tempo reasonableness
    peak_weights = []
    for i, bpm in valid_peaks:
        # Weight by correlation strength
        correlation_weight = ac[i]
        # Weight by tempo likelihood (prefer 120-130 BPM range)
        tempo_weight = 1.0 - min(abs(bpm - 125) / 65, 1.0)
        peak_weights.append(correlation_weight * tempo_weight)

    # Return BPM with highest weight
    best_peak_idx = np.argmax(peak_weights)
    return round(valid_peaks[best_peak_idx][1])

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

        # Calculate onset strength
        onset_env, hop_length = onset_strength(samples, sample_rate)

        # Detect tempo
        bpm = detect_tempo(onset_env, hop_length, sample_rate)

        return bpm

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