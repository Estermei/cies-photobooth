import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { Plus, Trash2, X, Upload, Sticker as StickerIcon, RefreshCw } from 'lucide-react';
import { Sticker } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

const ManageStickers: React.FC = () => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', image: null as File | null });
  const [preview, setPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStickers();
  }, []);

  const fetchStickers = () => {
    setLoading(true);
    fetch('/api/stickers')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch stickers');
        return res.json();
      })
      .then(data => {
        setStickers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image || saving) return;

    setSaving(true);
    try {
      const compressedFile = await compressImage(formData.image, 1000, 0.85);
      const data = new FormData();
      data.append('name', formData.name || formData.image.name.replace(/\.[^/.]+$/, ""));
      data.append('image', compressedFile);

      const res = await fetch('/api/stickers', {
        method: 'POST',
        body: data
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal mengunggah stiker.");
      }

      setIsModalOpen(false);
      setFormData({ name: '', image: null });
      setPreview(null);
      fetchStickers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal mengunggah stiker.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteCandidateId(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      const res = await fetch(`/api/stickers/${deleteCandidateId}`, { method: 'DELETE' });
      if (!res.ok) {
        alert("Gagal menghapus stiker.");
        return;
      }
      fetchStickers();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus stiker.");
    } finally {
      setDeleteCandidateId(null);
    }
  };

  return (
    <AdminLayout title="Kelola Stiker">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-12">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight font-serif">Kelola <span className="text-primary italic">Stiker Gambar</span></h2>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={fetchStickers}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs sm:text-sm font-bold"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl hover:bg-opacity-90 transition-all text-xs sm:text-sm font-bold shadow-lg shadow-primary/20"
          >
            <Plus size={16} />
            Tambah Stiker
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-8">
        {stickers.map(sticker => (
          <div key={sticker.id} className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden group hover:border-primary/50 transition-all">
            <div className="aspect-square relative p-8 bg-black/20">
              <img src={sticker.image_url} alt={sticker.name} className="w-full h-full object-contain" />
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs font-bold text-white text-center truncate">{sticker.name}</p>
              <button 
                onClick={() => handleDelete(sticker.id)}
                className="w-full py-2 bg-rose-400/10 border border-rose-400/20 rounded-lg hover:bg-rose-400/20 hover:border-rose-400/50 transition-all text-rose-400 text-[10px] font-black flex items-center justify-center gap-2"
              >
                <Trash2 size={12} />
                Hapus
              </button>
            </div>
          </div>
        ))}
        {stickers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
            <StickerIcon size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-slate-500 font-medium italic">Belum ada stiker. Klik tombol "Tambah Stiker" untuk mulai.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-bg-dark/90 backdrop-blur-md z-[100] flex items-start justify-center p-4 md:p-8 overflow-y-auto">
          <div className="relative max-w-lg w-full bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-10 my-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black tracking-tight font-serif">Tambah <span className="text-primary italic">Stiker</span></h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nama Stiker</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Contoh: Stiker Bintang"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">File Gambar (PNG/SVG Transparan)</label>
                <div className="relative aspect-square bg-black/20 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain p-8" />
                  ) : (
                    <>
                      <StickerIcon size={48} className="opacity-10 mb-4" />
                      <p className="text-xs font-bold text-slate-500">Klik untuk upload gambar</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.image}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-4"
              >
                <Upload size={20} />
                Upload Stiker
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteCandidateId !== null && (
        <div className="fixed inset-0 bg-bg-dark/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-sm w-full bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Hapus Stiker?</h3>
              <p className="text-sm text-slate-400">Apakah Anda yakin ingin menghapus stiker ini? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteCandidateId(null)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold text-white"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-500 rounded-xl hover:bg-rose-600 transition-all text-sm font-bold text-white shadow-lg shadow-rose-500/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageStickers;
