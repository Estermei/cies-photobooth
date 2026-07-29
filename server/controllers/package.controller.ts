import { Request, Response } from "express";
import { db } from "../config/database.js";

const defaultPackages = [
  { id: 1, name: 'Basic Strip (3 Foto)', price: 1500, duration: 5, photos_count: 3, description: 'Format strip klasik 3 foto' },
  { id: 2, name: 'Standard Strip (4 Foto)', price: 2500, duration: 5, photos_count: 4, description: 'Format strip populer 4 foto' },
  { id: 3, name: 'Grid Double (6 Foto)', price: 3500, duration: 10, photos_count: 6, description: 'Format grid 6 foto seru' },
  { id: 4, name: 'Unlimited Pass', price: 4500, duration: 15, photos_count: 8, description: 'Format penuh 8 foto lengkap' }
];

export const getPackages = (req: Request, res: Response) => {
  let packages = db.prepare("SELECT * FROM packages").all();
  if (!packages || packages.length === 0) {
    packages = defaultPackages;
  }
  res.json(packages);
};

export const createPackage = (req: Request, res: Response) => {
  const { name, price, duration, photos_count, description } = req.body;
  const info = db.prepare(
    "INSERT INTO packages (name, price, duration, photos_count, description) VALUES (?, ?, ?, ?, ?)"
  ).run(name, Number(price) || 0, Number(duration) || 5, Number(photos_count) || 4, description || "");
  res.json({ id: info.lastInsertRowid });
};

export const updatePackage = (req: Request, res: Response) => {
  const { name, price, duration, photos_count, description } = req.body;
  const pkgId = Number(req.params.id) || req.params.id;
  db.prepare(
    "UPDATE packages SET name = ?, price = ?, duration = ?, photos_count = ?, description = ? WHERE id = ?"
  ).run(name, Number(price) || 0, Number(duration) || 5, Number(photos_count) || 4, description || "", pkgId);
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
