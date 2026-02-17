import type { ContrastLevel } from '../theme/types';

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
}

export interface ThemeLibrary {
  version: 1;
  themes: SavedTheme[];
}
