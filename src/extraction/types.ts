import type { HSL, SemanticColorRoles, ContrastLevel } from '../theme/types';

/** RGB color representation (0-255 per channel) */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Normalized coordinates (0-1) of a representative pixel */
export interface ColorLocation {
  x: number;
  y: number;
}

/** A color extracted from an image with associated metadata */
export interface ExtractedColor {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  /** Number of pixels with this color (after quantization) */
  population: number;
  /** Percentage of total image pixels */
  percentage: number;
  /** Normalized coordinates (0-1) of a representative pixel */
  location?: ColorLocation;
}

/** Options for the color extraction algorithm */
export interface ExtractionOptions {
  /** Maximum dimension for canvas scaling (default: 400) */
  maxSize?: number;
  /** Number of color buckets to extract (default: 10) */
  colorCount?: number;
  /** Bits per channel for quantization (default: 5) */
  quantizationBits?: number;
}

/** Location info for a role color (undefined if synthetic/fallback) */
export type RoleLocations = Partial<Record<'surface_base' | 'text_primary' | 'accent_primary' | 'accent_secondary', ColorLocation>>;

/** Result of palette selection with semantic roles assigned */
export interface PaletteSelectionResult {
  /** The 5 required semantic color roles plus optional contrast level */
  roles: Pick<SemanticColorRoles, 'tone' | 'surface_base' | 'text_primary' | 'accent_primary' | 'accent_secondary'> & { contrastLevel?: ContrastLevel };
  /** Locations on the source image for each role color (if available) */
  roleLocations: RoleLocations;
  /** All extracted colors for display/debugging */
  extractedColors: ExtractedColor[];
  /** Debug info about role assignment decisions */
  debug?: {
    contrastRatio: number;
    primarySaturation: number;
    secondaryHueDistance: number;
  };
}
