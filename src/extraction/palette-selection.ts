import type { ExtractedColor, PaletteSelectionResult, RoleLocations } from './types';
import type { ThemeTone, VariantMode } from '../theme/types';
import { contrastRatio } from '../theme/color-utils';

/** Minimum saturation for a color to be considered an accent (%) */
const MIN_ACCENT_SATURATION = 35;

/** Minimum contrast ratio for text legibility (WCAG AA) */
const MIN_CONTRAST_RATIO = 4.5;

/** Minimum hue distance between primary and secondary accents */
const MIN_HUE_DISTANCE = 60;

/** Maximum saturation for muted mode surface colors (%) */
const MUTED_MAX_SATURATION = 40;

/** Target saturation when desaturating for muted mode (%) */
const MUTED_DESATURATED_TARGET = 30;

/** Maximum saturation for faithful mode before slight reduction (%) */
const FAITHFUL_MAX_SATURATION = 60;

/** Maximum saturation for vibrant mode surfaces (%) */
const VIBRANT_MAX_SATURATION = 75;

/** Minimum saturation for vibrant mode to consider a color (%) */
const VIBRANT_MIN_SATURATION = 30;

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
 * Select surface color based on variant mode.
 * This is THE KEY decision that shapes the theme's overall feel.
 */
function selectSurfaceColor(
  colors: ExtractedColor[],
  tonePreference: ThemeTone,
  variantMode: VariantMode
): ExtractedColor {
  // Filter colors matching the tone preference
  const matchingColors = colors.filter(c =>
    tonePreference === 'dark' ? c.hsl.l < 50 : c.hsl.l >= 50
  );

  // If no colors match the tone, we need to create one
  if (matchingColors.length === 0) {
    const baseColor = variantMode === 'vibrant'
      ? [...colors].sort((a, b) => b.hsl.s - a.hsl.s)[0]  // Most saturated
      : colors[0];  // Most prominent

    const targetLightness = tonePreference === 'dark' ? 18 : 78;
    const targetSaturation = variantMode === 'muted'
      ? Math.min(baseColor.hsl.s, MUTED_DESATURATED_TARGET)
      : Math.min(baseColor.hsl.s, variantMode === 'vibrant' ? VIBRANT_MAX_SATURATION : FAITHFUL_MAX_SATURATION);

    return {
      ...baseColor,
      hex: hslToHex(baseColor.hsl.h, targetSaturation, targetLightness),
      hsl: { h: baseColor.hsl.h, s: targetSaturation, l: targetLightness },
    };
  }

  // FAITHFUL mode: Use the most prominent color, preserve its character
  if (variantMode === 'faithful') {
    const baseColor = matchingColors[0];  // Most prominent matching color

    // Only cap extreme saturation, otherwise keep as-is
    if (baseColor.hsl.s > FAITHFUL_MAX_SATURATION) {
      return {
        ...baseColor,
        hex: hslToHex(baseColor.hsl.h, FAITHFUL_MAX_SATURATION, baseColor.hsl.l),
        hsl: { h: baseColor.hsl.h, s: FAITHFUL_MAX_SATURATION, l: baseColor.hsl.l },
      };
    }
    return baseColor;
  }

  // VIBRANT mode: Use the most saturated color that matches the tone
  if (variantMode === 'vibrant') {
    // Sort by saturation (highest first)
    const sortedBySaturation = [...matchingColors].sort((a, b) => b.hsl.s - a.hsl.s);

    // Find a color with good saturation
    const vibrantCandidate = sortedBySaturation.find(c => c.hsl.s >= VIBRANT_MIN_SATURATION);
    const baseColor = vibrantCandidate ?? sortedBySaturation[0];

    // Cap at max vibrant saturation
    if (baseColor.hsl.s > VIBRANT_MAX_SATURATION) {
      return {
        ...baseColor,
        hex: hslToHex(baseColor.hsl.h, VIBRANT_MAX_SATURATION, baseColor.hsl.l),
        hsl: { h: baseColor.hsl.h, s: VIBRANT_MAX_SATURATION, l: baseColor.hsl.l },
      };
    }
    return baseColor;
  }

  // MUTED mode: Conservative approach - low saturation surfaces
  const lowSatCandidates = matchingColors.filter(c => c.hsl.s <= MUTED_MAX_SATURATION);

  if (lowSatCandidates.length > 0) {
    return lowSatCandidates[0];  // Most prominent low-saturation color
  }

  // No low-sat candidates - desaturate the most prominent
  const baseColor = matchingColors[0];
  return {
    ...baseColor,
    hex: hslToHex(baseColor.hsl.h, MUTED_DESATURATED_TARGET, baseColor.hsl.l),
    hsl: { h: baseColor.hsl.h, s: MUTED_DESATURATED_TARGET, l: baseColor.hsl.l },
  };
}

/** Options for palette selection */
export interface PaletteSelectionOptions {
  /** User's preferred tone (required for meaningful surface selection) */
  tonePreference?: ThemeTone;
  /**
   * Variant mode controls how the surface color is selected:
   * - 'faithful': Use most prominent color - replicate image feel (default)
   * - 'vibrant': Use most saturated color - bold, colorful surfaces
   * - 'muted': Conservative approach - desaturated, safe surfaces
   */
  variantMode?: VariantMode;
}

/**
 * Select semantic color roles from extracted colors.
 *
 * Algorithm:
 * 1. surface_base = selected based on variant mode (faithful/vibrant/muted)
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

  const { tonePreference, variantMode = 'faithful' } = options;

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
