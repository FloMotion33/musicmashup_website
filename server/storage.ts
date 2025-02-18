import { audioFiles, mashups, type AudioFile, type InsertAudioFile, type Mashup, type InsertMashup } from "@shared/schema";

export interface IStorage {
  saveAudioFile(file: InsertAudioFile): Promise<AudioFile>;
  getAudioFile(id: number): Promise<AudioFile | undefined>;
  saveMashup(mashup: InsertMashup): Promise<Mashup>;
  getMashup(id: number): Promise<Mashup | undefined>;
  listAudioFiles(): Promise<AudioFile[]>;
  listMashups(): Promise<Mashup[]>;
}

export class MemStorage implements IStorage {
  private audioFiles: Map<number, AudioFile>;
  private mashups: Map<number, Mashup>;
  private audioFileId: number;
  private mashupId: number;

  constructor() {
    this.audioFiles = new Map();
    this.mashups = new Map();
    this.audioFileId = 1;
    this.mashupId = 1;
  }

  async saveAudioFile(file: InsertAudioFile): Promise<AudioFile> {
    const id = this.audioFileId++;
    const audioFile: AudioFile = {
      id,
      filename: file.filename,
      filepath: file.filepath,
      bpm: file.bpm || null,
      duration: file.duration || null,
      waveformData: []
    };
    this.audioFiles.set(id, audioFile);
    return audioFile;
  }

  async getAudioFile(id: number): Promise<AudioFile | undefined> {
    return this.audioFiles.get(id);
  }

  async saveMashup(mashup: InsertMashup): Promise<Mashup> {
    const id = this.mashupId++;
    const newMashup: Mashup = {
      id,
      name: mashup.name,
      audioFileIds: mashup.audioFileIds || null,
      mixSettings: mashup.mixSettings || null
    };
    this.mashups.set(id, newMashup);
    return newMashup;
  }

  async getMashup(id: number): Promise<Mashup | undefined> {
    return this.mashups.get(id);
  }

  async listAudioFiles(): Promise<AudioFile[]> {
    return Array.from(this.audioFiles.values());
  }

  async listMashups(): Promise<Mashup[]> {
    return Array.from(this.mashups.values());
  }
}

export const storage = new MemStorage();