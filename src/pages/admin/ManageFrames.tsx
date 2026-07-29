import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { Plus, Trash2, X, Save, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Frame } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

const ManageFrames: React.FC = () => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ photos_count: 4, image: null as File | null });
  const [preview, setPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = () => {
    setLoading(true);
    fetch('/api/frames')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch frames');
        return res.json();
      })
      .then(data => {
        setFrames(data);
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
      const compressedFile = await compressImage(formData.image, 1000, 0.8);
      const frameName = formData.image.name.replace(/\.[^/.]+$/, "") || 'Frame';
      let success = false;

      // Percobaan 1: FormData
      try {
        const data = new FormData();
        data.append('name', frameName);
        data.append('photos_count', formData.photos_count.toString());
        data.append('image', compressedFile);

        const res = await fetch('/api/frames', {
          method: 'POST',
          body: data
        });

        if (res.ok) {
          success = true;
        }
      } catch (e) {
        console.warn("FormData upload failed, trying base64 JSON fallback:", e);
      }

      // Percobaan 2: Base64 JSON fallback (Sangat andal di Vercel Serverless)
      if (!success) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
        const base64 = await base64Promise;

        const res = await fetch('/api/frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: frameName,
            photos_count: formData.photos_count,
            image_base64: base64
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Gagal mengunggah frame.");
        }
      }

      setIsModalOpen(false);
      setFormData({ photos_count: 4, image: null });
      setPreview(null);
      fetchFrames();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat menyimpan frame.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteCandidateId(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      const res = await fetch(`/api/frames/${deleteCandidateId}`, { method: 'DELETE' });
      if (!res.ok) {
        alert("Gagal menghapus frame.");
        return;
      }
      fetchFrames();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus frame.");
    } finally {
      setDeleteCandidateId(null);
    }
  };

  return (
    <AdminLayout title="Kelola Frame">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-12">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight font-serif">Kelola <span className="text-primary italic">Frame</span></h2>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={fetchFrames}
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
            Tambah Frame
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
        {frames.map(frame => (
          <div key={frame.id} className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden group hover:border-primary/50 transition-all flex flex-col justify-between p-4">
            <div className="aspect-[2/3] relative bg-black/20 rounded-2xl overflow-hidden mb-4 p-2">
              <img src={frame.image_url} alt="Frame" className="w-full h-full object-contain" />
            </div>
            <button 
              onClick={() => handleDelete(frame.id)}
              className="w-full py-3 bg-rose-400/10 border border-rose-400/20 rounded-xl hover:bg-rose-400/20 hover:border-rose-400/50 transition-all text-rose-400 text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} />
              Hapus Frame
            </button>
          </div>
        ))}
        {frames.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-slate-500 font-medium italic">Belum ada frame. Klik tombol "Tambah Frame" untuk mulai.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-bg-dark/90 backdrop-blur-md z-[100] flex items-start justify-center p-4 md:p-8 overflow-y-auto">
          <div className="relative max-w-lg w-full bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-10 my-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight font-serif">Tambah <span className="text-primary italic">Frame</span></h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Upload File Gambar Frame (PNG Transparan)</label>
                <div className="relative aspect-[2/3] bg-black/20 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <ImageIcon size={48} className="opacity-10 mb-4" />
                      <p className="text-xs font-bold text-slate-400">Klik atau drag untuk upload gambar frame</p>
                      <p className="text-[10px] text-slate-500 mt-1">Format PNG transparan disarankan</p>
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
                disabled={!formData.image || saving}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer mt-4"
              >
                {saving ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {saving ? 'Menyimpan...' : 'Upload Frame'}
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
              <h3 className="text-xl font-bold text-white">Hapus Frame?</h3>
              <p className="text-sm text-slate-400">Apakah Anda yakin ingin menghapus frame ini? Tindakan ini tidak dapat dibatalkan.</p>
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

export default ManageFrames;
