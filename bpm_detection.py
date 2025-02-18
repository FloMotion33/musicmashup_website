import numpy as np
import wave
import array
from scipy import signal
import pywt

def lees_wav(bestandsnaam):
    try:
        with wave.open(bestandsnaam, 'rb') as wf:
            n_samples = wf.getnframes()
            sample_rate = wf.getframerate()
            samples = array.array('i', wf.readframes(n_samples))
            return np.array(samples), sample_rate
    except Exception as e:
        print(f"Error reading file: {e}")
        return None, None

def detecteer_piek(data):
    max_val = np.amax(abs(data))
    piek_idx = np.where(data == max_val)[0]
    if len(piek_idx) == 0:
        piek_idx = np.where(data == -max_val)[0]
    return piek_idx

def bereken_bpm(bestandsnaam):
    samples, sample_rate = lees_wav(bestandsnaam)
    if samples is None:
        return None
    
    levels = 4
    max_decimation = 2**(levels-1)
    min_idx = int(60.0 / 220 * (sample_rate/max_decimation))
    max_idx = int(60.0 / 40 * (sample_rate/max_decimation))

    cD_sum = None
    cA = samples
    
    for level in range(levels):
        cA, cD = pywt.dwt(cA, 'db4')
        if level == 0:
            cD_sum = np.zeros(len(cD) // max_decimation + 1)
        
        cD = signal.lfilter([0.01], [1 - 0.99], cD)
        cD = np.abs(cD[::2**(levels-level-1)])
        cD = cD - np.mean(cD)
        cD_sum[:len(cD)] += cD[:len(cD_sum)]
    
    correl = np.correlate(cD_sum, cD_sum, 'full')
    correl = correl[len(correl)//2:]
    
    piek_idx = detecteer_piek(correl[min_idx:max_idx])
    if len(piek_idx) == 0:
        return None
        
    piek_idx = piek_idx[0] + min_idx
    bpm = 60.0 / piek_idx * (sample_rate/max_decimation)
    
    return round(bpm, 1)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python bpm_detection.py <audio_file>")
        sys.exit(1)
        
    audio_path = sys.argv[1]
    bpm = bereken_bpm(audio_path)
    if bpm is not None:
        print(bpm)
    else:
        print("Could not detect BPM in this file")
