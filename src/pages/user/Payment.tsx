import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Download, Upload, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Package, formatDuration } from '../../types';
import { fetchPackages, createSessionApi, uploadPaymentProofApi } from '../../services/api';

const defaultPackages: Package[] = [
  { id: 1, name: 'Photobooth Kolase A', price: 1500, photos_count: 3, duration: 30, description: 'All digital copies,\n1 Photo Strip' },
  { id: 2, name: 'Photobooth Kolase B', price: 2500, photos_count: 4, duration: 60, description: 'All digital copies,\n1 Photo Strip' },
  { id: 3, name: 'Photobooth Kolase C', price: 3500, photos_count: 6, duration: 120, description: 'All digital copies,\n2 Photo Strip' },
  { id: 4, name: 'Photobooth Kolase D', price: 4500, photos_count: 8, duration: 180, description: 'All digital copies,\n2 Photo Strip' }
];

const Payment: React.FC = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 menit dalam detik

  useEffect(() => {
    fetchPackages()
      .then(data => {
        const found = data.find((p: Package) => Number(p.id) === Number(packageId));
        setPkg(found || defaultPackages.find(p => p.id === Number(packageId)) || defaultPackages[0]);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Using fallback package for payment:", err);
        const fallback = defaultPackages.find((p: Package) => p.id === Number(packageId)) || defaultPackages[0];
        setPkg(fallback);
        setLoading(false);
      });
  }, [packageId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProof(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePayment = async () => {
    if (!proof) {
      alert("Silakan upload bukti pembayaran terlebih dahulu.");
      return;
    }

    setProcessing(true);
    
    try {
      // 1. Buat Sesi di Firebase / API
      const sessionResult = await createSessionApi(Number(packageId) || 1, 'Pelanggan');
      const sessionId = sessionResult.sessionId;

      // 2. Unggah Bukti Pembayaran ke Firebase Storage / API
      if (sessionId && proof) {
        await uploadPaymentProofApi(sessionId, proof);
      }

      // Brief success state before navigating
      setProcessing(false);
      const successToast = document.createElement('div');
      successToast.className = "fixed top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-2xl z-[100] animate-bounce";
      successToast.innerText = "Bukti Pembayaran Terkirim! Membuka Studio...";
      document.body.appendChild(successToast);

      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
        navigate(`/studio/${sessionId}`, { replace: true });
      }, 1200);
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadQR = async () => {
    const qrUrl = "/qris.jpeg";
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'QR_Payment_Cies.jpeg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = 'QR_Payment_Cies.jpeg';
      link.click();
    }
  };

  if (loading) return null;
  if (!pkg) return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">Package not found</div>;

  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans py-12 px-4 selection:bg-primary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tight font-serif mb-4">
            Pembayaran <span className="text-primary italic">QR Code</span>
          </h1>
          <p className="text-slate-400 font-medium">Scan QR code dengan aplikasi dompet digital Anda</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl"
          >
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-black">
                <Clock size={16} />
                Waktu: {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="p-6 bg-white rounded-3xl shadow-2xl mb-6">
                <img 
                  src="/qris.jpeg" 
                  alt="QR Code Pembayaran Cies" 
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/qris.png';
                  }}
                />
              </div>
              
              <button 
                onClick={handleDownloadQR}
                className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-sm font-black w-full justify-center mb-4"
              >
                <Download size={18} />
                Download QR Code
              </button>
              
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Scan QR dengan DANA, OVO, GoPay, atau ShopeePay
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Upload Bukti Pembayaran *</label>
                <div className="relative aspect-video bg-black/20 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 transition-colors">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <Upload size={32} className="text-slate-500 mb-2" />
                      <p className="text-xs font-bold text-slate-500">Klik untuk upload</p>
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
                onClick={handlePayment}
                disabled={processing || !proof}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white mx-auto"></div>
                ) : (
                  "Konfirmasi Pembayaran"
                )}
              </button>
            </div>
          </motion.div>

          {/* Right Column: Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl"
          >
            <h2 className="text-2xl font-black tracking-tight font-serif mb-8">Detail <span className="text-primary italic">Pesanan</span></h2>
            
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-slate-400 font-medium">Paket</span>
                <span className="font-black">{pkg.name}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-slate-400 font-medium">Jumlah Shoot</span>
                <span className="font-black">{pkg.photos_count}x shoot</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-slate-400 font-medium">Durasi Edit</span>
                <span className="font-black">{formatDuration(pkg.duration)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-6">
                <span className="text-2xl font-black tracking-tight font-serif">Total</span>
                <span className="text-3xl font-black text-primary font-serif italic">
                  Rp {pkg.price.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-black/20 rounded-3xl p-8 border border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6">Detail Paket:</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>{pkg.photos_count}x shoot dalam 1 photo strip</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>{formatDuration(pkg.duration)} waktu foto/edit</span>
                </li>
                {pkg.description && (
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line">{pkg.description}</span>
                  </li>
                )}
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Bisa retake foto jika waktu masih tersisa</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/pricing" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm">
            <ArrowLeft size={16} />
            Kembali ke Paket
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Payment;
