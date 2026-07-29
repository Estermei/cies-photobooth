import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { db, stickersDir, syncDiskUploadsWithDB } from "../config/database.js";

export const getStickers = (req: Request, res: Response) => {
  syncDiskUploadsWithDB();
  const stickers = db.prepare("SELECT * FROM stickers").all();
  res.json(stickers);
};

export const createSticker = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File gambar stiker tidak ditemukan." });
    }
    const { name } = req.body;
    const stickerName = (name && name.trim()) ? name : req.file.originalname.replace(/\.[^/.]+$/, "");

    const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-0._-]/g, "_")}`;
    let imageUrl = `/uploads/stickers/${filename}`;
    try {
      if (!fs.existsSync(stickersDir)) fs.mkdirSync(stickersDir, { recursive: true });
      fs.writeFileSync(path.join(stickersDir, filename), req.file.buffer);
    } catch (e) {
      console.warn("Could not write sticker to disk, fallback to data URL:", e);
      const mime = req.file.mimetype || "image/png";
      imageUrl = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    }

    const info = db.prepare("INSERT INTO stickers (name, image_url) VALUES (?, ?)").run(stickerName, imageUrl);
    res.json({ id: info.lastInsertRowid, imageUrl, name: stickerName });
  } catch (err: any) {
    console.error("Upload sticker error:", err);
    res.status(500).json({ error: "Gagal menyimpan stiker." });
  }
};

export const deleteSticker = (req: Request, res: Response) => {
  const sticker = db.prepare("SELECT image_url FROM stickers WHERE id = ?").get(req.params.id) as { image_url: string };
  if (sticker && sticker.image_url.startsWith("/uploads/stickers/")) {
    const filename = path.basename(sticker.image_url);
    const filePath = path.join(stickersDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare("DELETE FROM stickers WHERE id = ?").run(req.params.id);
  res.json({ success: true });
};
