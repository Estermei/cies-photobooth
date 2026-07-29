import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memastikan direktori unggahan tersedia
export const uploadDir = path.join(process.cwd(), "public", "uploads");
export const framesDir = path.join(uploadDir, "frames");
export const stickersDir = path.join(uploadDir, "stickers");
export const proofsDir = path.join(uploadDir, "proofs");

[uploadDir, framesDir, stickersDir, proofsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function initDatabase() {
  try {
    const instance = new Database("photobooth.db");
    instance.prepare("PRAGMA quick_check").get();
    return instance;
  } catch (err) {
    console.warn("better-sqlite3 not available or error initializing SQLite. Using fallback in-memory store.", err);
    return new InMemoryDb();
  }
}

export const db: any = initDatabase();

export function setupSchemaAndSeed() {
  try {
    if (db.exec) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price INTEGER NOT NULL,
          duration INTEGER NOT NULL DEFAULT 5,
          photos_count INTEGER NOT NULL DEFAULT 4,
          description TEXT
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS frames (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          image_url TEXT NOT NULL,
          photos_count INTEGER NOT NULL DEFAULT 4,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS stickers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          image_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          package_id INTEGER,
          user_name TEXT,
          status TEXT DEFAULT 'pending',
          payment_proof_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (package_id) REFERENCES packages(id)
        )
      `);
    }

    try {
      const tableInfo = db.prepare("PRAGMA table_info(sessions)").all() as any[];
      const hasUserName = tableInfo && tableInfo.some((col: any) => col.name === "user_name");
      if (!hasUserName) {
        db.exec("ALTER TABLE sessions ADD COLUMN user_name TEXT");
      }
    } catch (e) {
      // Ignore
    }

    try {
      const checkOldSeed = db.prepare("SELECT COUNT(*) as count FROM packages WHERE name = 'Basic'").get() as { count: number };
      if (checkOldSeed && checkOldSeed.count > 0) {
        db.exec("DELETE FROM packages");
      }
    } catch (e) {}

    try {
      const packageCount = db.prepare("SELECT COUNT(*) as count FROM packages").get() as { count: number };
      if (packageCount && packageCount.count === 0) {
        const insertPackage = db.prepare("INSERT INTO packages (name, price, duration, photos_count, description) VALUES (?, ?, ?, ?, ?)");
        insertPackage.run("Basic Strip (3 Foto)", 1500, 5, 3, "Format strip klasik 3 foto");
        insertPackage.run("Standard Strip (4 Foto)", 2500, 5, 4, "Format strip populer 4 foto");
        insertPackage.run("Grid Double (6 Foto)", 3500, 10, 6, "Format grid 6 foto seru");
        insertPackage.run("Unlimited Pass", 4500, 15, 8, "Format penuh 8 foto lengkap");
      }
    } catch (e) {}

    try {
      db.prepare("DELETE FROM frames WHERE image_url LIKE '%.svg'").run();
      db.prepare("DELETE FROM stickers WHERE image_url LIKE '%.svg'").run();
    } catch (e) {}

    syncDiskUploadsWithDB();
  } catch (error) {
    console.error("Error setting up DB schema and seeds:", error);
  }
}

export function syncDiskUploadsWithDB() {
  try {
    if (!fs.existsSync(uploadDir)) return;

    if (fs.existsSync(stickersDir)) {
      const files = fs.readdirSync(stickersDir);
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const filePath = path.join(stickersDir, file);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size === 0) continue;
        const imageUrl = `/uploads/stickers/${file}`;
        const exists = db.prepare("SELECT COUNT(*) as count FROM stickers WHERE image_url = ?").get(imageUrl) as { count: number };
        if (exists && exists.count === 0) {
          const cleanName = file.replace(/\.[^/.]+$/, "").replace(/^sticker-/, "").replace(/[-_]/g, " ");
          const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          db.prepare("INSERT INTO stickers (name, image_url) VALUES (?, ?)").run(formattedName || file, imageUrl);
        }
      }
    }

    if (fs.existsSync(framesDir)) {
      const files = fs.readdirSync(framesDir);
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const filePath = path.join(framesDir, file);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size === 0) continue;
        const imageUrl = `/uploads/frames/${file}`;
        const exists = db.prepare("SELECT COUNT(*) as count FROM frames WHERE image_url = ?").get(imageUrl) as { count: number };
        if (exists && exists.count === 0) {
          const cleanName = file.replace(/\.[^/.]+$/, "").replace(/^default-frame-/, "").replace(/[-_]/g, " ");
          const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          db.prepare("INSERT INTO frames (name, image_url, photos_count) VALUES (?, ?, ?)").run(formattedName || file, imageUrl, 4);
        }
      }
    }
  } catch (err) {
    console.error("Error syncing disk uploads with DB:", err);
  }
}
