import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { Package, Frame, Sticker, Session } from "../types";

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAiOZ0F3Hpm383M4lmnFrRCdT50n19Jc6I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ciesphotobooth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ciesphotobooth",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ciesphotobooth.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "9387197908",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:9387197908:web:74350d83dee7f225ef0241",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FHRH0991H8"
};

// Initialize App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);

// Default packages seed
export const defaultPackages: Package[] = [
  { id: 1, name: 'Basic Strip (3 Foto)', price: 1500, photos_count: 3, duration: 5, description: 'Format strip klasik 3 foto' },
  { id: 2, name: 'Standard Strip (4 Foto)', price: 2500, photos_count: 4, duration: 5, description: 'Format strip populer 4 foto' },
  { id: 3, name: 'Grid Double (6 Foto)', price: 3500, photos_count: 6, duration: 10, description: 'Format grid 6 foto seru' },
  { id: 4, name: 'Unlimited Pass', price: 4500, photos_count: 8, duration: 15, description: 'Format penuh 8 foto lengkap' }
];

// --- PACKAGES ---
export async function getPackagesFromFirestore(): Promise<Package[]> {
  try {
    const snap = await getDocs(collection(db, "packages"));
    if (snap.empty) {
      // Seed default packages if empty
      for (const pkg of defaultPackages) {
        await setDoc(doc(db, "packages", pkg.id.toString()), pkg);
      }
      return defaultPackages;
    }
    return snap.docs.map(docSnap => ({
      id: isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id),
      ...docSnap.data()
    })) as Package[];
  } catch (err) {
    console.warn("Firestore getPackages error, returning defaults:", err);
    return defaultPackages;
  }
}

export async function savePackageToFirestore(pkgData: Partial<Package> & { id?: number | string }) {
  const id = pkgData.id ? pkgData.id.toString() : Date.now().toString();
  const pkgDoc = doc(db, "packages", id);
  const dataToSave = {
    ...pkgData,
    id: isNaN(Number(id)) ? id : Number(id)
  };
  await setDoc(pkgDoc, dataToSave, { merge: true });
  return dataToSave;
}

export async function deletePackageFromFirestore(id: number | string) {
  await deleteDoc(doc(db, "packages", id.toString()));
}

// --- FRAMES ---
export async function getFramesFromFirestore(): Promise<Frame[]> {
  try {
    const snap = await getDocs(collection(db, "frames"));
    return snap.docs.map(docSnap => ({
      id: isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id),
      ...docSnap.data()
    })) as Frame[];
  } catch (err) {
    console.warn("Firestore getFrames error:", err);
    return [];
  }
}

import { compressImage } from '../utils/imageCompressor';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Helper function to handle upload with Storage, with automatic Base64 fallback for free Spark tier
async function uploadToStorageWithTimeout(storageRef: any, fileToUpload: File, timeoutMs = 8000): Promise<string> {
  let file = fileToUpload;
  
  // Optimasi ukuran file jika di atas 500KB
  if (file.size > 500 * 1024) {
    try {
      file = await compressImage(fileToUpload, 1800, 0.88);
    } catch (e) {
      console.warn("Auto compression skipped:", e);
    }
  }

  try {
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Storage timeout"));
      }, timeoutMs);
    });

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err) {
    console.warn("Firebase Storage tidak aktif / butuh upgrade, mengalihkan ke penyimpanan Base64 Firestore:", err);
    // Fallback otomatis ke Base64 (tersimpan aman di Firestore gratis tanpa kartu kredit)
    const base64File = file.size > 400 * 1024 ? await compressImage(file, 1400, 0.82) : file;
    return await fileToBase64(base64File);
  }
}

