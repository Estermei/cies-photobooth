export interface Package {
  id: number;
  name: string;
  price: number;
  duration: number;
  photos_count: number;
  description: string;
}

export interface Frame {
  id: number;
  name: string;
  image_url: string;
  photos_count?: number;
}

export interface Sticker {
  id: number;
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

