import type { ExtractedColor, PaletteSelectionResult, RoleLocations } from './types';
import type { ThemeTone } from '../theme/types';
import { contrastRatio } from '../theme/color-utils';

/** Minimum saturation for a color to be considered an accent (%) */
const MIN_ACCENT_SATURATION = 35;

/** Minimum contrast ratio for text legibility (WCAG AA) */
const MIN_CONTRAST_RATIO = 4.5;

/** Minimum hue distance between primary and secondary accents */
const MIN_HUE_DISTANCE = 60;

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
 * Select semantic color roles from extracted colors.
 *
 * Algorithm:
 * 1. surface_base = most prominent color
 * 2. tone = dark if surface_base lightness < 50
 * 3. text_primary = first color with good contrast, or fallback
 * 4. accent_primary = most saturated (prefer warm hues)
 * 5. accent_secondary = next saturated with hue distance, or complement
 */
export function selectThemePalette(colors: ExtractedColor[]): PaletteSelectionResult {
  if (colors.length === 0) {
    throw new Error('No colors provided for palette selection');
  }

  // 1. Surface base: most prominent (already sorted by population)
  const surfaceBase = colors[0];

  // 2. Tone: determined by surface lightness
  const tone: ThemeTone = surfaceBase.hsl.l < 50 ? 'dark' : 'light';

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

  // 4. Accent primary: most saturated, prefer warm hues
  const accentCandidates = colors
    .filter(c => c.hsl.s >= MIN_ACCENT_SATURATION)
    .filter(c => c.hex !== surfaceBase.hex && c.hex !== textPrimaryHex);

  // Sort by saturation, with warm hue bonus
  const sortedByAccent = [...accentCandidates].sort((a, b) => {
    const aScore = a.hsl.s + (isWarmHue(a.hsl.h) ? 10 : 0);
    const bScore = b.hsl.s + (isWarmHue(b.hsl.h) ? 10 : 0);
    return bScore - aScore;
  });

  // Use most saturated, or fall back to most prominent non-surface color
  const accentPrimary = sortedByAccent[0] ?? colors.find(c => c.hex !== surfaceBase.hex) ?? colors[0];

  // 5. Accent secondary: next saturated with hue distance, prefer cool
  let accentSecondary: ExtractedColor | null = null;
  let secondaryHueDistance = 0;

  for (const color of sortedByAccent) {
    if (color.hex === accentPrimary.hex) continue;

    const dist = hueDistance(color.hsl.h, accentPrimary.hsl.h);
    if (dist >= MIN_HUE_DISTANCE) {
      // Prefer cool hues for secondary
      const score = dist + (isCoolHue(color.hsl.h) ? 20 : 0);
      if (!accentSecondary || score > secondaryHueDistance + (isCoolHue(accentSecondary.hsl.h) ? 20 : 0)) {
        accentSecondary = color;
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