export async function uploadFrameToFirebase(name: string, photosCount: number, file: File): Promise<Frame> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `frames/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const storageRef = ref(storage, fileName);

  const downloadURL = await uploadToStorageWithTimeout(storageRef, file);

  const newId = Date.now();
  const frameData = {
    id: newId,
    name,
    photos_count: photosCount,
    image_url: downloadURL,
    storagePath: fileName,
    created_at: new Date().toISOString()
  };

  await setDoc(doc(db, "frames", newId.toString()), frameData);
  return frameData as Frame;
}

export async function deleteFrameFromFirestore(id: number | string) {
  const frameDocRef = doc(db, "frames", id.toString());
  const snap = await getDoc(frameDocRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.storagePath) {
      try {
        await deleteObject(ref(storage, data.storagePath));
      } catch (e) {
        console.warn("Storage item delete skipped:", e);
      }
    }
  }
  await deleteDoc(frameDocRef);
}

// --- STICKERS ---
export async function getStickersFromFirestore(): Promise<Sticker[]> {
  try {
    const snap = await getDocs(collection(db, "stickers"));
    return snap.docs.map(docSnap => ({
      id: isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id),
      ...docSnap.data()
    })) as Sticker[];
  } catch (err) {
    console.warn("Firestore getStickers error:", err);
    return [];
  }
}

export async function uploadStickerToFirebase(name: string, file: File): Promise<Sticker> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `stickers/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const storageRef = ref(storage, fileName);

  const downloadURL = await uploadToStorageWithTimeout(storageRef, file);

  const newId = Date.now();
  const stickerData = {
    id: newId,
    name,
    image_url: downloadURL,
    storagePath: fileName,
    created_at: new Date().toISOString()
  };

  await setDoc(doc(db, "stickers", newId.toString()), stickerData);
  return stickerData as Sticker;
}

export async function deleteStickerFromFirestore(id: number | string) {
  const stickerDocRef = doc(db, "stickers", id.toString());
  const snap = await getDoc(stickerDocRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.storagePath) {
      try {
        await deleteObject(ref(storage, data.storagePath));
      } catch (e) {
        console.warn("Storage sticker delete skipped:", e);
      }
    }
  }
  await deleteDoc(stickerDocRef);
}

// --- SESSIONS ---
export async function getSessionsFromFirestore(): Promise<Session[]> {
  try {
    const snap = await getDocs(collection(db, "sessions"));
    return snap.docs.map(docSnap => docSnap.data() as Session);
  } catch (err) {
    console.warn("Firestore getSessions error:", err);
    return [];
  }
}

export async function getSessionByIdFromFirestore(sessionId: string): Promise<Session | null> {
  try {
    const docRef = doc(db, "sessions", sessionId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Session;
    }
    return null;
  } catch (err) {
    console.warn("Firestore getSessionById error:", err);
    return null;
  }
}

export async function createSessionInFirestore(packageId: number, userName: string): Promise<{ sessionId: string }> {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const packages = await getPackagesFromFirestore();
  const selectedPkg = packages.find(p => Number(p.id) === Number(packageId)) || packages[0] || defaultPackages[0];

  const sessionData: Session = {
    id: sessionId,
    package_id: selectedPkg.id,
    package_name: selectedPkg.name,
    price: selectedPkg.price,
    duration: selectedPkg.duration,
    user_name: userName || 'User',
    status: 'active', // Langsung aktif tanpa konfirmasi admin sesuai permintaan
    created_at: new Date().toISOString()
  };

  await setDoc(doc(db, "sessions", sessionId), sessionData);
  return { sessionId };
}

export async function uploadPaymentProofToFirebase(sessionId: string, file: File): Promise<{ success: boolean; imageUrl: string }> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `payments/${sessionId}_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, fileName);

  const downloadURL = await uploadToStorageWithTimeout(storageRef, file);

  const docRef = doc(db, "sessions", sessionId);
  await updateDoc(docRef, {
    payment_proof_url: downloadURL,
    status: 'active'
  });

  return { success: true, imageUrl: downloadURL };
}

export async function deleteSessionFromFirestore(sessionId: string) {
  await deleteDoc(doc(db, "sessions", sessionId));
}
