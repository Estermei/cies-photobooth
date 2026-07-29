import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { db } from "../config/database.js";

export const adminLogin = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};
    const expectedUsername = process.env.ADMIN_USERNAME || "ciesadmin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "ci3s0413";

    if (username === expectedUsername && password === expectedPassword) {
      return res.json({ success: true, message: "Login berhasil" });
    } else {
      return res.status(401).json({ success: false, error: "Username atau password salah" });
    }
  } catch (err: any) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan server saat login" });
  }
};

export const createSession = (req: Request, res: Response) => {
  const { package_id, user_name } = req.body;
  const sessionId = Math.random().toString(36).substring(2, 15);
  const pkgId = package_id ? Number(package_id) : 1;
  db.prepare("INSERT INTO sessions (id, package_id, user_name, status) VALUES (?, ?, ?, 'active')").run(sessionId, pkgId, user_name || null);
  res.json({ sessionId });
};

export const getSessionById = (req: Request, res: Response) => {
  const session = db.prepare(`
    SELECT s.*, COALESCE(p.name, 'Paket Dihapus') as package_name, COALESCE(p.duration, 0) as duration, COALESCE(p.photos_count, 4) as photos_count 
    FROM sessions s 
    LEFT JOIN packages p ON s.package_id = p.id 
    WHERE s.id = ?
  `).get(req.params.id);
  res.json(session);
};

export const getAdminSessions = (req: Request, res: Response) => {
  const sessions = db.prepare(`
    SELECT s.*, COALESCE(p.name, 'Paket Dihapus') as package_name, COALESCE(p.price, 0) as price
    FROM sessions s
    LEFT JOIN packages p ON s.package_id = p.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(sessions);
};

export const uploadPaymentProof = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "File gambar bukti transfer tidak ditemukan." });
  }
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  db.prepare("UPDATE sessions SET payment_proof_url = ?, status = 'active' WHERE id = ?").run(base64Image, req.params.id);
  res.json({ success: true, imageUrl: base64Image });
};

export const approveSession = (req: Request, res: Response) => {
  db.prepare("UPDATE sessions SET status = 'active' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
};

export const deleteSession = (req: Request, res: Response) => {
  const session = db.prepare("SELECT payment_proof_url FROM sessions WHERE id = ?").get(req.params.id) as { payment_proof_url: string | null };
  if (session && session.payment_proof_url && session.payment_proof_url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", session.payment_proof_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
  res.json({ success: true });
};
