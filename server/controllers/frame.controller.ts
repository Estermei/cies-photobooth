import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { db, framesDir, syncDiskUploadsWithDB } from "../config/database.js";

export const getFrames = (req: Request, res: Response) => {
  syncDiskUploadsWithDB();
  const frames = db.prepare("SELECT * FROM frames").all();
  res.json(frames);
};

export const createFrame = (req: Request, res: Response) => {
  try {
    let imageUrl = "";
    let frameName = "";
    let photosCount = 4;

    if (req.file) {
      frameName = (req.body.name && req.body.name.trim()) ? req.body.name : req.file.originalname.replace(/\.[^/.]+$/, "");
      photosCount = req.body.photos_count ? parseInt(req.body.photos_count, 10) : 4;
      const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-0._-]/g, "_")}`;
      try {
        if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
        fs.writeFileSync(path.join(framesDir, filename), req.file.buffer);
        imageUrl = `/uploads/frames/${filename}`;
      } catch (e) {
        console.warn("Could not write frame to disk, fallback to data URL:", e);
        const mime = req.file.mimetype || "image/png";
        imageUrl = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
      }
    } else if (req.body && (req.body.image_base64 || req.body.image_url)) {
      frameName = (req.body.name && req.body.name.trim()) ? req.body.name : "Frame Baru";
      photosCount = req.body.photos_count ? parseInt(req.body.photos_count, 10) : 4;
      imageUrl = req.body.image_base64 || req.body.image_url;
    } else {
      return res.status(400).json({ error: "File gambar frame tidak ditemukan." });
    }

    const info = db.prepare("INSERT INTO frames (name, image_url, photos_count) VALUES (?, ?, ?)").run(frameName, imageUrl, photosCount);
    res.json({ id: info.lastInsertRowid, imageUrl, name: frameName, photos_count: photosCount });
  } catch (err: any) {
    console.error("Upload frame error:", err);
    res.status(500).json({ error: "Gagal menyimpan frame." });
  }
};

export const deleteFrame = (req: Request, res: Response) => {
  const frame = db.prepare("SELECT image_url FROM frames WHERE id = ?").get(req.params.id) as { image_url: string };
  if (frame && frame.image_url.startsWith("/uploads/frames/")) {
    const filename = path.basename(frame.image_url);
    const filePath = path.join(framesDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare("DELETE FROM frames WHERE id = ?").run(req.params.id);
  res.json({ success: true });
};
