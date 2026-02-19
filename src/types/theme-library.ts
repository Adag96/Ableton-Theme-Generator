import type { ContrastLevel } from '../theme/types';
import type { RoleLocations } from '../extraction/types';

export interface SavedTheme {
  id: string;
  name: string;
  createdAt: string;
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
}

export interface ThemeLibrary {
  version: 1;
  themes: SavedTheme[];
}
