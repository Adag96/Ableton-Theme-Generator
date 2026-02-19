import type { ExtractedColor, PaletteSelectionResult, RoleLocations } from './types';
import type { ThemeTone, VariantMode } from '../theme/types';
import { contrastRatio } from '../theme/color-utils';

/** Minimum saturation for a color to be considered an accent (%) */
const MIN_ACCENT_SATURATION = 35;

/** Minimum contrast ratio for text legibility (WCAG AA) */
const MIN_CONTRAST_RATIO = 4.5;

/** Minimum hue distance between primary and secondary accents */
const MIN_HUE_DISTANCE = 60;

/** Surface saturation for transparent mode, dark themes (%) */
const TRANSPARENT_SURFACE_SAT_DARK = 20;

/** Surface saturation for transparent mode, light themes (%) */
const TRANSPARENT_SURFACE_SAT_LIGHT = 25;

/** Surface saturation for vibrant mode (%) */
const VIBRANT_SURFACE_SAT = 55;

/** Fixed surface lightness for dark themes (%) */
const DARK_SURFACE_LIGHTNESS = 22;

/** Fixed surface lightness for light themes (%) */
const LIGHT_SURFACE_LIGHTNESS = 80;

/** Ideal hue distance for color harmony (degrees) - peaks at 150° */
const IDEAL_HARMONY_DISTANCE = 150;

/** Default fallback colors */
const FALLBACK_TEXT_DARK = '#ffffff';
const FALLBACK_TEXT_LIGHT = '#121212';

/** Calculate circular hue distance */
function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/** Get complementary hue */
function complementaryHue(hue: number): number {
  return (hue + 180) % 360;
}

/**
 * Calculate harmony score based on hue distance.
 * Peaks at ~150° (split-complementary), good for 120-180° range.
 * Returns a bonus score (0-20) to add to existing scoring.
 */
function harmonyScore(hue1: number, hue2: number): number {
  const distance = hueDistance(hue1, hue2);
  // Score peaks at IDEAL_HARMONY_DISTANCE (150°)
  return Math.max(0, 20 - Math.abs(distance - IDEAL_HARMONY_DISTANCE));
}

/**
 * Compute the dominant hue from a set of colors using a saturation-weighted circular mean.
 * Weighting by saturation × population ensures chromatic colors drive the result.
 * Returns 0 as a fallback for fully achromatic images.
 */
function computeDominantHue(colors: ExtractedColor[]): number {
  let sinSum = 0;
  let cosSum = 0;

  for (const color of colors) {
    const weight = color.hsl.s * color.population;
    const hueRad = (color.hsl.h * Math.PI) / 180;
    sinSum += weight * Math.sin(hueRad);
    cosSum += weight * Math.cos(hueRad);
  }

  // All colors are achromatic — fall back to neutral (hue 0)
  if (sinSum === 0 && cosSum === 0) return 0;

  const hueRad = Math.atan2(sinSum, cosSum);
  const hue = (hueRad * 180) / Math.PI;
  return hue < 0 ? hue + 360 : hue;
}

/**
 * Synthesize a surface color at the image's dominant hue.
 * Decouples "what hue is the image" from "does the image have dark pixels of that hue."
 * Lightness and saturation are design-calibrated constants, not extracted from pixels.
 */
function selectSurfaceColor(
  colors: ExtractedColor[],
  tonePreference: ThemeTone,
  variantMode: VariantMode
): ExtractedColor {
  const dominantHue = computeDominantHue(colors);
  const lightness = tonePreference === 'dark' ? DARK_SURFACE_LIGHTNESS : LIGHT_SURFACE_LIGHTNESS;
  const saturation = variantMode === 'vibrant'
    ? VIBRANT_SURFACE_SAT
    : (tonePreference === 'dark' ? TRANSPARENT_SURFACE_SAT_DARK : TRANSPARENT_SURFACE_SAT_LIGHT);

  return {
    hex: hslToHex(dominantHue, saturation, lightness),
    rgb: { r: 0, g: 0, b: 0 }, // synthetic — rgb unused downstream
    hsl: { h: dominantHue, s: saturation, l: lightness },
    population: 0,
    percentage: 0,
  };
}

/** Options for palette selection */
export interface PaletteSelectionOptions {
  /** User's preferred tone (required for meaningful surface selection) */
  tonePreference?: ThemeTone;
  /**
   * Variant mode controls the saturation of the synthesized surface:
   * - 'transparent': Subtle hue tint — professional (default)
   * - 'vibrant': Bold, dramatically colored surfaces
   */
  variantMode?: VariantMode;
}

/**
 * Select semantic color roles from extracted colors.
 *
 * Algorithm:
 * 1. surface_base = synthesized from dominant hue at calibrated lightness/saturation
 * 2. tone = user preference (required)
 * 3. text_primary = first color with good contrast, or fallback
 * 4. accent_primary = most saturated with harmony bonus
 * 5. accent_secondary = next saturated with hue distance, or complement
 */
