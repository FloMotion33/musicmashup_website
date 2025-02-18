import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertAudioFileSchema, insertMashupSchema } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { promises as fs } from "fs";
import { AudioSegment } from "pydub";

const execAsync = promisify(exec);
const upload = multer({ dest: "/tmp/uploads/" });

export async function registerRoutes(app: Express) {
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      
      // Run BPM detection
      const { stdout } = await execAsync(`python3 bpm_detection.py "${file.path}"`);
      const bpm = parseInt(stdout.trim());

      const audioFile = await storage.saveAudioFile({
        filename: file.originalname,
        bpm,
        duration: 0 // TODO: Extract duration
      });

      res.json(audioFile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to process audio file" });
    }
  });

  app.get("/api/audio-files", async (req, res) => {
    const files = await storage.listAudioFiles();
    res.json(files);
  });

  app.post("/api/mashups", async (req, res) => {
    try {
      const mashup = insertMashupSchema.parse(req.body);
      const saved = await storage.saveMashup(mashup);
      res.json(saved);
    } catch (err) {
      res.status(400).json({ message: "Invalid mashup data" });
    }
  });

  app.get("/api/mashups", async (req, res) => {
    const mashups = await storage.listMashups();
    res.json(mashups);
  });

  const httpServer = createServer(app);
  return httpServer;
}
