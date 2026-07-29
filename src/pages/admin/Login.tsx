import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Normalisasi input
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass })
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok && data.success) {
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else if (res.status === 401) {
        setError(data.error || 'Username atau password salah');
      } else {
        // Fallback validasi jika server memberikan status non-200/401
        if (trimmedUser === 'ciesadmin' && trimmedPass === 'ci3s0413') {
          localStorage.setItem('admin_auth', 'true');
          navigate('/admin');
        } else {
          setError(data.error || 'Username atau password salah');
        }
      }
    } catch (err) {
      // Fallback jika koneksi server bermasalah
      if (trimmedUser === 'ciesadmin' && trimmedPass === 'ci3s0413') {
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else {
        setError('Gagal terhubung ke server. Silakan coba lagi.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4 font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 shadow-2xl border border-white/10 relative z-10"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/10">
            <Lock className="text-primary" size={32} />
          </div>
          <h2 className="text-4xl font-black tracking-tight font-serif text-white">Admin <span className="text-primary italic">Access</span></h2>
          <p className="text-slate-400 font-medium mt-3">Silakan masuk untuk mengelola sistem</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-rose-400 text-sm font-bold flex items-center gap-2 bg-rose-400/10 p-4 rounded-xl border border-rose-400/20"
            >
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
