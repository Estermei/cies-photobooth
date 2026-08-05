export async function compressImage(file: File, maxDimension = 2400, quality = 0.92): Promise<File> {
  // SVG, file PNG transparan (frame/stiker < 5MB), atau file kecil tidak perlu dikompresi agar kualitas 100% jernih dan tajam
  if (file.type === 'image/svg+xml' || (file.type === 'image/png' && file.size < 5 * 1024 * 1024) || file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Jika resolusi di bawah batas maxDimension, gunakan file asli tanpa dikompres
      if (width <= maxDimension && height <= maxDimension && file.type === 'image/png') {
        resolve(file);
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Pastikan re-draw menggunakan image smoothing berkualitas tinggi
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + (mimeType === 'image/png' ? '.png' : '.jpg'), {
          type: mimeType,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, mimeType, quality);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}
