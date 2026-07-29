import { Request, Response } from "express";
import { db } from "../config/database.js";

export const getPackages = (req: Request, res: Response) => {
  const packages = db.prepare("SELECT * FROM packages").all();
  res.json(packages);
};

export const createPackage = (req: Request, res: Response) => {
  const { name, price, duration, photos_count, description } = req.body;
  const info = db.prepare(
    "INSERT INTO packages (name, price, duration, photos_count, description) VALUES (?, ?, ?, ?, ?)"
  ).run(name, price, duration, photos_count, description);
  res.json({ id: info.lastInsertRowid });
};

export const updatePackage = (req: Request, res: Response) => {
  const { name, price, duration, photos_count, description } = req.body;
  db.prepare(
    "UPDATE packages SET name = ?, price = ?, duration = ?, photos_count = ?, description = ? WHERE id = ?"
  ).run(name, price, duration, photos_count, description, req.params.id);
  res.json({ success: true });
};

export const deletePackage = (req: Request, res: Response) => {
  try {
    const packageId = req.params.id;
    db.prepare("UPDATE sessions SET package_id = NULL WHERE package_id = ?").run(packageId);
    db.prepare("DELETE FROM packages WHERE id = ?").run(packageId);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting package:", err);
    res.status(500).json({ error: err?.message || "Gagal menghapus paket." });
  }
};
