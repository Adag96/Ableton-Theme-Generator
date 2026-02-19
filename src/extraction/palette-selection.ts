import type { ExtractedColor, PaletteSelectionResult, RoleLocations } from './types';
import type { ThemeTone } from '../theme/types';
import { contrastRatio } from '../theme/color-utils';

/** Minimum saturation for a color to be considered an accent (%) */
const MIN_ACCENT_SATURATION = 35;

/** Minimum contrast ratio for text legibility (WCAG AA) */
const MIN_CONTRAST_RATIO = 4.5;

/** Minimum hue distance between primary and secondary accents */
const MIN_HUE_DISTANCE = 60;

/** Maximum saturation for surface colors (%) - prevents aggressive backgrounds */
const MAX_SURFACE_SATURATION = 40;

/** Target saturation when desaturating a surface fallback (%) */
const DESATURATED_FALLBACK_TARGET = 30;

/** Ideal hue distance for color harmony (degrees) - peaks at 150° */
const IDEAL_HARMONY_DISTANCE = 150;

/** Default fallback colors */
const FALLBACK_TEXT_DARK = '#ffffff';
const FALLBACK_TEXT_LIGHT = '#121212';

/** Check if a hue is in the warm range (reds, oranges, yellows) */
function isWarmHue(hue: number): boolean {
  return (hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360);
}

/** Check if a hue is in the cool range (cyans, blues) */
function isCoolHue(hue: number): boolean {
  return hue >= 180 && hue <= 270;
}

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

/** Options for palette selection */
export interface PaletteSelectionOptions {
  /** User's preferred tone. If provided, prioritizes colors matching this tone for surface_base. */
  tonePreference?: ThemeTone;
}

/**
 * Select semantic color roles from extracted colors.
 *
 * Algorithm:
 * 1. surface_base = best color matching tone preference (or most prominent if no preference)
 * 2. tone = user preference, or derived from surface_base lightness
 * 3. text_primary = first color with good contrast, or fallback
 * 4. accent_primary = most saturated (prefer warm hues)
 * 5. accent_secondary = next saturated with hue distance, or complement
 */
export function selectThemePalette(
  colors: ExtractedColor[],
  options: PaletteSelectionOptions = {}
): PaletteSelectionResult {
  if (colors.length === 0) {
    throw new Error('No colors provided for palette selection');
  }

  const { tonePreference } = options;

  // 1. Surface base: select based on tone preference
  // Apply saturation filtering to prevent aggressive backgrounds
  let surfaceBase: ExtractedColor;

  if (tonePreference) {
    // Find colors matching the tone preference
    const matchingColors = colors.filter(c =>
      tonePreference === 'dark' ? c.hsl.l < 50 : c.hsl.l >= 50
    );

    if (matchingColors.length > 0) {
      // Filter to low-saturation candidates (good for backgrounds)
      const lowSatCandidates = matchingColors.filter(c => c.hsl.s <= MAX_SURFACE_SATURATION);

      if (lowSatCandidates.length > 0) {
        // Pick the most prominent low-saturation color
        surfaceBase = lowSatCandidates[0];
      } else {
        // No low-saturation candidates - desaturate the best match
        const baseColor = matchingColors[0];
        const targetSaturation = DESATURATED_FALLBACK_TARGET;
        surfaceBase = {
          ...baseColor,
          hex: hslToHex(baseColor.hsl.h, targetSaturation, baseColor.hsl.l),
          hsl: { h: baseColor.hsl.h, s: targetSaturation, l: baseColor.hsl.l },
        };
      }
    } else {
      // No matching colors found - adjust the most prominent color
      // For light themes with only dark colors: brighten the most desaturated color
      // For dark themes with only light colors: darken the most desaturated color
      const sortedByLowSaturation = [...colors].sort((a, b) => a.hsl.s - b.hsl.s);
      const baseColor = sortedByLowSaturation[0];

      // Create an adjusted color with controlled saturation
      const targetLightness = tonePreference === 'dark' ? 20 : 75;
      const targetSaturation = Math.min(baseColor.hsl.s, DESATURATED_FALLBACK_TARGET);
      surfaceBase = {
        ...baseColor,
        hex: hslToHex(baseColor.hsl.h, targetSaturation, targetLightness),
        hsl: { h: baseColor.hsl.h, s: targetSaturation, l: targetLightness },
      };
    }
  } else {
    // No preference: use most prominent, but still apply saturation filter
    const lowSatCandidates = colors.filter(c => c.hsl.s <= MAX_SURFACE_SATURATION);
    if (lowSatCandidates.length > 0) {
      surfaceBase = lowSatCandidates[0];
    } else {
      // Desaturate the most prominent color
      const baseColor = colors[0];
      surfaceBase = {
        ...baseColor,
        hex: hslToHex(baseColor.hsl.h, DESATURATED_FALLBACK_TARGET, baseColor.hsl.l),
        hsl: { h: baseColor.hsl.h, s: DESATURATED_FALLBACK_TARGET, l: baseColor.hsl.l },
      };
    }
  }

  // 2. Tone: use preference if provided, otherwise derive from surface lightness
  const tone: ThemeTone = tonePreference ?? (surfaceBase.hsl.l < 50 ? 'dark' : 'light');

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

  // 4. Accent primary: most saturated, prefer warm hues, with harmony consideration
  const accentCandidates = colors
    .filter(c => c.hsl.s >= MIN_ACCENT_SATURATION)
    .filter(c => c.hex !== surfaceBase.hex && c.hex !== textPrimaryHex);

  // Sort by saturation, with warm hue bonus and harmony bonus relative to surface
  const sortedByAccent = [...accentCandidates].sort((a, b) => {
    const aHarmony = harmonyScore(a.hsl.h, surfaceBase.hsl.h);
    const bHarmony = harmonyScore(b.hsl.h, surfaceBase.hsl.h);
    const aScore = a.hsl.s + (isWarmHue(a.hsl.h) ? 10 : 0) + aHarmony * 0.5;
    const bScore = b.hsl.s + (isWarmHue(b.hsl.h) ? 10 : 0) + bHarmony * 0.5;
    return bScore - aScore;
  });

  // Use most saturated, or fall back to most prominent non-surface color
  const accentPrimary = sortedByAccent[0] ?? colors.find(c => c.hex !== surfaceBase.hex) ?? colors[0];

  // 5. Accent secondary: next saturated with hue distance, prefer cool, with harmony bonus
  let accentSecondary: ExtractedColor | null = null;
  let bestSecondaryScore = 0;
  let secondaryHueDistance = 0;

  for (const color of sortedByAccent) {
    if (color.hex === accentPrimary.hex) continue;

    const dist = hueDistance(color.hsl.h, accentPrimary.hsl.h);
    if (dist >= MIN_HUE_DISTANCE) {
      // Combine: hue distance, cool preference, and harmony with primary accent
      const harmony = harmonyScore(color.hsl.h, accentPrimary.hsl.h);
      const score = dist + (isCoolHue(color.hsl.h) ? 20 : 0) + harmony;
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
