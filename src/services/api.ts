export const fetchPackages = async () => {
  const res = await fetch('/api/packages');
  if (!res.ok) throw new Error('Gagal mengambil daftar paket');
  return res.json();
};

export const fetchFrames = async () => {
  const res = await fetch('/api/frames');
  if (!res.ok) throw new Error('Gagal mengambil daftar frame');
  return res.json();
};

export const fetchStickers = async () => {
  const res = await fetch('/api/stickers');
  if (!res.ok) throw new Error('Gagal mengambil daftar stiker');
  return res.json();
};

export const fetchSessionById = async (id: string) => {
  const res = await fetch(`/api/sessions/${id}`);
  if (!res.ok) throw new Error('Gagal mengambil data sesi');
  return res.json();
};

export const createSessionApi = async (packageId: number, userName: string) => {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ package_id: packageId, user_name: userName }),
  });
  if (!res.ok) throw new Error('Gagal membuat sesi');
  return res.json();
};

export const uploadPaymentProofApi = async (sessionId: string, file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`/api/sessions/${sessionId}/proof`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Gagal mengunggah bukti pembayaran');
  return res.json();
};
