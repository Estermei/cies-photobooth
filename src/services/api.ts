import { 
  getPackagesFromFirestore, 
  savePackageToFirestore, 
  deletePackageFromFirestore,
  getFramesFromFirestore, 
  uploadFrameToFirebase, 
  deleteFrameFromFirestore,
  getStickersFromFirestore, 
  uploadStickerToFirebase, 
  deleteStickerFromFirestore,
  getSessionsFromFirestore, 
  getSessionByIdFromFirestore, 
  createSessionInFirestore, 
  uploadPaymentProofToFirebase,
  deleteSessionFromFirestore
} from '../lib/firebase';
import { Package, Frame, Sticker, Session } from '../types';

// PACKAGES
export const fetchPackages = async (): Promise<Package[]> => {
  try {
    return await getPackagesFromFirestore();
  } catch (err) {
    console.warn("Using /api/packages fallback:", err);
    const res = await fetch('/api/packages');
    if (!res.ok) throw new Error('Gagal mengambil daftar paket');
    return res.json();
  }
};

export const savePackageApi = async (pkgData: Partial<Package> & { id?: number | string }) => {
  try {
    return await savePackageToFirestore(pkgData);
  } catch (err) {
    console.warn("Using /api/packages endpoint fallback:", err);
    const url = pkgData.id ? `/api/packages/${pkgData.id}` : '/api/packages';
    const method = pkgData.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkgData)
    });
    if (!res.ok) throw new Error("Gagal menyimpan paket");
    return res.json();
  }
};

export const deletePackageApi = async (id: number | string) => {
  try {
    await deletePackageFromFirestore(id);
    return { success: true };
  } catch (err) {
    console.warn("Using /api/packages DELETE fallback:", err);
    const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Gagal menghapus paket");
    return res.json();
  }
};

// FRAMES
export const fetchFrames = async (): Promise<Frame[]> => {
  try {
    return await getFramesFromFirestore();
  } catch (err) {
    console.warn("Using /api/frames fallback:", err);
    const res = await fetch('/api/frames');
    if (!res.ok) throw new Error('Gagal mengambil daftar frame');
    return res.json();
  }
};

export const uploadFrameApi = async (name: string, photosCount: number, file: File): Promise<Frame> => {
  try {
    return await uploadFrameToFirebase(name, photosCount, file);
  } catch (err) {
    console.warn("Using /api/frames upload fallback:", err);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('photos_count', photosCount.toString());
    formData.append('image', file);
    const res = await fetch('/api/frames', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Gagal mengunggah frame');
    return res.json();
  }
};

export const deleteFrameApi = async (id: number | string) => {
  try {
    await deleteFrameFromFirestore(id);
    return { success: true };
  } catch (err) {
    console.warn("Using /api/frames DELETE fallback:", err);
    const res = await fetch(`/api/frames/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus frame');
    return res.json();
  }
};

// STICKERS
export const fetchStickers = async (): Promise<Sticker[]> => {
  try {
    return await getStickersFromFirestore();
  } catch (err) {
    console.warn("Using /api/stickers fallback:", err);
    const res = await fetch('/api/stickers');
    if (!res.ok) throw new Error('Gagal mengambil daftar stiker');
    return res.json();
  }
};

export const uploadStickerApi = async (name: string, file: File): Promise<Sticker> => {
  try {
    return await uploadStickerToFirebase(name, file);
  } catch (err) {
    console.warn("Using /api/stickers upload fallback:", err);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', file);
    const res = await fetch('/api/stickers', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Gagal mengunggah stiker');
    return res.json();
  }
};

export const deleteStickerApi = async (id: number | string) => {
  try {
    await deleteStickerFromFirestore(id);
    return { success: true };
  } catch (err) {
    console.warn("Using /api/stickers DELETE fallback:", err);
    const res = await fetch(`/api/stickers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus stiker');
    return res.json();
  }
};

// SESSIONS
export const fetchSessions = async (): Promise<Session[]> => {
  try {
    return await getSessionsFromFirestore();
  } catch (err) {
    console.warn("Using /api/sessions fallback:", err);
    const res = await fetch('/api/sessions');
    if (!res.ok) throw new Error('Gagal mengambil daftar sesi');
    return res.json();
  }
};

export const fetchSessionById = async (id: string): Promise<Session | null> => {
  try {
    const session = await getSessionByIdFromFirestore(id);
    if (session) return session;
  } catch (err) {
    console.warn("Firestore fetchSessionById error, trying backend:", err);
  }
  
  try {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) throw new Error('Gagal mengambil data sesi');
    return res.json();
  } catch (err) {
    console.error("Session fetch failed completely:", err);
    return null;
  }
};

export const createSessionApi = async (packageId: number, userName: string) => {
  try {
    return await createSessionInFirestore(packageId, userName);
  } catch (err) {
    console.warn("Using /api/sessions POST fallback:", err);
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: packageId, user_name: userName }),
    });
    if (!res.ok) throw new Error('Gagal membuat sesi');
    return res.json();
  }
};

export const uploadPaymentProofApi = async (sessionId: string, file: File) => {
  try {
    return await uploadPaymentProofToFirebase(sessionId, file);
  } catch (err) {
    console.warn("Using /api/sessions proof upload fallback:", err);
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`/api/sessions/${sessionId}/proof`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Gagal mengunggah bukti pembayaran');
    return res.json();
  }
};

export const deleteSessionApi = async (sessionId: string) => {
  try {
    await deleteSessionFromFirestore(sessionId);
    return { success: true };
  } catch (err) {
    console.warn("Using /api/sessions DELETE fallback:", err);
    const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus sesi');
    return res.json();
  }
};