export function selectThemePalette(
  colors: ExtractedColor[],
  options: PaletteSelectionOptions = {}
): PaletteSelectionResult {
  if (colors.length === 0) {
    throw new Error('No colors provided for palette selection');
  }

  const { tonePreference, variantMode = 'transparent' } = options;

  // 1. Tone: required for surface selection
  // If not provided, derive from most prominent color
  const tone: ThemeTone = tonePreference ?? (colors[0].hsl.l < 50 ? 'dark' : 'light');

  // 2. Surface base: THE KEY DECISION - uses variant mode
  const surfaceBase = selectSurfaceColor(colors, tone, variantMode);

  // 3. Text primary: find color with best contrast
  let textPrimary: ExtractedColor | null = null;
  let bestContrast = 0;

  for (const color of colors) {
    // Skip colors too similar to surface
    if (hueDistance(color.hsl.h, surfaceBase.hsl.h) < 30 &&
        Math.abs(color.hsl.l - surfaceBase.hsl.l) < 20) {
      continue;
    }

    const ratio = contrastRatio(color.hex, surfaceBase.hex);
    if (ratio >= MIN_CONTRAST_RATIO && ratio > bestContrast) {
      bestContrast = ratio;
      textPrimary = color;
    }
  }

  // Fallback to white/black based on tone
  const textPrimaryHex = textPrimary?.hex ?? (tone === 'dark' ? FALLBACK_TEXT_DARK : FALLBACK_TEXT_LIGHT);
  const finalContrast = textPrimary ? bestContrast : contrastRatio(textPrimaryHex, surfaceBase.hex);

  // 4. Accent primary: most saturated with harmony consideration
  const accentCandidates = colors
    .filter(c => c.hsl.s >= MIN_ACCENT_SATURATION)
    .filter(c => c.hex !== surfaceBase.hex && c.hex !== textPrimaryHex);

  // Sort by saturation with harmony bonus relative to surface
  const sortedByAccent = [...accentCandidates].sort((a, b) => {
    const aHarmony = harmonyScore(a.hsl.h, surfaceBase.hsl.h);
    const bHarmony = harmonyScore(b.hsl.h, surfaceBase.hsl.h);

    const aScore = a.hsl.s + aHarmony * 0.5;
    const bScore = b.hsl.s + bHarmony * 0.5;
    return bScore - aScore;
  });

  // Use most saturated, or fall back to most prominent non-surface color
  const accentPrimary = sortedByAccent[0] ?? colors.find(c => c.hex !== surfaceBase.hex) ?? colors[0];

  // 5. Accent secondary: next saturated with hue distance for contrast
  let accentSecondary: ExtractedColor | null = null;
  let bestSecondaryScore = 0;
  let secondaryHueDistance = 0;

  for (const color of sortedByAccent) {
    if (color.hex === accentPrimary.hex) continue;

    const dist = hueDistance(color.hsl.h, accentPrimary.hsl.h);
    if (dist >= MIN_HUE_DISTANCE) {
      // Combine: hue distance and harmony with primary accent
      const harmony = harmonyScore(color.hsl.h, accentPrimary.hsl.h);
      const score = dist + harmony;
      if (!accentSecondary || score > bestSecondaryScore) {
        accentSecondary = color;
        bestSecondaryScore = score;
        secondaryHueDistance = dist;
      }
    }
  }

  // Fallback: use complement of primary accent
  if (!accentSecondary) {
    const compHue = complementaryHue(accentPrimary.hsl.h);
    // Create a synthetic secondary by shifting the primary's hue
    accentSecondary = {
      ...accentPrimary,
      hex: '', // Will be derived
      hsl: { h: compHue, s: accentPrimary.hsl.s * 0.8, l: accentPrimary.hsl.l },
    };
    // Convert back to hex
    const { h, s, l } = accentSecondary.hsl;
    accentSecondary.hex = hslToHex(h, s, l);
    secondaryHueDistance = 180;
  }

  // Build role locations (undefined for synthetic/fallback colors)
  const roleLocations: RoleLocations = {
    surface_base: surfaceBase.location,
    accent_primary: accentPrimary.location,
  };

  // textPrimary may be a fallback hex string, so only include location if we found a matching color
  if (textPrimary?.location) {
    roleLocations.text_primary = textPrimary.location;
  }

  // accentSecondary has location only if it came from extracted colors (not synthetic)
  if (accentSecondary.location) {
    roleLocations.accent_secondary = accentSecondary.location;
  }

  return {
    roles: {
      tone,
      surface_base: surfaceBase.hex,
      text_primary: textPrimaryHex,
      accent_primary: accentPrimary.hex,
      accent_secondary: accentSecondary.hex,
    },
    roleLocations,
    extractedColors: colors,
    debug: {
      contrastRatio: finalContrast,
      primarySaturation: accentPrimary.hsl.s,
      secondaryHueDistance,
    },
  };
}

// Local HSL to hex conversion to avoid circular dependencies
function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return rgbToHexLocal(v, v, v);
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return rgbToHexLocal(
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255)
  );
}

function rgbToHexLocal(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
