import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CommunityTheme = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  ask_file_url: string;
  preview_image_url: string | null;
  swatch_colors: string[];
  variant_mode: string | null;
  source_image_url: string | null;
  download_count: number;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  profiles?: {
    display_name: string;
  } | null;
};

export type Profile = {
  id: string;
  display_name: string;
  bio: string | null;
  social_links: {
    soundcloud?: string;
    bandcamp?: string;
    instagram?: string;
    website?: string;
  };
  created_at: string;
  consent_product_updates?: boolean;
  consent_marketing?: boolean;
  consent_updated_at?: string | null;
};
