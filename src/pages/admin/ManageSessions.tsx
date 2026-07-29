import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { CheckCircle, XCircle, Eye, Clock, Calendar, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { Session } from '../../types';

const ManageSessions: React.FC = () => {
  const [sessions, setSessions] = useState<(Session & { price: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    setLoading(true);
    fetch('/api/admin/sessions')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
      })
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        alert("Gagal menyetujui sesi.");
        return;
      }
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyetujui sesi.");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteCandidateId(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      const res = await fetch(`/api/admin/sessions/${deleteCandidateId}`, { method: 'DELETE' });
      if (!res.ok) {
        alert("Gagal menghapus riwayat.");
        return;
      }
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus riwayat.");
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Baru Saja';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Baru Saja';
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace('.', ':');
  };

  return (
    <AdminLayout title="Riwayat Pembayaran">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-12">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight font-serif">Riwayat <span className="text-primary italic">Pembayaran</span></h2>
        <button 
          onClick={fetchSessions}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs sm:text-sm font-bold w-full sm:w-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 sm:px-8 py-4 sm:py-6">Tanggal</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6">Paket</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6">Jumlah</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6 text-center">Status</th>
              <th className="px-4 sm:px-8 py-4 sm:py-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sessions.map(session => (
              <tr key={session.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm font-medium text-slate-300 whitespace-nowrap">
                  {formatDate(session.created_at)}
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  {session.package_name || 'Paket Photobooth'}
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm font-black text-primary whitespace-nowrap">
                  {formatPrice(session.price || 0)}
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-center whitespace-nowrap">
                  {session.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock size={12} /> Menunggu Approval
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle size={12} /> Disetujui
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-8 py-4 sm:py-6 text-center whitespace-nowrap">
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {session.payment_proof_url ? (
                      <button 
                        onClick={() => setSelectedProof(session.payment_proof_url!)}
                        className="p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/50 transition-all text-slate-400 hover:text-primary"
                        title="Lihat Bukti"
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <div className="p-2.5 sm:p-3 opacity-20">
                        <Eye size={16} />
                      </div>
                    )}
                    {session.status === 'pending' && (
                      <button 
                        onClick={() => handleApprove(session.id)}
                        className="p-2.5 sm:p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl hover:bg-emerald-400/20 hover:border-emerald-400/50 transition-all text-emerald-400"
                        title="Approve Pembayaran"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(session.id)}
                      className="p-2.5 sm:p-3 bg-rose-400/10 border border-rose-400/20 rounded-xl hover:bg-rose-400/20 hover:border-rose-400/50 transition-all text-rose-400"
                      title="Hapus Riwayat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-slate-500 font-medium italic">
                  Belum ada riwayat pembayaran.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-bg-dark/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="relative max-w-2xl w-full bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight font-serif">Bukti <span className="text-primary italic">Pembayaran</span></h3>
              <button 
                onClick={() => setSelectedProof(null)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-12 flex justify-center bg-black/20">
              <img 
                src={selectedProof} 
                alt="Payment Proof" 
                className="max-h-[60vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
            <div className="p-8 border-t border-white/5 flex justify-end gap-4">
              <a 
                href={selectedProof} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold"
              >
                <ExternalLink size={16} />
                Buka di Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidateId !== null && (
        <div className="fixed inset-0 bg-bg-dark/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-sm w-full bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Hapus Riwayat?</h3>
              <p className="text-sm text-slate-400">Apakah Anda yakin ingin menghapus riwayat pembayaran ini? Tindakan ini tidak dapat dibatalkan.</p>
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

export default ManageSessions;
