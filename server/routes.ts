import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertAudioFileSchema, insertMashupSchema } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

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
      const scriptPath = path.join(process.cwd(), "bpm_detection.py");
      console.log("Running BPM detection on:", file.path);
      const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${file.path}"`);

      if (stderr) {
        console.error("BPM detection error:", stderr);
        return res.status(500).json({ message: "BPM detection failed" });
      }

      // Parse BPM from stdout
      console.log("BPM detection output:", stdout);
      let bpm: number | null = null;
      const parsedBpm = parseFloat(stdout.trim());
      if (!isNaN(parsedBpm)) {
        bpm = parsedBpm;
      }

      console.log("Final BPM value:", bpm);

      // Save the audio file data
      const audioFile = await storage.saveAudioFile({
        filename: file.originalname,
        bpm,
        duration: 0, // TODO: Calculate duration
      });

      res.json(audioFile);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ 
        message: "Failed to process audio file", 
        details: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined 
      });
    }
  });

  app.get("/api/audio-files", async (req, res) => {
    const files = await storage.listAudioFiles();
    res.json(files);
  });

  app.get("/api/audio/:id", async (req, res) => {
    const file = await storage.getAudioFile(parseInt(req.params.id));
    if (!file) {
      return res.status(404).json({ message: "Audio file not found" });
    }
    // TODO: Implement audio file serving
    res.json(file);
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