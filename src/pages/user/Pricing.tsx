import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { Package } from '../../types';

const defaultPackages: Package[] = [
  { id: 1, name: 'Basic Strip (3 Foto)', price: 1500, photos_count: 3, duration: 5, description: 'Format strip klasik 3 foto' },
  { id: 2, name: 'Standard Strip (4 Foto)', price: 2500, photos_count: 4, duration: 5, description: 'Format strip populer 4 foto' },
  { id: 3, name: 'Grid Double (6 Foto)', price: 3500, photos_count: 6, duration: 10, description: 'Format grid 6 foto seru' },
  { id: 4, name: 'Unlimited Pass', price: 4500, photos_count: 8, duration: 15, description: 'Format penuh 8 foto lengkap' }
];

const Pricing: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.warn("Using default packages fallback:", err);
        setPackages(defaultPackages);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans py-24 px-4 selection:bg-primary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Pilih <span className="text-primary italic font-serif">Paket</span> Anda
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">
            Pilih paket yang sesuai dengan kebutuhan Anda. Semua paket sudah termasuk fitur editing foto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-[2rem] p-8 border border-white/5 hover:border-primary/40 transition-all flex flex-col items-center text-center group"
            >
              <h3 className="text-xl font-bold mb-8 group-hover:text-primary transition-colors">{pkg.name}</h3>
              
              {/* Photo Strip Graphic */}
              <div className="w-24 h-36 border-2 border-white/10 rounded-xl mb-8 flex flex-col p-2 gap-1.5 bg-white/5">
                <div className="flex-1 bg-white/5 rounded-sm"></div>
                <div className="flex-1 bg-white/5 rounded-sm"></div>
                <div className="flex-1 bg-white/5 rounded-sm"></div>
              </div>

              <div className="space-y-1 mb-8">
                <p className="text-xl font-black">{pkg.photos_count}x Shoot</p>
                <p className="text-sm text-slate-400 font-medium">{pkg.description}</p>
                <p className="text-sm text-slate-400 font-medium">{pkg.duration} Menit</p>
              </div>

              <div className="mb-2">
                <span className="text-3xl font-black text-primary">Rp {pkg.price.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-8">
                *Termasuk watermark photobooth
              </p>

              <Link
                to={`/payment/${pkg.id}`}
                className="w-full py-4 bg-bg-dark border border-white/5 text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-primary hover:border-primary transition-all shadow-lg"
              >
                <Camera size={18} />
                Pilih
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link to="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
