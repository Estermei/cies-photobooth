import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sparkles, QrCode } from 'lucide-react';
import { motion } from 'motion/react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans selection:bg-primary/30">
      {/* Navigation / Logo */}
      <nav className="pt-12 pb-8 text-center">
        <h1 className="text-3xl font-black tracking-[0.2em] uppercase">
          CIES <span className="text-primary">PHOTOBOOTH</span>
        </h1>
      </nav>

      {/* Hero Section */}
      <header className="relative flex flex-col items-center justify-center pt-12 pb-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-12"
        >
          <Sparkles size={14} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Photobooth Digital</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            <span className="text-primary italic font-serif">Snap & Edit</span><br />
            Dalam Sekejap
          </h2>
          <p className="text-lg md:text-xl font-medium text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Aplikasi photobooth berbasis web dengan fitur editing, filter, dan pembayaran digital QR Code yang praktis.
          </p>
          <Link 
            to="/pricing"
            className="inline-flex items-center justify-center h-[55px] w-[170px] bg-primary text-white rounded-xl text-base leading-5 font-bold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-primary/20"
          >
            Lihat Paket
          </Link>
        </motion.div>
      </header>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ y: -10 }}
            className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all group"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Camera className="text-primary" size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Foto Instan</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Ambil foto langsung dari kamera perangkat Anda dengan berbagai pilihan frame menarik
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all group"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Sparkles className="text-primary" size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Edit Kreatif</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Tambahkan filter, efek visual, dan stiker untuk membuat foto Anda lebih menarik
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all group"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <QrCode className="text-primary" size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Bayar QR Code</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Pembayaran mudah dan aman menggunakan dompet digital favorit Anda
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-6 text-center">
        <div className="mb-20">
          <h2 className="text-5xl font-black mb-4">Cara <span className="text-primary italic font-serif">Kerja</span></h2>
          <p className="text-slate-400 font-medium">Mudah dan cepat, hanya 4 langkah</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/50 border-2 border-primary/30 flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-primary/20">1</div>
            <h4 className="text-xl font-bold mb-2">Pilih Paket</h4>
            <p className="text-sm text-slate-500 font-medium">Pilih paket yang sesuai kebutuhan</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/50 border-2 border-primary/30 flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-primary/20">2</div>
            <h4 className="text-xl font-bold mb-2">Bayar QR Code</h4>
            <p className="text-sm text-slate-500 font-medium">Scan QR dan bayar dengan mudah</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/50 border-2 border-primary/30 flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-primary/20">3</div>
            <h4 className="text-xl font-bold mb-2">Ambil & Edit</h4>
            <p className="text-sm text-slate-500 font-medium">Foto dan edit sesuka hati</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/50 border-2 border-primary/30 flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-primary/20">4</div>
            <h4 className="text-xl font-bold mb-2">Download</h4>
            <p className="text-sm text-slate-500 font-medium">Simpan hasilnya</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center">
        <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-4">
          CIES <span className="text-primary">PHOTOBOOTH</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium">© 2025 Cies Photobooth. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
