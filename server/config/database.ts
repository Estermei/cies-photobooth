import path from "path";
import fs from "fs";
import os from "os";
function getNativeRequire() {
  if (typeof require !== "undefined") {
    return require;
  }
  return (_moduleName: string) => {
    throw new Error("Require not supported in standard ESM without createRequire");
  };
}

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

// In-Memory Fallback Store when better-sqlite3 cannot be loaded in serverless environments
class InMemoryDb {
  private packages: any[] = [
    { id: 1, name: 'Basic Strip (3 Foto)', price: 1500, duration: 5, photos_count: 3, description: 'Format strip klasik 3 foto' },
    { id: 2, name: 'Standard Strip (4 Foto)', price: 2500, duration: 5, photos_count: 4, description: 'Format strip populer 4 foto' },
    { id: 3, name: 'Grid Double (6 Foto)', price: 3500, duration: 10, photos_count: 6, description: 'Format grid 6 foto seru' },
    { id: 4, name: 'Unlimited Pass', price: 4500, duration: 15, photos_count: 8, description: 'Format penuh 8 foto lengkap' }
  ];
  private frames: any[] = [];
  private stickers: any[] = [];
  private sessions: any[] = [];
  private nextPkgId = 5;
  private nextFrameId = 1;
  private nextStickerId = 1;

  exec(_sql: string) {
    return this;
  }

  prepare(sql: string) {
    const self = this;
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    return {
      get(...params: any[]) {
        if (cleanSql.includes('PRAGMA')) return { ok: 1 };
        if (cleanSql.includes('FROM packages WHERE name =')) {
          const pkg = self.packages.find(p => p.name === params[0]);
          return pkg ? { count: 1 } : { count: 0 };
        }
        if (cleanSql.includes('COUNT(*) as count FROM packages')) {
          return { count: self.packages.length };
        }
        if (cleanSql.includes('COUNT(*) as count FROM stickers WHERE image_url =')) {
          return { count: self.stickers.filter(s => s.image_url === params[0]).length };
        }
        if (cleanSql.includes('COUNT(*) as count FROM frames WHERE image_url =')) {
          return { count: self.frames.filter(f => f.image_url === params[0]).length };
        }
        if (cleanSql.includes('SELECT image_url FROM frames WHERE id =')) {
          const f = self.frames.find(x => x.id == params[0]);
          return f ? { image_url: f.image_url } : undefined;
        }
        if (cleanSql.includes('SELECT image_url FROM stickers WHERE id =')) {
          const s = self.stickers.find(x => x.id == params[0]);
          return s ? { image_url: s.image_url } : undefined;
        }
        if (cleanSql.includes('FROM sessions s') && cleanSql.includes('WHERE s.id =')) {
          const sess = self.sessions.find(x => x.id === params[0]);
          if (!sess) return undefined;
          const pkg = self.packages.find(p => p.id === sess.package_id);
          return {
            ...sess,
            package_name: pkg ? pkg.name : 'Paket Dihapus',
            duration: pkg ? pkg.duration : 0,
            photos_count: pkg ? pkg.photos_count : 4,
            price: pkg ? pkg.price : 0
          };
        }
        if (cleanSql.includes('FROM sessions WHERE id =')) {
          const sess = self.sessions.find(x => x.id === params[0]);
          return sess ? { payment_proof_url: sess.payment_proof_url } : undefined;
        }
        return undefined;
      },

      all(..._params: any[]) {
        if (cleanSql.includes('PRAGMA table_info')) return [{ name: 'user_name' }];
        if (cleanSql.includes('FROM packages')) return [...self.packages];
        if (cleanSql.includes('FROM frames')) return [...self.frames];
        if (cleanSql.includes('FROM stickers')) return [...self.stickers];
        if (cleanSql.includes('FROM sessions')) {
          return self.sessions.map(s => {
            const pkg = self.packages.find(p => p.id === s.package_id);
            return {
              ...s,
              package_name: pkg ? pkg.name : 'Paket Dihapus',
              price: pkg ? pkg.price : 0
            };
          });
        }
        return [];
      },

      run(...params: any[]) {
        if (cleanSql.includes('INSERT INTO packages')) {
          const id = self.nextPkgId++;
          self.packages.push({
            id,
            name: params[0],
            price: params[1],
            duration: params[2],
            photos_count: params[3],
            description: params[4]
          });
          return { lastInsertRowid: id, changes: 1 };
        }
        if (cleanSql.includes('UPDATE packages SET')) {
          const id = params[5];
          const pkg = self.packages.find(p => p.id == id);
          if (pkg) {
            pkg.name = params[0];
            pkg.price = params[1];
            pkg.duration = params[2];
            pkg.photos_count = params[3];
            pkg.description = params[4];
          }
          return { changes: pkg ? 1 : 0 };
        }
        if (cleanSql.includes('DELETE FROM packages WHERE id =')) {
          const before = self.packages.length;
          self.packages = self.packages.filter(p => p.id != params[0]);
          return { changes: before - self.packages.length };
        }
        if (cleanSql.includes('INSERT INTO frames')) {
          const id = self.nextFrameId++;
          self.frames.push({
            id,
            name: params[0],
            image_url: params[1],
            photos_count: params[2] || 4
          });
          return { lastInsertRowid: id, changes: 1 };
        }
        if (cleanSql.includes('DELETE FROM frames WHERE id =')) {
          const before = self.frames.length;
          self.frames = self.frames.filter(f => f.id != params[0]);
          return { changes: before - self.frames.length };
        }
        if (cleanSql.includes('INSERT INTO stickers')) {
          const id = self.nextStickerId++;
          self.stickers.push({ id, name: params[0], image_url: params[1] });
          return { lastInsertRowid: id, changes: 1 };
        }
        if (cleanSql.includes('DELETE FROM stickers WHERE id =')) {
          const before = self.stickers.length;
          self.stickers = self.stickers.filter(s => s.id != params[0]);
          return { changes: before - self.stickers.length };
        }
        if (cleanSql.includes('INSERT INTO sessions')) {
          self.sessions.push({
            id: params[0],
            package_id: params[1],
            user_name: params[2] || null,
            created_at: new Date().toISOString(),
            status: 'pending',
            payment_proof_url: null
          });
          return { changes: 1 };
        }
        if (cleanSql.includes('UPDATE sessions SET payment_proof_url =')) {
          const sess = self.sessions.find(s => s.id === params[1]);
          if (sess) {
            sess.payment_proof_url = params[0];
            sess.status = 'active';
          }
          return { changes: sess ? 1 : 0 };
        }
        if (cleanSql.includes('UPDATE sessions SET status =')) {
          const sess = self.sessions.find(s => s.id === params[0]);
          if (sess) {
            sess.status = 'active';
          }
          return { changes: sess ? 1 : 0 };
        }
        if (cleanSql.includes('DELETE FROM sessions WHERE id =')) {
          const before = self.sessions.length;
          self.sessions = self.sessions.filter(s => s.id !== params[0]);
          return { changes: before - self.sessions.length };
        }
        return { changes: 1 };
      }
    };
  }
}

function initDatabase() {
  try {
    const nativeReq = getNativeRequire();
    const DatabaseClass = nativeReq("better-sqlite3");
    const dbPath = getDbPath();
    const instance = new DatabaseClass(dbPath);
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
