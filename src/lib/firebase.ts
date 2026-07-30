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

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
  { id: 1, name: 'Photobooth Kolase A', price: 1500, photos_count: 3, duration: 1, description: 'Format 3 foto (1 menit)' },
  { id: 2, name: 'Photobooth Kolase B', price: 2500, photos_count: 4, duration: 2, description: 'Format 4 foto (2 menit)' },
  { id: 3, name: 'Photobooth Kolase C', price: 3500, photos_count: 6, duration: 3, description: 'Format 6 foto (3 menit)' },
  { id: 4, name: 'Photobooth Kolase D', price: 4500, photos_count: 8, duration: 4, description: 'Format 8 foto (4 menit)' }
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
    const pkgs = snap.docs.map(docSnap => ({
      id: isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id),
      ...docSnap.data()
    })) as Package[];

    // Auto-update legacy package names to new names if old names are detected
    let updated = false;
    for (const pkg of pkgs) {
      const def = defaultPackages.find(d => Number(d.id) === Number(pkg.id));
      if (def && (pkg.name.includes('Strip') || pkg.name.includes('Grid') || pkg.name.includes('Unlimited'))) {
        pkg.name = def.name;
        pkg.duration = def.duration;
        pkg.photos_count = def.photos_count;
        pkg.price = def.price;
        pkg.description = def.description;
        await setDoc(doc(db, "packages", pkg.id.toString()), pkg, { merge: true });
        updated = true;
      }
    }

    return pkgs;
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
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id
      };
    }) as unknown as Frame[];
  } catch (err) {
    console.warn("Firestore getFrames error:", err);
    return [];
  }
}

import { compressImage } from '../utils/imageCompressor';

// Helper function to convert file to lightweight Base64 preserving transparency
async function compressAndConvertToBase64(file: File, maxDim = 800): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        let dataUrl = canvas.toDataURL(mimeType, 0.8);
        
        if (dataUrl.length > 500000) {
          canvas.width = Math.round(width * 0.7);
          canvas.height = Math.round(height * 0.7);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL(mimeType, 0.7);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// Helper function to handle upload with Storage, with fast automatic Base64 fallback
async function uploadToStorageWithTimeout(storageRef: any, fileToUpload: File, timeoutMs = 300): Promise<string> {
  try {
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("Storage timeout")), timeoutMs);
    });

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err) {
    return await compressAndConvertToBase64(fileToUpload, 800);
  }
}

export async function uploadFrameToFirebase(name: string, photosCount: number, file: File): Promise<Frame> {
  let downloadURL = '';
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `frames/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storageRef = ref(storage, fileName);
    downloadURL = await uploadToStorageWithTimeout(storageRef, file, 300);
  } catch (e) {
    downloadURL = await compressAndConvertToBase64(file, 800);
  }

  if (!downloadURL) {
    downloadURL = await compressAndConvertToBase64(file, 800);
  }

  const newId = Date.now().toString();
  const frameData = {
    id: newId,
    name,
    photos_count: photosCount,
    image_url: downloadURL,
    created_at: new Date().toISOString()
  };

  await setDoc(doc(db, "frames", newId), frameData);
  return frameData as unknown as Frame;
}

export async function deleteFrameFromFirestore(id: number | string) {
  if (id === null || id === undefined) return;
  const docIdStr = id.toString();
  
  try {
    await deleteDoc(doc(db, "frames", docIdStr));
  } catch (e) {
    console.warn("Direct delete frame error:", e);
  }

  try {
    const snap = await getDocs(collection(db, "frames"));
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (docSnap.id === docIdStr || data.id?.toString() === docIdStr || String(data.id) === String(id)) {
        await deleteDoc(docSnap.ref);
      }
    }
  } catch (err) {
    console.error("Failed to delete frame from collection:", err);
  }
}

// --- STICKERS ---
export async function getStickersFromFirestore(): Promise<Sticker[]> {
  try {
    const snap = await getDocs(collection(db, "stickers"));
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id
      };
    }) as unknown as Sticker[];
  } catch (err) {
    console.warn("Firestore getStickers error:", err);
    return [];
  }
}

export async function uploadStickerToFirebase(name: string, file: File): Promise<Sticker> {
  let downloadURL = '';
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `stickers/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storageRef = ref(storage, fileName);
    downloadURL = await uploadToStorageWithTimeout(storageRef, file, 300);
  } catch (e) {
    downloadURL = await compressAndConvertToBase64(file, 600);
  }

  if (!downloadURL) {
    downloadURL = await compressAndConvertToBase64(file, 600);
  }

  const newId = Date.now().toString();
  const stickerData = {
    id: newId,
    name,
    image_url: downloadURL,
    created_at: new Date().toISOString()
  };

  await setDoc(doc(db, "stickers", newId), stickerData);
  return stickerData as unknown as Sticker;
}

export async function deleteStickerFromFirestore(id: number | string) {
  if (id === null || id === undefined) return;
  const docIdStr = id.toString();
  
  try {
    await deleteDoc(doc(db, "stickers", docIdStr));
  } catch (e) {
    console.warn("Direct delete sticker error:", e);
  }

  try {
    const snap = await getDocs(collection(db, "stickers"));
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (docSnap.id === docIdStr || data.id?.toString() === docIdStr || String(data.id) === String(id)) {
        await deleteDoc(docSnap.ref);
      }
    }
  } catch (err) {
    console.error("Failed to delete sticker from collection:", err);
  }
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
    package_id: typeof selectedPkg.id === 'number' ? selectedPkg.id : Number(selectedPkg.id) || 1,
    package_name: selectedPkg.name,
    price: selectedPkg.price,
    duration: selectedPkg.duration || 1,
    photos_count: selectedPkg.photos_count || 3,
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
