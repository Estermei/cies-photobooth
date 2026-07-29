import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, CheckCircle2, Timer, Monitor, Sparkles, Info, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session } from '../../types';
import { set as idbSet } from 'idb-keyval';

const Studio: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMirror, setIsMirror] = useState(true);
  const [intervalTime, setIntervalTime] = useState<3 | 5>(3);
  const [timeLeft, setTimeLeft] = useState<number>(-1);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const timeLeftRef = useRef<number>(-1);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    const checkSession = async () => {
      let sessionData: Session | null = null;
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          sessionData = await res.json();
        }
      } catch (error) {
        console.warn("Error checking session API:", error);
      }

      if (sessionData) {
        sessionData.status = 'active';
      } else {
        sessionData = {
          id: sessionId || 'cies-session',
          package_id: 1,
          status: 'active',
          photos_count: 4,
          duration: 5,
          created_at: new Date().toISOString()
        } as Session;
      }

      setSession(sessionData);
      startCamera();
      if (sessionData.duration) {
        setTimeLeft(sessionData.duration * 60);
      } else {
        setTimeLeft(300);
      }
    };

    checkSession();
  }, [sessionId]);

  // Hitung mundur pewaktu sesi
  useEffect(() => {
    if (session?.status === 'active' && isSessionStarted && timeLeft !== -1) {
      if (timeLeft > 0) {
        const timer = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
      } else {
        // Waktu habis! Otomatis arahkan ke editor
        const finishOnTimeout = async () => {
          if (photos.length > 0) {
            await idbSet(`photos_${sessionId}`, photos);
          }
          navigate(`/editor/${sessionId}`);
        };
        finishOnTimeout();
      }
    }
  }, [session?.status, isSessionStarted, timeLeft, photos, sessionId, navigate]);

  const startCamera = async () => {
    if (stream) return; // Already started
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const startAutoCapture = async () => {
    if (!session || session.status !== 'active' || isAutoCapturing) return;
    
    if (!isSessionStarted) {
      setIsSessionStarted(true);
    }
    
    const totalPhotos = session.photos_count || 3;
    const currentCount = photos.length;
    const remaining = totalPhotos - currentCount;

    if (remaining <= 0) {
      if (confirm("Kuota foto sudah penuh. Hapus semua dan mulai ulang?")) {
        setPhotos([]);
      } else {
        return;
      }
    }

    setIsAutoCapturing(true);
    
    const photosToTake = remaining > 0 ? remaining : totalPhotos;
    if (remaining <= 0) setPhotos([]);

    for (let i = 0; i < photosToTake; i++) {
      setCountdown(intervalTime);
      
      for (let c = intervalTime; c > 0; c--) {
        if (timeLeftRef.current <= 0) break;
        setCountdown(c);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (timeLeftRef.current <= 0) break;
      setCountdown(null);
      capture();
      
      if (i < photosToTake - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsAutoCapturing(false);
  };

  const deletePhoto = (index: number) => {
    if (isAutoCapturing) return;
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const resetPhotos = () => {
    if (isAutoCapturing) return;
    if (confirm("Hapus semua foto dan mulai ulang?")) {
      setPhotos([]);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const vidWidth = video.videoWidth;
        const vidHeight = video.videoHeight;
        
        // Menggunakan rasio aspek 4:3 presisi sesuai slot tata letak photobooth
        const targetAspectRatio = 4 / 3;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = vidWidth;
        let sourceHeight = vidHeight;
        
        const currentAspectRatio = vidWidth / vidHeight;
        
        if (currentAspectRatio > targetAspectRatio) {
          // Stream lebih lebar (misal 16:9), potong bagian samping
          sourceWidth = vidHeight * targetAspectRatio;
          sourceX = (vidWidth - sourceWidth) / 2;
        } else if (currentAspectRatio < targetAspectRatio) {
          // Stream lebih tinggi, potong bagian atas dan bawah
          sourceHeight = vidWidth / targetAspectRatio;
          sourceY = (vidHeight - sourceHeight) / 2;
        }
        
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        
        // Bersihkan kanvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Tangani cermin (mirror) saat pengambilan gambar
        if (isMirror) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        
        // Gambar bagian yang dipotong
        context.drawImage(
          video, 
          sourceX, sourceY, sourceWidth, sourceHeight, // Pemotongan sumber
          0, 0, canvas.width, canvas.height // Penyesuaian tujuan
        );
        
        // Reset matriks transformasi jika di-cermin
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // Gunakan JPEG kualitas 0.95 untuk gambar resolusi tinggi di IndexedDB
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setPhotos(prev => [...prev, dataUrl]);
        
        // Efek kilat (flash)
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 100);
      }
    }
  };

  const handleFinish = async () => {
    if (photos.length === 0) {
      alert("Ambil foto terlebih dahulu sebelum melanjutkan.");
      return;
    }
    try {
      // Gunakan IndexedDB via idb-keyval untuk menghindari batas kuota localStorage
      await idbSet(`photos_${sessionId}`, photos);
      navigate(`/editor/${sessionId}`);
    } catch (e) {
      console.error("Error saving photos to IndexedDB:", e);
      alert("Gagal menyimpan foto. Pastikan browser Anda mengizinkan penyimpanan data.");
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans flex flex-col items-center py-12 px-4 overflow-x-hidden">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-4">
          Photobooth <span className="text-primary italic font-serif">Studio</span>
        </h1>
        <div className="flex items-center justify-center gap-6 text-sm font-bold">
          <div className="opacity-60">Foto: {photos.length}/{session.photos_count}</div>
          <div className="text-rose-500 flex items-center gap-1.5">
            Waktu: {formatTime(timeLeft)} {!isSessionStarted && <span className="text-xs text-slate-400 font-medium">(Belum dimulai)</span>}
          </div>
        </div>
        {photos.length >= session.photos_count && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-emerald-400 font-black uppercase tracking-widest text-xs"
          >
            Sesi Selesai! Mengalihkan ke Editor...
          </motion.div>
        )}
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Camera & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative max-w-2xl mx-auto w-full bg-white/5 rounded-3xl p-3 sm:p-4 border border-white/5 shadow-2xl">
            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${isMirror ? 'scale-x-[-1]' : ''}`}
              />
              
              {/* Flash Overlay */}
              <AnimatePresence>
                {isCapturing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-30"
                  />
                )}
              </AnimatePresence>

              {/* Countdown Overlay */}
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div 
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-40"
                  >
                    <span className="text-8xl sm:text-[12rem] font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex flex-wrap items-center justify-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 w-full max-w-xl">
              <div className="flex items-center gap-2 px-3 opacity-60 text-xs font-bold uppercase tracking-widest">
                <Timer size={14} />
                Jeda:
              </div>
              <button 
                onClick={() => setIntervalTime(3)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${intervalTime === 3 ? 'bg-primary text-white' : 'hover:bg-white/5'}`}
              >
                3 dtk
              </button>
              <button 
                onClick={() => setIntervalTime(5)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${intervalTime === 5 ? 'bg-primary text-white' : 'hover:bg-white/5'}`}
              >
                5 dtk
              </button>
              <div className="w-px h-5 bg-white/10 mx-1"></div>
              <button 
                onClick={() => setIsMirror(!isMirror)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isMirror ? 'bg-primary text-white' : 'hover:bg-white/5'}`}
              >
                <Monitor size={14} />
                Mirror
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-xl">
              <button
                onClick={startAutoCapture}
                disabled={isAutoCapturing || timeLeft <= 0}
                className="flex-1 px-5 py-3.5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 text-xs sm:text-sm whitespace-nowrap min-h-[3.25rem]"
              >
                <Camera size={18} />
                {photos.length > 0 && photos.length < session.photos_count 
                  ? `Lengkapi Foto (${session.photos_count - photos.length})` 
                  : photos.length >= session.photos_count 
                    ? "Mulai Ulang Sesi" 
                    : `Mulai Foto (${session.photos_count} foto)`}
              </button>

              <button
                onClick={handleFinish}
                disabled={photos.length === 0 || isAutoCapturing}
                className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap min-h-[3.25rem]"
              >
                <Sparkles size={18} className="text-primary" />
                Lanjut ke Editor
              </button>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-500 text-center">
            Klik tombol untuk memulai sesi foto otomatis dengan jeda {intervalTime} detik antar foto.
          </p>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Photos Preview */}
          <div className="bg-white/5 rounded-[2rem] border border-white/5 p-8">
            <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest">
              <ImageIcon size={18} className="text-primary" />
              Foto Anda ({photos.length}/{session.photos_count})
            </div>
            
            <div className="aspect-video bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden">
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 p-2 w-full h-full overflow-y-auto custom-scrollbar">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative group aspect-video">
                      <img src={photo} alt="Capture" className="w-full h-full object-cover rounded-lg border border-white/10" />
                      {!isAutoCapturing && (
                        <button 
                          onClick={() => deletePhoto(i)}
                          className="absolute top-1 right-1 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                          title={`Foto ulang foto #${i + 1}`}
                        >
                          <RefreshCw size={13} />
                        </button>
                      )}
                      <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">
                        #{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <Camera size={32} className="opacity-20 mb-4" />
                  <p className="text-xs opacity-40 font-medium">Belum ada foto</p>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/5 rounded-[2rem] border border-white/5 p-8">
            <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest">
              <Info size={18} className="text-primary" />
              Petunjuk:
            </div>
            <ul className="space-y-3 text-xs font-medium text-slate-400">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Pilih jeda waktu (3 atau 5 detik)
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Klik "Mulai Foto" untuk memulai sesi
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Foto akan diambil otomatis dengan jeda yang dipilih
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Anda bisa retake foto yang kurang bagus jika waktu masih tersisa
              </li>
            </ul>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Studio;
