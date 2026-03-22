import type { ContrastLevel } from '../theme/types';
import type { RoleLocations } from '../extraction/types';

export interface SavedTheme {
  id: string;
  name: string;
  createdAt: string;
  createdBy?: string; // User ID of the creator (for user-specific theme filtering)
  filePath: string;
  tone: 'light' | 'dark';
  colors: {
    surface_base: string;
    text_primary: string;
    accent_primary: string;
    accent_secondary: string;
    accent_tertiary?: string;
    accent_quaternary?: string;
  };
  contrastLevel?: ContrastLevel;
  hueInjection?: {
    enabled: boolean;
    strength: number;
  };
  previewImagePath?: string; // Path to preview image file (replaces base64 previewImage)
  previewImage?: string; // DEPRECATED: Legacy base64 data URL, migrated to previewImagePath on load
  roleLocations?: RoleLocations;
  sourceImagePath?: string; // Cached source image in app data directory
  isInstalled: boolean; // true = .ask file exists in Ableton themes dir
  fromCommunity?: boolean; // true if downloaded from community gallery
  generationVersion?: number; // Algorithm version that generated this theme (see GENERATION_VERSION in derivation.ts)

  // Original colors before any slider adjustments (for edit restoration)
  originalColors?: {
    surface_base: string;
    text_primary: string;
    accent_primary: string;
    accent_secondary: string;
    accent_tertiary?: string;
    accent_quaternary?: string;
  };

  // Slider positions at time of save
  moodSliders?: {
    warmth: number;     // -100 to +100
    saturation: number; // -100 to +100
    brightness: number; // -100 to +100
  };
}

export interface ThemeLibrary {
  version: 1;
  themes: SavedTheme[];
}
