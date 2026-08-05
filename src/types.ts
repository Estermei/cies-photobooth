export interface Package {
  id: number | string;
  name: string;
  price: number;
  duration: number;
  photos_count: number;
  description: string;
}

export interface Frame {
  id: number | string;
  name: string;
  image_url: string;
  photos_count?: number;
}

export interface Sticker {
  id: number | string;
  name: string;
  image_url: string;
}

export interface Session {
  id: string;
  package_id: number;
  status: 'pending' | 'active' | 'completed';
  payment_proof_url?: string;
  user_name?: string;
  created_at: string;
  package_name?: string;
  price?: number;
  duration?: number;
  photos_count?: number;
}

export const normalizeDurationToSeconds = (duration?: number): number => {
  if (!duration) return 60;
  if (duration <= 10) {
    // Legacy duration in minutes (e.g. 0.5, 1, 2)
    return Math.round(duration * 60);
  }
  return duration;
};

export const formatDuration = (duration?: number): string => {
  const secs = normalizeDurationToSeconds(duration);
  if (secs < 60) {
    return `${secs} Detik`;
  }
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (remSecs === 0) {
    return `${mins} Menit`;
  }
  return `${mins} Menit ${remSecs} Detik`;
};

