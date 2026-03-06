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
  };
  contrastLevel?: ContrastLevel;
  previewImage?: string;
  roleLocations?: RoleLocations;
  sourceImagePath?: string; // Cached source image in app data directory
  isInstalled: boolean; // true = .ask file exists in Ableton themes dir
  fromCommunity?: boolean; // true if downloaded from community gallery

  // Original colors before any slider adjustments (for edit restoration)
  originalColors?: {
    surface_base: string;
    text_primary: string;
    accent_primary: string;
    accent_secondary: string;
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
