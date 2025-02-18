{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 3,
   "id": "f07af4d5-8f8b-45b4-b389-8190ddb6363d",
   "metadata": {},
   "outputs": [
    {
     "name": "stdin",
     "output_type": "stream",
     "text": [
      "WAV-bestand:  FM - regret - 88 bpm - 07-01-2022.wav\n"
     ]
    },
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "\n",
      "Gedetecteerde BPM: 44.0\n"
     ]
    }
   ],
   "source": [
    "import numpy as np\n",
    "import wave\n",
    "import array\n",
    "from scipy import signal\n",
    "import pywt\n",
    "\n",
    "def lees_wav(bestandsnaam):\n",
    "    try:\n",
    "        with wave.open(bestandsnaam, 'rb') as wf:\n",
    "            n_samples = wf.getnframes()\n",
    "            sample_rate = wf.getframerate()\n",
    "            samples = array.array('i', wf.readframes(n_samples))\n",
    "            return np.array(samples), sample_rate\n",
    "    except Exception as e:\n",
    "        print(f\"Fout bij het lezen van bestand: {e}\")\n",
    "        return None, None\n",
    "\n",
    "def detecteer_piek(data):\n",
    "    max_val = np.amax(abs(data))\n",
    "    piek_idx = np.where(data == max_val)[0]\n",
    "    if len(piek_idx) == 0:\n",
    "        piek_idx = np.where(data == -max_val)[0]\n",
    "    return piek_idx\n",
    "\n",
    "def bereken_bpm(bestandsnaam):\n",
    "    samples, sample_rate = lees_wav(bestandsnaam)\n",
    "    if samples is None:\n",
    "        return None\n",
    "    \n",
    "    levels = 4\n",
    "    max_decimation = 2**(levels-1)\n",
    "    min_idx = int(60.0 / 220 * (sample_rate/max_decimation))\n",
    "    max_idx = int(60.0 / 40 * (sample_rate/max_decimation))\n",
    "\n",
    "    cD_sum = None\n",
    "    cA = samples\n",
    "    \n",
    "    for level in range(levels):\n",
    "        cA, cD = pywt.dwt(cA, 'db4')\n",
    "        if level == 0:\n",
    "            cD_sum = np.zeros(len(cD) // max_decimation + 1)\n",
    "        \n",
    "        cD = signal.lfilter([0.01], [1 - 0.99], cD)\n",
    "        cD = np.abs(cD[::2**(levels-level-1)])\n",
    "        cD = cD - np.mean(cD)\n",
    "        cD_sum[:len(cD)] += cD[:len(cD_sum)]\n",
    "    \n",
    "    correl = np.correlate(cD_sum, cD_sum, 'full')\n",
    "    correl = correl[len(correl)//2:]\n",
    "    \n",
    "    piek_idx = detecteer_piek(correl[min_idx:max_idx])\n",
    "    if len(piek_idx) == 0:\n",
    "        return None\n",
    "        \n",
    "    piek_idx = piek_idx[0] + min_idx\n",
    "    bpm = 60.0 / piek_idx * (sample_rate/max_decimation)\n",
    "    \n",
    "    return round(bpm, 1)\n",
    "\n",
    "# Direct vragen om input en BPM berekenen\n",
    "bestand = '/Users/florisvanamersfoort/Downloads/' + input(\"WAV-bestand: \")\n",
    "if bestand.endswith('.wav'):\n",
    "    bpm = bereken_bpm(bestand)\n",
    "    if bpm is not None:\n",
    "        print(f\"\\nGedetecteerde BPM: {bpm}\")\n",
    "    else:\n",
    "        print(\"\\nKon geen BPM detecteren in dit bestand\")\n",
    "else:\n",
    "    print(\"Error: Alleen WAV-bestanden worden ondersteund\")"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "4e769581-7450-4acc-ac0c-bb9207162fd6",
   "metadata": {},
   "outputs": [],
   "source": []
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3 (ipykernel)",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.11"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}
