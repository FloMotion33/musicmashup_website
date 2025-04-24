import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const audioFiles = pgTable("audio_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  bpm: integer("bpm"),
  duration: integer("duration"),
  key: text("key"),
  waveformData: jsonb("waveform_data").$type<number[]>(),
});

export const mashups = pgTable("mashups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  audioFileIds: integer("audio_file_ids").array(),
  mixSettings: jsonb("mix_settings").$type<{
    volumes: Record<number, number>,
    bpm: number,
    extractVocals: boolean,
    extractInstrumental: boolean
  }>(),
});

export const insertAudioFileSchema = createInsertSchema(audioFiles).omit({
  id: true,
  waveformData: true
});

export const insertMashupSchema = createInsertSchema(mashups).omit({ 
  id: true 
});

export type InsertAudioFile = z.infer<typeof insertAudioFileSchema>;
export type AudioFile = typeof audioFiles.$inferSelect;
export type InsertMashup = z.infer<typeof insertMashupSchema>;
export type Mashup = typeof mashups.$inferSelect;