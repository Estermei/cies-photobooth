import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Rect, Group, Text, Circle } from 'react-konva';
import { Download, Layout, Sticker as StickerIcon, Check, ArrowLeft, Instagram, Image as ImageIcon, Heart, Square, Circle as CircleIcon, Sliders, Type, Smile, Palette, Filter as FilterIcon, Plus, Ban } from 'lucide-react';
import useImage from 'use-image';
import Konva from 'konva';
import { Frame, Sticker, Session } from '../../types';
import { fetchSessionById, fetchFrames, fetchStickers } from '../../services/api';
import { get as idbGet } from 'idb-keyval';

const PhotoItem = ({ 
  url, x, y, width, height, shape, filter, brightness, contrast, saturation 
}: { 
  url: string, x: number, y: number, width: number, height: number, 
  shape: 'normal' | 'rounded' | 'circle' | 'heart',
  filter: string,
  brightness: number,
  contrast: number,
  saturation: number
}) => {
  const isDataUrl = url?.startsWith('data:');
  const [image] = useImage(url, isDataUrl ? undefined : 'anonymous');
  const imageRef = useRef<Konva.Image>(null);

  useEffect(() => {
    if (imageRef.current && image) {
      const node = imageRef.current;
      node.clearCache();
      try {
        node.cache();
      } catch (e) {
        console.warn("Konva caching failed:", e);
      }
    }
  }, [image, filter, brightness, contrast, saturation]);

  const filters = useMemo(() => {
    const f = [Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSV];
    if (filter === 'B&W') f.push(Konva.Filters.Grayscale);
    if (filter === 'Sepia' || filter === 'Vintage') f.push(Konva.Filters.Sepia);
    return f;
  }, [filter]);

  // Fungsi pemotongan (clip) untuk bentuk foto
  const clipFunc = (ctx: any) => {
    if (shape === 'rounded') {
      const r = 20;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(width - r, 0);
      ctx.quadraticCurveTo(width, 0, width, r);
      ctx.lineTo(width, height - r);
      ctx.quadraticCurveTo(width, height, width - r, height);
      ctx.lineTo(r, height);
      ctx.quadraticCurveTo(0, height, 0, height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
    } else if (shape === 'circle') {
      const size = Math.min(width, height);
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
    } else if (shape === 'heart') {
      const w = width;
      const h = height;
      
      ctx.beginPath();
      // Mulai dari lekukan tengah atas
      ctx.moveTo(w / 2, h * 0.2);
      // Lengkungan atas kiri
      ctx.bezierCurveTo(w * 0.28, h * 0.01, w * 0.01, h * 0.18, w * 0.01, h * 0.48);
      // Lengkungan bawah kiri ke ujung bawah
      ctx.bezierCurveTo(w * 0.01, h * 0.72, w * 0.26, h * 0.88, w / 2, h * 0.98);
      // Lengkungan bawah kanan dari ujung
      ctx.bezierCurveTo(w * 0.74, h * 0.88, w * 0.99, h * 0.72, w * 0.99, h * 0.48);
      // Lengkungan atas kanan kembali ke lekukan tengah atas
      ctx.bezierCurveTo(w * 0.99, h * 0.18, w * 0.72, h * 0.01, w / 2, h * 0.2);
      ctx.closePath();
    } else {
      ctx.rect(0, 0, width, height);
    }
  };

  const cropProps = useMemo(() => {
    if (!image) return null;
    const imgWidth = image.width;
    const imgHeight = image.height;
    
    const imageRatio = imgWidth / imgHeight;
    const containerRatio = width / height;
    
    let cropX = 0;
    let cropY = 0;
    let cropWidth = imgWidth;
    let cropHeight = imgHeight;
    
    if (imageRatio > containerRatio) {
      cropWidth = imgHeight * containerRatio;
      cropX = (imgWidth - cropWidth) / 2;
    } else {
      cropHeight = imgWidth / containerRatio;
      cropY = (imgHeight - cropHeight) / 2;
    }
    
    return {
      cropX,
      cropY,
      cropWidth,
      cropHeight
    };
  }, [image, width, height]);

  if (!image) return null;

  return (
    <Group x={x} y={y} clipFunc={clipFunc}>
      <KonvaImage 
        image={image} 
        width={width} 
        height={height} 
        ref={imageRef}
        filters={filters}
        brightness={brightness / 100 - 1}
        contrast={contrast - 100}
        saturation={saturation / 100 - 1}
        cropX={cropProps?.cropX}
        cropY={cropProps?.cropY}
        cropWidth={cropProps?.cropWidth}
        cropHeight={cropProps?.cropHeight}
      />
      {filter === 'Cool' && (
        <Rect width={width} height={height} fill="rgba(0, 100, 255, 0.12)" listening={false} />
      )}
      {filter === 'Warm' && (
        <Rect width={width} height={height} fill="rgba(255, 120, 0, 0.12)" listening={false} />
      )}
      {filter === 'Vintage' && (
        <Rect width={width} height={height} fill="rgba(120, 80, 0, 0.15)" listening={false} />
      )}
    </Group>
  );
};

const FrameOverlay = ({ url, width, height }: { url: string, width: number, height: number }) => {
  const isDataUrl = url?.startsWith('data:');
  const [image] = useImage(url, isDataUrl ? undefined : 'anonymous');
  if (!image) return null;
  return <KonvaImage image={image} x={0} y={0} width={width} height={height} listening={false} />;
};

const StickerItem = ({ emoji, x, y, size = 80, onDragEnd, onClick }: { emoji: string, x: number, y: number, size?: number, onDragEnd?: (e: any) => void, onClick?: () => void }) => {
  return (
    <Text 
      text={emoji} 
      x={x} 
      y={y} 
      fontSize={size} 
      draggable 
      onClick={onClick}
      onTap={onClick}
      onDragStart={(e) => e.target.moveToTop()}
      onDragEnd={onDragEnd}
    />
  );
};

const StickerImageItem = ({ 
  url, 
  x, 
  y, 
  size = 240, 
  isFullFrame = false,
  canvasWidth = 460,
  canvasHeight = 1000,
  onDragEnd, 
  onClick 
}: { 
  url: string, 
  x: number, 
  y: number, 
  size?: number, 
  isFullFrame?: boolean,
  canvasWidth?: number,
  canvasHeight?: number,
  onDragEnd?: (e: any) => void, 
  onClick?: () => void 
}) => {
  const isDataUrl = url?.startsWith('data:');
  const [image] = useImage(url, isDataUrl ? undefined : 'anonymous');
  if (!image) return null;

  if (isFullFrame) {
    return (
      <KonvaImage 
        image={image}
        x={0}
        y={0}
        width={canvasWidth}
        height={canvasHeight}
        onClick={onClick}
        onTap={onClick}
        listening={true}
      />
    );
  }

  let w = size;
  let h = size;
  if (image.width && image.height) {
    h = (image.height / image.width) * size;
  }

  return (
    <KonvaImage 
      image={image}
      x={x}
      y={y}
      width={w}
      height={h}
      draggable
      onClick={onClick}
      onTap={onClick}
      onDragStart={(e) => e.target.moveToTop()}
      onDragEnd={onDragEnd}
    />
  );
};

const Editor: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [frameColor, setFrameColor] = useState('#ffffff');
  const [photoShape, setPhotoShape] = useState<'normal' | 'rounded' | 'circle' | 'heart'>('normal');
  const [activeFilter, setActiveFilter] = useState('Original');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [footerText] = useState('CIES PHOTOBOOTH');
  const [footerFont, setFooterFont] = useState('Arial');
  const [showDate, setShowDate] = useState(true);
  const [textColor, setTextColor] = useState('Auto');

  // Hitung warna teks berdasarkan frame/warna saat dalam mode Otomatis
  const computedTextColor = useMemo(() => {
    if (textColor === 'Hitam') return '#000000';
    if (textColor === 'Putih') return '#ffffff';
    
    // Mode otomatis: periksa gambar/nama frame atau warna solid
    if (selectedFrame) {
      const nameLower = (selectedFrame.name || '').toLowerCase();
      const urlLower = (selectedFrame.image_url || '').toLowerCase();
      const isDarkFrame = nameLower.match(/(dark|black|gelap|night|noir|film|shadow|hitam|cyberpunk)/) || urlLower.match(/(dark|black|gelap|night|noir|film|shadow|hitam|cyberpunk)/);
      return isDarkFrame ? '#ffffff' : '#000000';
    }
    
    // Luminansi warna frame solid
    const hex = frameColor.replace('#', '');
    let r = 255, g = 255, b = 255;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) || 255;
      g = parseInt(hex[1] + hex[1], 16) || 255;
      b = parseInt(hex[2] + hex[2], 16) || 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16) || 255;
      g = parseInt(hex.substring(2, 4), 16) || 255;
      b = parseInt(hex.substring(4, 6), 16) || 255;
    }
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128 ? '#ffffff' : '#000000';
  }, [textColor, selectedFrame, frameColor]);
  const [appliedStickers, setAppliedStickers] = useState<{ id: number, emoji?: string, imageUrl?: string, x: number, y: number, size: number, isFullFrame?: boolean }[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(null);
  const [activeMode, setActiveMode] = useState<'strip' | 'individual'>('strip');
  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState<number[]>([]);
  const [forceRedraw, setForceRedraw] = useState(0);

  // Gambar ulang ketika font selesai dimuat
  useEffect(() => {
    if ((document as any).fonts) {
      (document as any).fonts.ready.then(() => {
        setForceRedraw(prev => prev + 1);
      });
    }
  }, []);

  const colors = [
    '#ffffff', // Putih
    '#000000', // Hitam
    '#ffc1cc', // Pink
    '#add8e6', // Biru Muda
    '#90ee90', // Hijau Muda
    '#d8b4fe', // Ungu
  ];
  const fonts = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Pacifico', 'Dancing Script', 'Playfair Display', 'Lobster', 'Cormorant Garamond'];

  const getFormattedDate = () => {
    const d = new Date();
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const pad = (num: number) => String(num).padStart(2, '0');
    const timeStr = `${pad(d.getHours())}.${pad(d.getMinutes())}`;
    return `${dateStr} ${timeStr}`;
  };

  // Kalkulasi kanvas untuk Strip Foto (Vertikal)
  const canvasWidth = 460;
  const photoWidth = 400;
  const photoHeight = 300;
  const footerHeight = 80;

  // Foto yang ditampilkan pada strip
  const displayPhotos = useMemo(() => {
    return selectedPhotoIndices.map(idx => photos[idx]).filter(Boolean);
  }, [photos, selectedPhotoIndices]);

  // Tinggi dinamis berdasarkan jumlah foto
  const canvasHeight = useMemo(() => {
    if (activeMode === 'strip') {
      const N = displayPhotos.length;
      return 30 + 30 + (300 * N) + (15 * (N - 1)) + 80;
    }
    return 600; // Tinggi tetap untuk mode individual
  }, [activeMode, displayPhotos.length]);

  // Hitung posisi foto
  const photoLayout = useMemo(() => {
    if (activeMode === 'individual') {
      return [{
        x: 0,
        y: 0,
        width: 320,
        height: 240
      }];
    }

    return displayPhotos.map((_, i) => ({
      x: 30,
      y: 30 + i * (300 + 15),
      width: 400,
      height: 300
    }));
  }, [activeMode, displayPhotos.length]);

  // Inisialisasi foto yang dipilih (Maksimal 4 foto untuk Photo Strip)
  useEffect(() => {
    if (photos.length > 0 && selectedPhotoIndices.length === 0) {
      setSelectedPhotoIndices(Array.from({ length: Math.min(photos.length, 4) }, (_, i) => i));
    }
  }, [photos]);

  const togglePhotoSelection = (index: number) => {
    setSelectedPhotoIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  };
  
  const [activeIndividualIndex, setActiveIndividualIndex] = useState(0);
  const stageRef = useRef<any>(null);
  const activeIndividualStageRef = useRef<any>(null);
  const individualStageRefs = useRef<(any | null)[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        let currentSession: Session | null = null;
        if (sessionId) {
          try {
            currentSession = await fetchSessionById(sessionId);
          } catch (err) {
            console.warn("Failed fetching session:", err);
          }
        }

        if (!currentSession) {
          currentSession = {
            id: sessionId || 'cies-session',
            package_id: 1,
            status: 'active',
            created_at: new Date().toISOString()
          };
        }
        setSession(currentSession);

        try {
          const framesData = await fetchFrames();
          setFrames(Array.isArray(framesData) ? framesData : []);
        } catch (err) {
          console.warn("Gagal mengambil daftar frame:", err);
          setFrames([]);
        }

        try {
          const stickersData = await fetchStickers();
          setStickers(Array.isArray(stickersData) ? stickersData : []);
        } catch (err) {
          console.warn("Gagal mengambil daftar stiker:", err);
          setStickers([]);
        }

        // Gunakan IndexedDB via idb-keyval untuk menghindari batas kuota localStorage
        let loadedPhotos: string[] = [];
        try {
          const savedPhotos = await idbGet(`photos_${sessionId}`);
          if (savedPhotos && Array.isArray(savedPhotos) && savedPhotos.length > 0) {
            loadedPhotos = savedPhotos;
          } else {
            // Cadangan ke localStorage untuk sesi lama
            const legacyPhotos = localStorage.getItem(`photos_${sessionId}`);
            if (legacyPhotos) {
              try {
                const parsed = JSON.parse(legacyPhotos);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  loadedPhotos = parsed;
                }
              } catch (e) {
                console.error("Error parsing legacy photos:", e);
              }
            }
          }
        } catch (e) {
          console.error("Error loading photos from storage:", e);
        }

        // Contoh foto cadangan jika tidak ada foto ditemukan di penyimpanan lokal
        if (loadedPhotos.length === 0) {
          loadedPhotos = [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
          ];
        }

        setPhotos(loadedPhotos);
      } catch (error) {
        console.error("Error loading editor data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sessionId]);

  const activeSticker = useMemo(() => {
    return appliedStickers.find(s => s.id === selectedStickerId) || appliedStickers[0] || null;
  }, [appliedStickers, selectedStickerId]);

  const addOrReplaceImageSticker = (imageUrl: string) => {
    setAppliedStickers(prev => {
      if (prev.length > 0) {
        const targetId = selectedStickerId || prev[0].id;
        return prev.map(s => s.id === targetId ? { ...s, imageUrl, emoji: undefined, isFullFrame: true, x: 0, y: 0, size: canvasWidth } : s);
      }
      const newSticker = {
        id: Date.now(),
        imageUrl,
        isFullFrame: true,
        x: 0,
        y: 0,
        size: canvasWidth
      };
      setSelectedStickerId(newSticker.id);
      return [newSticker];
    });
  };

  const addOrReplaceEmojiSticker = (emoji: string) => {
    setAppliedStickers(prev => {
      if (prev.length > 0) {
        const targetId = selectedStickerId || prev[0].id;
        return prev.map(s => s.id === targetId ? { ...s, emoji, imageUrl: undefined, isFullFrame: true } : s);
      }
      const newSticker = {
        id: Date.now(),
        emoji,
        isFullFrame: true,
        x: 0,
        y: 0,
        size: canvasWidth
      };
      setSelectedStickerId(newSticker.id);
      return [newSticker];
    });
  };

  const addNewSticker = () => {
    const newSticker = {
      id: Date.now(),
      emoji: '⭐',
      isFullFrame: true,
      x: 0,
      y: 0,
      size: canvasWidth
    };
    setAppliedStickers(prev => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  const handleDownload = (mode: 'normal' | 'story' | 'individual' | 'all-individual', index?: number) => {
    if (mode === 'individual' && typeof index === 'number') {
      const stage = individualStageRefs.current[index];
      if (stage) {
        const dataURL = stage.toDataURL({ pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `cies-photo-${index + 1}-${sessionId}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return;
    }

    if (mode === 'all-individual') {
      photos.forEach((_, idx) => {
        setTimeout(() => {
          const stage = individualStageRefs.current[idx];
          if (stage) {
            const dataURL = stage.toDataURL({ pixelRatio: 3 });
            const link = document.createElement('a');
            link.download = `cies-photo-${idx + 1}-${sessionId}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }, idx * 400); // Jadwalkan unduhan secara bertahap agar browser memproses semuanya
      });
      return;
    }

    if (stageRef.current) {
      if (mode === 'story') {
        // Ekspor strip pada resolusi 3x terlebih dahulu
        const stripDataURL = stageRef.current.toDataURL({ pixelRatio: 3 });
        
        // Buat gambar offscreen untuk memuat strip
        const img = new Image();
        img.onload = () => {
          // Tentukan warna latar belakang: warna solid atau diekstrak dari templat frame kustom
          const getBgColor = (callback: (color: string) => void) => {
            if (selectedFrame) {
              const frameImg = new Image();
              frameImg.crossOrigin = 'anonymous';
              frameImg.onload = () => {
                try {
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = 1;
                  tempCanvas.height = 1;
                  const tempCtx = tempCanvas.getContext('2d');
                  if (tempCtx) {
                    tempCtx.drawImage(frameImg, 0, 0, 1, 1);
                    const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
                    const r = pixel[0];
                    const g = pixel[1];
                    const b = pixel[2];
                    // Kirim warna rata-rata dalam format rgb
                    callback(`rgb(${r}, ${g}, ${b})`);
                    return;
                  }
                } catch (e) {
                  console.error("Error extracting frame dominant color:", e);
                }
                callback(frameColor || '#d8b4fe');
              };
              frameImg.onerror = () => {
                callback(frameColor || '#d8b4fe');
              };
              frameImg.src = selectedFrame.image_url;
            } else {
              callback(frameColor || '#d8b4fe');
            }
          };

          getBgColor((bgColor) => {
            // Buat kanvas offscreen untuk Ukuran Instagram Story 1080x1920
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Gambar latar belakang sesuai warna frame atau warna ekstrak
              ctx.fillStyle = bgColor;
              ctx.fillRect(0, 0, 1080, 1920);
              
              // Posisikan di tengah dan sesuaikan skala strip dengan margin 10%
              const stripWidth = stageRef.current!.width();
              const stripHeight = stageRef.current!.height();
              
              const maxAllowedWidth = 1080 * 0.8;  // Margin 10% kiri & kanan = lebar maks 864px
              const maxAllowedHeight = 1920 * 0.8; // Margin 10% atas & bawah = tinggi maks 1536px
              
              const scaleX = maxAllowedWidth / stripWidth;
              const scaleY = maxAllowedHeight / stripHeight;
              const scale = Math.min(scaleX, scaleY);
              
              const targetWidth = stripWidth * scale;
              const targetHeight = stripHeight * scale;
              
              const x = (1080 - targetWidth) / 2;
              const y = (1920 - targetHeight) / 2; // Posisikan tepat di tengah secara vertikal
              
              // Tambahkan bayangan lembut realistis untuk strip
              ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
              ctx.shadowBlur = 40;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 15;
              
              // Gambar strip
              ctx.drawImage(img, x, y, targetWidth, targetHeight);
              
              // Ekspor gambar akhir
              const finalDataURL = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.download = `cies-story-${sessionId}.png`;
              link.href = finalDataURL;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          });
        };
        img.src = stripDataURL;
      } else {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `cies-normal-${sessionId}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const addSticker = (emoji: string) => {
    addOrReplaceEmojiSticker(emoji);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark text-white font-sans flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-2xl font-black">Menyiapkan <span className="text-primary italic">Editor</span></h2>
          <p className="text-slate-400 max-w-xs mx-auto">Mohon tunggu sebentar, kami sedang memproses foto-foto Anda...</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-8 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans flex flex-col">
      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-3xl font-black tracking-tight mb-2">Editor <span className="text-primary italic font-serif">Foto</span></h1>
        <p className="text-sm text-slate-400 font-medium">Edit foto Anda dengan berbagai filter, frame, dan stiker</p>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row gap-8 px-8 pb-12 max-w-[1600px] mx-auto w-full">
        {/* Left: Canvas Area */}
        <div className="flex-grow flex flex-col gap-2">
          {/* Tabs */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full mb-4">
            <button 
              onClick={() => setActiveMode('strip')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase ${activeMode === 'strip' ? 'bg-primary text-white shadow-lg' : 'opacity-50 hover:opacity-100 text-white'}`}
            >
              Photo Strip
            </button>
            <button 
              onClick={() => setActiveMode('individual')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase ${activeMode === 'individual' ? 'bg-primary text-white shadow-lg' : 'opacity-50 hover:opacity-100 text-white'}`}
            >
              Foto Individual
            </button>
          </div>

          {/* Canvas Container */}
          {activeMode === 'strip' ? (
            <div className="bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center p-3 sm:p-5 mx-auto w-full max-w-sm sm:max-w-md shadow-xl transition-all">
              <div 
                className="shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 my-1"
                style={{
                  width: `${canvasWidth * 0.52}px`,
                  height: `${canvasHeight * 0.52}px`,
                }}
              >
                <div 
                  style={{ 
                    transform: 'scale(0.52)', 
                    transformOrigin: 'top left',
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`
                  }}
                >
                  <Stage key={`strip-${forceRedraw}`} width={canvasWidth} height={canvasHeight} ref={stageRef}>
                    <Layer>
                      {/* Background / Solid Frame */}
                      <Rect width={canvasWidth} height={canvasHeight} fill={selectedFrame ? '#ffffff' : frameColor} cornerRadius={20} />
                      
                      {/* Frame Overlay (Drawn as Background behind photos) */}
                      {selectedFrame && (
                        <FrameOverlay 
                          url={selectedFrame.image_url} 
                          width={canvasWidth} 
                          height={canvasHeight} 
                        />
                      )}
                      
                      {/* Photos */}
                      <Group x={0} y={0}>
                        {displayPhotos.map((photo, i) => (
                          <PhotoItem
                            key={i}
                            url={photo}
                            x={photoLayout[i]?.x || 30}
                            y={photoLayout[i]?.y || (30 + i * 315)}
                            width={400}
                            height={300}
                            shape={photoShape}
                            filter={activeFilter}
                            brightness={brightness}
                            contrast={contrast}
                            saturation={saturation}
                          />
                        ))}
                      </Group>

                      {/* Footer Area (Text on top of Frame/Photos) */}
                      <Group y={canvasHeight - footerHeight}>
                        <Text 
                          text={footerText}
                          width={canvasWidth}
                          align="center"
                          y={20}
                          fontSize={16}
                          fontFamily={footerFont}
                          fill={computedTextColor}
                          fontStyle="bold"
                        />
                        {showDate && (
                          <Text 
                            text={getFormattedDate()}
                            width={canvasWidth}
                            align="center"
                            y={46}
                            fontSize={10}
                            fontFamily="Arial"
                            fill={computedTextColor}
                            opacity={0.8}
                          />
                        )}
                      </Group>

                      {/* Stickers */}
                      {appliedStickers.map(s => (
                        s.imageUrl ? (
                          <StickerImageItem 
                            key={s.id} 
                            url={s.imageUrl} 
                            x={s.x} 
                            y={s.y} 
                            size={s.size || 240} 
                            isFullFrame={s.isFullFrame}
                            canvasWidth={canvasWidth}
                            canvasHeight={canvasHeight}
                            onClick={() => setSelectedStickerId(s.id)}
                            onDragEnd={(e) => {
                              const node = e.target;
                              setAppliedStickers(prev => prev.map(item => item.id === s.id ? { ...item, x: node.x(), y: node.y() } : item));
                            }}
                          />
                        ) : (
                          <StickerItem 
                            key={s.id} 
                            emoji={s.emoji || ''} 
                            x={s.x} 
                            y={s.y} 
                            size={s.size || 80} 
                            onClick={() => setSelectedStickerId(s.id)}
                            onDragEnd={(e) => {
                              const node = e.target;
                              setAppliedStickers(prev => prev.map(item => item.id === s.id ? { ...item, x: node.x(), y: node.y() } : item));
                            }}
                          />
                        )
                      ))}
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-3xl border border-white/5 flex flex-col p-4 sm:p-5 max-w-lg mx-auto w-full justify-between">
              {/* Main Individual Card Preview */}
              <div className="flex-grow flex items-center justify-center p-2">
                <div className="shadow-2xl bg-black rounded-2xl overflow-hidden origin-center">
                  <Stage 
                    width={400} 
                    height={300} 
                    ref={activeIndividualStageRef}
                    key={`indiv-active-${activeIndividualIndex}-${forceRedraw}`}
                  >
                    <Layer>
                      {/* Raw Photo (fills the entire stage) */}
                      <PhotoItem
                        url={photos[activeIndividualIndex]}
                        x={0}
                        y={0}
                        width={400}
                        height={300}
                        shape="normal"
                        filter={activeFilter}
                        brightness={brightness}
                        contrast={contrast}
                        saturation={saturation}
                      />
                    </Layer>
                  </Stage>
                </div>
              </div>

              {/* Thumbnails Row */}
              <div className="flex justify-start sm:justify-center gap-2.5 mt-2 mb-4 overflow-x-auto max-w-full pb-2 custom-scrollbar px-1">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndividualIndex(i)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden transition-all duration-200 border-2 shrink-0 ${
                      activeIndividualIndex === i 
                        ? 'border-primary ring-2 ring-primary/20 scale-105' 
                        : 'border-white/10 opacity-65 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img 
                      src={photo} 
                      alt={`Thumbnail ${i + 1}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-[8px] font-bold px-1 py-0.2 rounded text-white">
                      #{i + 1}
                    </div>
                  </button>
                ))}
              </div>

              {/* Action Buttons Inside the Panel */}
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    try {
                      // Coba panggung (stage) aktif yang terlihat terlebih dahulu
                      let stage = activeIndividualStageRef.current;
                      // Cadangan ke panggung tersembunyi jika panggung aktif kosong
                      if (!stage) {
                        stage = individualStageRefs.current[activeIndividualIndex];
                      }
                      
                      if (stage) {
                        const dataURL = stage.toDataURL({ pixelRatio: 3 });
                        const link = document.createElement('a');
                        link.download = `cies-photo-${activeIndividualIndex + 1}-${sessionId}.png`;
                        link.href = dataURL;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } else {
                        alert("Gagal mengunduh: Area gambar tidak ditemukan.");
                      }
                    } catch (err) {
                      console.error("Error exporting individual photo:", err);
                      // Cadangan: unduh langsung URL foto mentah dari penyimpanan
                      try {
                        const rawUrl = photos[activeIndividualIndex];
                        if (rawUrl) {
                          const link = document.createElement('a');
                          link.download = `cies-raw-photo-${activeIndividualIndex + 1}-${sessionId}.jpg`;
                          link.href = rawUrl;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (fallbackErr) {
                        console.error("Raw fallback also failed:", fallbackErr);
                      }
                    }
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Download size={16} />
                  Unduh Foto Ini
                </button>
                <button 
                  onClick={() => handleDownload('all-individual')}
                  className="flex-1 py-3 bg-primary text-white hover:bg-opacity-90 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                  <Download size={16} />
                  Unduh Semua ({photos.length})
                </button>
              </div>
            </div>
          )}

          {/* Hidden background stages to compile ALL individual photos for bulk download */}
          <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none overflow-hidden">
            {photos.map((photo, i) => (
              <Stage 
                key={`indiv-hidden-${i}-${forceRedraw}`}
                width={400} 
                height={300} 
                ref={el => { individualStageRefs.current[i] = el; }}
              >
                <Layer>
                  <PhotoItem
                    url={photo}
                    x={0}
                    y={0}
                    width={400}
                    height={300}
                    shape="normal"
                    filter={activeFilter}
                    brightness={brightness}
                    contrast={contrast}
                    saturation={saturation}
                  />
                </Layer>
              </Stage>
            ))}
          </div>

          {/* Download Buttons for Photo Strip (only visible in Strip Mode) */}
          {activeMode === 'strip' && (
            <div className="flex gap-4">
              <button 
                onClick={() => handleDownload('normal')}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Download size={20} />
                Unduh Photo Strip
              </button>
              <button 
                onClick={() => handleDownload('story')}
                className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <Download size={20} />
                Format IG Story
              </button>
            </div>
          )}
        </div>

        {/* Right: Sidebar Controls */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar pb-10">
          {/* Pilih 4 Foto untuk Strip (Jika foto yang diambil > 4) */}
          {photos.length > 4 && (
            <section className="bg-white/5 rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                  <ImageIcon size={12} />
                  PILIH 4 FOTO
                </div>
                <span className="text-[10px] font-bold text-slate-400">{selectedPhotoIndices.length}/4</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => togglePhotoSelection(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedPhotoIndices.includes(idx) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={photo} alt={`Captured ${idx}`} className="w-full h-full object-cover" />
                    {selectedPhotoIndices.includes(idx) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {selectedPhotoIndices.indexOf(idx) + 1}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Pilih Frame */}
          <section className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Palette size={12} />
                Pilih Frame
              </div>
            </div>

            {/* Circular Swatches for Frames */}
            <div className="flex flex-wrap gap-2.5 mb-4 max-h-52 overflow-y-auto pr-1 custom-scrollbar items-center">
              {/* Solid Frame Option */}
              <button 
                type="button"
                onClick={() => setSelectedFrame(null)}
                title="Warna Solid"
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 shrink-0 ${
                  !selectedFrame 
                    ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md shadow-primary/20' 
                    : 'border-white/20 hover:border-white/40 bg-white/10'
                }`}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 via-white to-slate-400 flex items-center justify-center text-[9px] font-bold text-slate-800 uppercase tracking-tighter">
                  Solid
                </div>
              </button>

              {/* Image Frame Swatches */}
              {frames.map(frame => {
                const isSelected = selectedFrame?.id === frame.id;
                return (
                  <button 
                    key={frame.id}
                    type="button"
                    onClick={() => setSelectedFrame(frame)}
                    title={frame.name}
                    className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110 shrink-0 ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-md shadow-primary/20' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <img 
                      src={frame.image_url} 
                      alt={frame.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  </button>
                );
              })}
            </div>
            
            {/* Solid Color Palette (visible when Solid option is selected) */}
            {!selectedFrame && (
              <div className="space-y-2.5 pt-3 border-t border-white/5">
                <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider block">Warna Frame:</span>
                <div className="flex gap-2.5 flex-wrap items-center">
                  {colors.map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setFrameColor(c)}
                      title={c}
                      className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 shrink-0 ${
                        frameColor === c 
                          ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-lg shadow-primary/20' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}

                  {/* Rainbow / Custom Color Picker */}
                  <div 
                    title="Pilih Warna Kustom"
                    className={`relative w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 shrink-0 cursor-pointer overflow-hidden ${
                      !colors.includes(frameColor) 
                        ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-lg shadow-primary/20' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    style={{
                      background: !colors.includes(frameColor) 
                        ? frameColor 
                        : 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)'
                    }}
                  >
                    {colors.includes(frameColor) && (
                      <Plus size={14} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    )}
                    <input 
                      type="color" 
                      value={frameColor}
                      onChange={(e) => setFrameColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Photo Shape */}
          <section className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-primary">
              <ImageIcon size={12} />
              Photo Shape
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'normal', icon: Square, label: 'Normal' },
                { id: 'rounded', icon: Square, label: 'Rounded' },
                { id: 'circle', icon: CircleIcon, label: 'Circle' },
                { id: 'heart', icon: Heart, label: 'Heart' }
              ].map(s => (
                <button 
                  key={s.id}
                  onClick={() => setPhotoShape(s.id as any)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${photoShape === s.id ? 'bg-primary/10 border-primary text-primary' : 'border-white/5 hover:bg-white/5'}`}
                >
                  <s.icon size={18} className={s.id === 'rounded' ? 'rounded-md' : ''} />
                  <span className="text-[10px] font-bold">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Filter */}
          <section className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-primary">
              <FilterIcon size={12} />
              Filter
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Original', 'B&W', 'Sepia', 'Vintage', 'Cool', 'Warm'].map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`py-2 rounded-full text-[10px] font-bold border transition-all ${activeFilter === f ? 'bg-primary/10 border-primary text-primary' : 'border-white/10 hover:bg-white/5'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>

          {/* Penyesuaian */}
          <section className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Sliders size={12} />
              Penyesuaian
            </div>
            <div className="space-y-3">
              {[
                { label: 'Kecerahan', value: brightness, setter: setBrightness },
                { label: 'Kontras', value: contrast, setter: setContrast },
                { label: 'Saturasi', value: saturation, setter: setSaturation }
              ].map(adj => (
                <div key={adj.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold opacity-60">
                    <span>{adj.label}: {adj.value}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={adj.value} 
                    onChange={(e) => adj.setter(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Pengaturan Footer */}
          <section className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Type size={12} />
              Pengaturan Footer
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <span className="text-[10px] font-bold opacity-40 uppercase">Gaya Huruf</span>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {fonts.map(f => (
                    <button 
                      key={f}
                      onClick={() => setFooterFont(f)}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${footerFont === f ? 'bg-primary/10 border-primary text-primary' : 'border-white/10 hover:bg-white/5'}`}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-40 uppercase">Tampilkan Tanggal & Waktu</span>
                <button 
                  onClick={() => setShowDate(!showDate)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showDate ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showDate ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold opacity-40 uppercase">Warna Teks</span>
                <div className="grid grid-cols-3 gap-2">
                  {['Auto', 'Hitam', 'Putih'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setTextColor(c)}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${textColor === c ? 'bg-primary/10 border-primary text-primary' : 'border-white/10 hover:bg-white/5'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Stiker */}
          <section className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Smile size={12} />
              Stiker
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {/* Tanpa Stiker / Clear Stickers */}
              <button 
                type="button"
                onClick={() => setAppliedStickers([])}
                title="Tanpa Stiker (Hapus Semua Stiker)"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 shrink-0 cursor-pointer ${
                  appliedStickers.length === 0
                    ? 'bg-primary/20 text-primary border-2 border-primary ring-2 ring-primary/30 shadow-md shadow-primary/20'
                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <Ban size={22} className="stroke-[2]" />
              </button>

              {stickers.map(st => {
                const isSelected = appliedStickers.some(s => s.imageUrl === st.image_url);
                return (
                  <button 
                    key={st.id}
                    type="button"
                    onClick={() => addOrReplaceImageSticker(st.image_url)}
                    title={st.name}
                    className={`w-12 h-12 rounded-xl p-1 flex items-center justify-center hover:scale-110 transition-all cursor-pointer overflow-hidden group ${
                      isSelected
                        ? 'bg-primary/20 border-2 border-primary ring-2 ring-primary/30 shadow-md shadow-primary/20'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <img 
                      src={st.image_url} 
                      alt={st.name} 
                      className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-black hover:bg-white/10 transition-all text-sm mb-4"
          >
            Selesai & Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
