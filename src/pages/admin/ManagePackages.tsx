import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { Plus, Trash2, Edit2, X, Save, RefreshCw, Package as PackageIcon } from 'lucide-react';
import { Package } from '../../types';

const defaultPackages: Package[] = [
  { id: 1, name: 'Basic Strip (3 Foto)', price: 1500, photos_count: 3, duration: 5, description: 'Format strip klasik 3 foto' },
  { id: 2, name: 'Standard Strip (4 Foto)', price: 2500, photos_count: 4, duration: 5, description: 'Format strip populer 4 foto' },
  { id: 3, name: 'Grid Double (6 Foto)', price: 3500, photos_count: 6, duration: 10, description: 'Format grid 6 foto seru' },
  { id: 4, name: 'Unlimited Pass', price: 4500, photos_count: 8, duration: 15, description: 'Format penuh 8 foto lengkap' }
];

const ManagePackages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration: 0,
    photos_count: 0,
    description: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = () => {
    setLoading(true);
    fetch('/api/packages')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch packages');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPackages(data);
        } else {
          setPackages(defaultPackages);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPackages(defaultPackages);
        setLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPackage ? `/api/packages/${editingPackage.id}` : '/api/packages';
    const method = editingPackage ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      alert("Gagal menyimpan paket.");
      return;
    }

    setIsModalOpen(false);
    setEditingPackage(null);
    setFormData({ name: '', price: 0, duration: 0, photos_count: 0, description: '' });
    fetchPackages();
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      photos_count: pkg.photos_count,
      description: pkg.description
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteCandidateId(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      const res = await fetch(`/api/packages/${deleteCandidateId}`, { method: 'DELETE' });
      if (!res.ok) {
        alert("Gagal menghapus paket.");
        return;
      }
      fetchPackages();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus paket.");
    } finally {
      setDeleteCandidateId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price).replace('Rp', 'Rp ');
  };

  return (
    <AdminLayout title="Kelola Paket">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-12">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight font-serif">Kelola <span className="text-primary italic">Paket</span></h2>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={fetchPackages}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs sm:text-sm font-bold"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingPackage(null);
              setFormData({ name: '', price: 0, duration: 0, photos_count: 0, description: '' });
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl hover:bg-opacity-90 transition-all text-xs sm:text-sm font-bold shadow-lg shadow-primary/20"
          >
            <Plus size={16} />
            Tambah Paket
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 sm:px-8 py-4 sm:py-6">Nama</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6">Harga</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6">Foto</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6">Durasi</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6">Status</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {packages.map(pkg => (
              <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  {pkg.name}
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm font-bold text-slate-400 whitespace-nowrap">
                  {formatPrice(pkg.price)}
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm font-bold text-slate-400 whitespace-nowrap">
                  {pkg.photos_count}x
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm font-bold text-slate-400 whitespace-nowrap">
                  {pkg.duration} menit
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                  <span className="px-3 py-1 bg-emerald-400/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                    Aktif
                  </span>
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-center whitespace-nowrap">
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    <button 
                      onClick={() => handleEdit(pkg)} 
                      className="p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/50 transition-all text-slate-400 hover:text-primary"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(pkg.id)} 
                      className="p-2.5 sm:p-3 bg-rose-400/10 border border-rose-400/20 rounded-xl hover:bg-rose-400/20 hover:border-rose-400/50 transition-all text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-bg-dark/90 backdrop-blur-md z-[100] flex items-start justify-center p-4 md:p-8 overflow-y-auto">
          <div className="relative max-w-lg w-full bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-10 my-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black tracking-tight font-serif">
                {editingPackage ? 'Edit' : 'Tambah'} <span className="text-primary italic">Paket</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nama Paket</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Contoh: Photobooth Kolase A"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Jumlah Foto</label>
                <input
                  type="number"
                  required
                  value={formData.photos_count}
                  onChange={e => setFormData({ ...formData, photos_count: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Detail paket..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 mt-4"
              >
                <Save size={20} />
                {editingPackage ? 'Simpan Perubahan' : 'Buat Paket Baru'}
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
              <h3 className="text-xl font-bold text-white">Hapus Paket?</h3>
              <p className="text-sm text-slate-400">Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.</p>
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

export default ManagePackages;
