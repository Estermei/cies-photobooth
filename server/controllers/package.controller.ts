import { Request, Response } from "express";
import { db } from "../config/database.js";

const defaultPackages = [
  { id: 1, name: 'Photobooth Kolase A', price: 1500, duration: 30, photos_count: 3, description: 'All digital copies,\n1 Photo Strip' },
  { id: 2, name: 'Photobooth Kolase B', price: 2500, duration: 60, photos_count: 4, description: 'All digital copies,\n1 Photo Strip' },
  { id: 3, name: 'Photobooth Kolase C', price: 3500, duration: 120, photos_count: 6, description: 'All digital copies,\n2 Photo Strip' },
  { id: 4, name: 'Photobooth Kolase D', price: 4500, duration: 180, photos_count: 8, description: 'All digital copies,\n2 Photo Strip' }
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
