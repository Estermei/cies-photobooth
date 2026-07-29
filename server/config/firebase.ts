import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

export { doc, getDoc, setDoc };

let config: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json:", e);
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || config.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || config.appId
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const databaseId = process.env.FIREBASE_DATABASE_ID || config.firestoreDatabaseId || "(default)";

export const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);
