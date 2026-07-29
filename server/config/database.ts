import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os";

function getWritableDir(subDir: string) {
  const primary = path.join(process.cwd(), "public", subDir);
  try {
    if (!fs.existsSync(primary)) {
      fs.mkdirSync(primary, { recursive: true });
    }
    const testFile = path.join(primary, `.test-${Date.now()}`);
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    return primary;
  } catch {
    const fallback = path.join(os.tmpdir(), "photobooth", subDir);
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

export const uploadDir = getWritableDir("uploads");
export const framesDir = path.join(uploadDir, "frames");
export const stickersDir = path.join(uploadDir, "stickers");
export const proofsDir = path.join(uploadDir, "proofs");

[uploadDir, framesDir, stickersDir, proofsDir].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn("Directory creation warning:", dir, err);
  }
});

function getDbPath() {
  const rootDbPath = path.join(process.cwd(), "photobooth.db");
  const tmpDbPath = path.join(os.tmpdir(), "photobooth.db");

  if (process.env.VERCEL) {
    if (fs.existsSync(rootDbPath) && !fs.existsSync(tmpDbPath)) {
      try {
        fs.copyFileSync(rootDbPath, tmpDbPath);
      } catch (e) {
        console.warn("Failed to copy root DB to tmp:", e);
      }
    }
    return tmpDbPath;
  }

  try {
    const testFile = path.join(process.cwd(), `.dbtest-${Date.now()}`);
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    return rootDbPath;
  } catch {
    if (fs.existsSync(rootDbPath) && !fs.existsSync(tmpDbPath)) {
      try {
        fs.copyFileSync(rootDbPath, tmpDbPath);
      } catch (e) {
        console.warn("Failed to copy root DB to tmp:", e);
      }
    }
    return tmpDbPath;
  }
}

function initDatabase() {
  const dbPath = getDbPath();
  try {
    const instance = new Database(dbPath);
    instance.prepare("PRAGMA quick_check").get();
    return instance;
  } catch (err) {
    console.warn("Database init warning. Retrying at", dbPath, err);
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(`${dbPath}-journal`)) fs.unlinkSync(`${dbPath}-journal`);
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    } catch (e) {
      console.error("Failed to delete corrupted database file:", e);
    }
    return new Database(dbPath);
  }
}

export const db = initDatabase();

export function setupSchemaAndSeed() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        photos_count INTEGER NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS frames (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        photos_count INTEGER DEFAULT 4
      );

      CREATE TABLE IF NOT EXISTS stickers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        package_id INTEGER,
        status TEXT DEFAULT 'pending',
        payment_proof_url TEXT,
        user_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(package_id) REFERENCES packages(id)
      );
    `);

    const tableInfo = db.prepare("PRAGMA table_info(sessions)").all() as any[];
    const hasUserName = tableInfo.some(col => col.name === 'user_name');
    if (!hasUserName) {
      db.exec("ALTER TABLE sessions ADD COLUMN user_name TEXT");
    }

    const checkOldSeed = db.prepare("SELECT COUNT(*) as count FROM packages WHERE name = 'Basic'").get() as { count: number };
    if (checkOldSeed && checkOldSeed.count > 0) {
      db.exec("DELETE FROM packages");
    }

    const packageCount = db.prepare("SELECT COUNT(*) as count FROM packages").get() as { count: number };
    if (packageCount.count === 0) {
      const insertPackage = db.prepare("INSERT INTO packages (name, price, duration, photos_count, description) VALUES (?, ?, ?, ?, ?)");
      insertPackage.run("Basic Strip (3 Foto)", 1500, 5, 3, "Format strip klasik 3 foto");
      insertPackage.run("Standard Strip (4 Foto)", 2500, 5, 4, "Format strip populer 4 foto");
      insertPackage.run("Grid Double (6 Foto)", 3500, 10, 6, "Format grid 6 foto seru");
      insertPackage.run("Unlimited Pass", 4500, 15, 8, "Format penuh 8 foto lengkap");
    }

    db.prepare("DELETE FROM frames WHERE image_url LIKE '%.svg'").run();
    db.prepare("DELETE FROM stickers WHERE image_url LIKE '%.svg'").run();

    const allFrames = db.prepare("SELECT * FROM frames").all() as any[];
    for (const f of allFrames) {
      if (f.image_url.startsWith("/uploads/")) {
        const relPath = f.image_url.replace(/^\/uploads\//, "");
        const fullPath = path.join(uploadDir, relPath);
        if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
          db.prepare("DELETE FROM frames WHERE id = ?").run(f.id);
        }
      }
    }

    const allStickers = db.prepare("SELECT * FROM stickers").all() as any[];
    for (const s of allStickers) {
      if (s.image_url.startsWith("/uploads/")) {
        const relPath = s.image_url.replace(/^\/uploads\//, "");
        const fullPath = path.join(uploadDir, relPath);
        if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
          db.prepare("DELETE FROM stickers WHERE id = ?").run(s.id);
        }
      }
    }

    syncDiskUploadsWithDB();
  } catch (error) {
    console.error("Error setting up DB schema and seeds:", error);
  }
}

export function syncDiskUploadsWithDB() {
  try {
    db.prepare(`
      DELETE FROM frames WHERE image_url LIKE 'data:%' AND name IN (
        SELECT name FROM frames WHERE image_url LIKE '/uploads/%'
      )
    `).run();
    db.prepare(`
      DELETE FROM frames WHERE id NOT IN (
        SELECT MIN(id) FROM frames GROUP BY image_url
      )
    `).run();

    db.prepare(`
      DELETE FROM stickers WHERE image_url LIKE 'data:%' AND name IN (
        SELECT name FROM stickers WHERE image_url LIKE '/uploads/%'
      )
    `).run();
    db.prepare(`
      DELETE FROM stickers WHERE id NOT IN (
        SELECT MIN(id) FROM stickers GROUP BY image_url
      )
    `).run();

    if (fs.existsSync(stickersDir)) {
      const files = fs.readdirSync(stickersDir);
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const filePath = path.join(stickersDir, file);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size === 0) continue;
        const imageUrl = `/uploads/stickers/${file}`;
        const exists = db.prepare("SELECT COUNT(*) as count FROM stickers WHERE image_url = ?").get(imageUrl) as { count: number };
        if (exists.count === 0) {
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
        if (exists.count === 0) {
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
