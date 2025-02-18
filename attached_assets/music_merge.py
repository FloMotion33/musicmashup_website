import os
from pydub import AudioSegment
from pydub.playback import play

# Krijg het pad naar de Downloads map
downloads_path = os.path.expanduser("~/Downloads")

# Combineer met de bestandsnaam en laad de audiobestanden
audio1 = AudioSegment.from_file(os.path.join(downloads_path, "Technotronic - Pump Up The Jam (Official Music Video) [ ezmp3.cc ].mp3"))
audio2 = AudioSegment.from_file(os.path.join(downloads_path, "Ready 2 Go (Martin Solveig feat. Kele).mp3"))
audio3 = AudioSegment.from_file(os.path.join(downloads_path, "Guus Meeuwis & Vagant - Per Spoor (Kedeng Kedeng) (Official Video).mp3"))

# Overlay audio1 en audio2 (zet audio2 bovenop audio1)
combined_audio = audio1.overlay(audio2)

# Speel de gecombineerde audio af
play(combined_audio) 