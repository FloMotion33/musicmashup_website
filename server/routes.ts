import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertAudioFileSchema, insertMashupSchema } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from 'os';

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
        filepath: file.path,
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

    // Check if file exists
    if (!fs.existsSync(file.filepath)) {
      return res.status(404).json({ message: "Audio file not found on disk" });
    }

    // Stream the audio file
    const stat = fs.statSync(file.filepath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0]);
      const end = parts[1] ? parseInt(parts[1]) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(file.filepath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'audio/mpeg'
      });
      fs.createReadStream(file.filepath).pipe(res);
    }
  });

  app.delete("/api/audio/:id", async (req, res) => {
    try {
      const file = await storage.getAudioFile(parseInt(req.params.id));
      if (!file) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      // Delete the physical file
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }

      // Remove from storage
      await storage.deleteAudioFile(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ message: "Failed to delete audio file" });
    }
  });

  app.post("/api/mashups", async (req, res) => {
    try {
      const mashup = insertMashupSchema.parse(req.body);

      if (!mashup.audioFileIds || !mashup.mixSettings) {
        return res.status(400).json({ message: "Missing required mashup data" });
      }

      // Get all audio files
      const audioFiles = await Promise.all(
        mashup.audioFileIds.map(id => storage.getAudioFile(id))
      );

      if (audioFiles.some(file => !file)) {
        return res.status(404).json({ message: "One or more audio files not found" });
      }

      // Create temporary output file
      const outputPath = `/tmp/mashup-${Date.now()}.mp3`;

      try {
        // Prepare data for Python script
        const filePaths = audioFiles.map(file => file!.filepath);
        const volumes = Object.fromEntries(
          audioFiles.map((file, index) => [index, mashup.mixSettings!.volumes[file!.id]])
        );

        // Run audio processing script
        const scriptPath = path.join(process.cwd(), "audio_processor.py");
        const { stdout, stderr } = await execAsync(
          `python3 "${scriptPath}" '${JSON.stringify(filePaths)}' '${JSON.stringify(volumes)}' "${outputPath}"`
        );

        if (stderr || stdout.trim() !== "success") {
          throw new Error("Audio processing failed: " + stderr);
        }

        // Stream the file back to the client
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'attachment; filename=mashup.mp3');

        const fileStream = fs.createReadStream(outputPath);
        fileStream.pipe(res);

        // Clean up temp file after streaming
        fileStream.on('end', () => {
          fs.unlink(outputPath, (err) => {
            if (err) console.error('Error cleaning up mashup file:', err);
          });
        });
      } catch (err) {
        console.error("Mashup creation error:", err);
        res.status(500).json({ message: "Failed to create mashup" });
      }
    } catch (err) {
      res.status(400).json({ message: "Invalid mashup data" });
    }
  });

  app.get("/api/mashups", async (req, res) => {
    const mashups = await storage.listMashups();
    res.json(mashups);
  });

  app.post("/api/separate-stems/:id", async (req, res) => {
    try {
      const file = await storage.getAudioFile(parseInt(req.params.id));
      if (!file) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      const scriptPath = path.join(process.cwd(), "stem_separator.py");
      const pythonProcess = await execAsync(`python3 "${scriptPath}" "${file.filepath}"`, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
      });

      if (pythonProcess.stderr) {
        console.error("Stem separation error:", pythonProcess.stderr);
        return res.status(500).json({ message: "Stem separation failed" });
      }

      // Parse the stem paths from stdout
      try {
        const stemPaths = JSON.parse(pythonProcess.stdout);
        res.json({
          vocals: `/api/audio/stem/${path.basename(stemPaths.vocals)}`,
          drums: `/api/audio/stem/${path.basename(stemPaths.drums)}`,
          bass: `/api/audio/stem/${path.basename(stemPaths.bass)}`,
          other: `/api/audio/stem/${path.basename(stemPaths.other)}`
        });
      } catch (error) {
        console.error("Failed to parse stem paths:", error, pythonProcess.stdout);
        res.status(500).json({ message: "Failed to process stem output" });
      }
    } catch (err) {
      console.error("Stem separation error:", err);
      res.status(500).json({ 
        message: "Failed to separate stems",
        details: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
      });
    }
  });

  app.get("/api/audio/stem/:filename", (req, res) => {
    const stemPath = path.join(os.tmpdir(), req.params.filename);
    if (!fs.existsSync(stemPath)) {
      return res.status(404).json({ message: "Stem file not found" });
    }

    res.sendFile(stemPath);
  });

  const httpServer = createServer(app);
  return httpServer;
}