import type { ColorLocation, ExtractedColor, PaletteSelectionResult, RoleLocations } from './types';
import type { ThemeTone, VariantMode } from '../theme/types';
import { contrastRatio } from '../theme/color-utils';

/** Maximum RGB color distance for finding a matching pixel (~ΔE 10-15) */
const MAX_COLOR_DISTANCE = 50;

/** Minimum saturation for a color to be considered an accent (%) */
const MIN_ACCENT_SATURATION = 25;

/** Minimum contrast ratio for text legibility (WCAG AA) */
const MIN_CONTRAST_RATIO = 4.5;

/**
 * Minimum perceptual color distance for accent selection.
 * Uses combined hue + saturation distance for better human perception matching.
 * E.g., coral (8°, 69%) vs tan (35°, 40%) = sqrt(27² + 29²) ≈ 40
 */
const MIN_COLOR_DISTANCE_SECONDARY = 50;
const MIN_COLOR_DISTANCE_TERTIARY = 40;
const MIN_COLOR_DISTANCE_QUATERNARY = 30;

/** Surface saturation for sampled fallback, dark themes (%) */
const FALLBACK_SURFACE_SAT_DARK = 20;

/** Surface saturation for sampled fallback, light themes (%) */
const FALLBACK_SURFACE_SAT_LIGHT = 25;

/** Surface saturation for vibrant mode (%) */
const VIBRANT_SURFACE_SAT = 55;

/** Fixed surface lightness for dark themes (%) */
const DARK_SURFACE_LIGHTNESS = 22;

/** Fixed surface lightness for light themes (%) */
const LIGHT_SURFACE_LIGHTNESS = 80;

/** Sampled surface lightness range for dark themes (%) */
const SAMPLED_DARK_LIGHTNESS_MIN = 15;
const SAMPLED_DARK_LIGHTNESS_MAX = 30;

/** Sampled surface lightness range for light themes (%) */
const SAMPLED_LIGHT_LIGHTNESS_MIN = 70;
const SAMPLED_LIGHT_LIGHTNESS_MAX = 85;

/** Sampled surface saturation range (%) - allow more vibrant surfaces */
const SAMPLED_SATURATION_MIN = 5;
const SAMPLED_SATURATION_MAX = 70;

/** Minimum population percentage for sampled surface candidates (%) */
const SAMPLED_MIN_POPULATION = 2;

/** Ideal hue distance for color harmony (degrees) - peaks at 150° */
const IDEAL_HARMONY_DISTANCE = 150;

/** Default fallback colors */
const FALLBACK_TEXT_DARK = '#ffffff';
const FALLBACK_TEXT_LIGHT = '#121212';

/** Calculate circular hue distance (0-180) */
function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/**
 * Calculate perceptual color distance combining hue and saturation.
 * This better matches human perception than hue alone - e.g., a desaturated
 * tan is perceptually distinct from a saturated coral even at similar hues.
 */
function perceptualColorDistance(
  h1: number, s1: number,
  h2: number, s2: number
): number {
  const hueDist = hueDistance(h1, h2);
  const satDist = Math.abs(s1 - s2);
  return Math.sqrt(hueDist * hueDist + satDist * satDist);
}

/** Get complementary hue */
function complementaryHue(hue: number): number {
  return (hue + 180) % 360;
}

/** Calculate Euclidean distance between two hex colors in RGB space */
function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  return Math.sqrt(
    (rgb1.r - rgb2.r) ** 2 +
    (rgb1.g - rgb2.g) ** 2 +
    (rgb1.b - rgb2.b) ** 2
  );
}

/** Convert hex color to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Find the closest matching pixel location for a target color.
 * Used for synthetic colors (like surface_base) that need a real pixel location.
 */
function findClosestPixelLocation(
  targetHex: string,
  colors: ExtractedColor[],
  maxDistance: number = MAX_COLOR_DISTANCE
): ColorLocation | undefined {
  let closestLocation: ColorLocation | undefined;
  let closestDistance = Infinity;

  for (const color of colors) {
    if (!color.location) continue;

    const distance = colorDistance(targetHex, color.hex);
    if (distance < closestDistance && distance <= maxDistance) {
      closestDistance = distance;
      closestLocation = color.location;
    }
  }

  return closestLocation;
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
 * Find a suitable surface color by sampling directly from extracted pixels.
 * Filters by lightness, saturation, and population to find candidates that
 * will work well as a surface color while maintaining connection to the image.
 */
function selectSampledSurface(
  colors: ExtractedColor[],
  tonePreference: ThemeTone
): { color: ExtractedColor; candidateCount: number; score: number } | null {
  const isDark = tonePreference === 'dark';

  // Define target lightness range based on theme tone
  const lightnessMin = isDark ? SAMPLED_DARK_LIGHTNESS_MIN : SAMPLED_LIGHT_LIGHTNESS_MIN;
  const lightnessMax = isDark ? SAMPLED_DARK_LIGHTNESS_MAX : SAMPLED_LIGHT_LIGHTNESS_MAX;
  const idealLightness = isDark ? DARK_SURFACE_LIGHTNESS : LIGHT_SURFACE_LIGHTNESS;

  // Filter candidates by lightness, saturation, and population
  const candidates = colors.filter(c => {
    const { l, s } = c.hsl;
    const population = c.percentage ?? c.population;

    return (
      l >= lightnessMin &&
      l <= lightnessMax &&
      s >= SAMPLED_SATURATION_MIN &&
      s <= SAMPLED_SATURATION_MAX &&
      population >= SAMPLED_MIN_POPULATION
    );
  });

  if (candidates.length === 0) {
    return null;
  }

  // Compute dominant hue for harmony scoring
  const dominantHue = computeDominantHue(colors);

  // Score each candidate
  const scored = candidates.map(c => {
    const population = c.percentage ?? c.population;

    // Lightness score: closer to ideal is better (0-30 points)
    const lightnessDelta = Math.abs(c.hsl.l - idealLightness);
    const lightnessScore = Math.max(0, 30 - lightnessDelta * 2);

    // Harmony score: how well does it harmonize with dominant hue (0-20 points)
    const harmony = harmonyScore(c.hsl.h, dominantHue);

    // Population score: higher population is better (0-20 points)
    const populationScore = Math.min(20, population * 2);

    const totalScore = lightnessScore + harmony + populationScore;

    return { color: c, score: totalScore };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  return {
    color: best.color,
    candidateCount: candidates.length,
    score: best.score,
  };
}

/**
 * Synthesize a surface color at the image's dominant hue.
 * Decouples "what hue is the image" from "does the image have dark pixels of that hue."
 * Lightness and saturation are design-calibrated constants, not extracted from pixels.
 *
 * For 'sampled' mode, attempts to find a real pixel first, falling back to synthesis.
 */
function selectSurfaceColor(
  colors: ExtractedColor[],
  tonePreference: ThemeTone,
  variantMode: VariantMode
): { surface: ExtractedColor; sampledInfo?: { candidateCount: number; score: number } } {
  // For sampled mode, try to find a real pixel first
  if (variantMode === 'sampled') {
    const sampled = selectSampledSurface(colors, tonePreference);
    if (sampled) {
      return {
        surface: sampled.color,
        sampledInfo: {
          candidateCount: sampled.candidateCount,
          score: sampled.score,
        },
      };
    }
    // Fall through to synthesis if no suitable candidate found
  }
  const dominantHue = computeDominantHue(colors);
  const lightness = tonePreference === 'dark' ? DARK_SURFACE_LIGHTNESS : LIGHT_SURFACE_LIGHTNESS;
  const saturation = variantMode === 'vibrant'
    ? VIBRANT_SURFACE_SAT
    : (tonePreference === 'dark' ? FALLBACK_SURFACE_SAT_DARK : FALLBACK_SURFACE_SAT_LIGHT);

  return {
    surface: {
      hex: hslToHex(dominantHue, saturation, lightness),
      rgb: { r: 0, g: 0, b: 0 }, // synthetic — rgb unused downstream
      hsl: { h: dominantHue, s: saturation, l: lightness },
      population: 0,
      percentage: 0,
    },
  };
}

/** Options for palette selection */
export interface PaletteSelectionOptions {
  /** User's preferred tone (required for meaningful surface selection) */
  tonePreference?: ThemeTone;
  /**
   * Variant mode controls how the surface color is selected:
   * - 'sampled': Sample from image pixels (default), falls back to synthesis
   * - 'vibrant': Bold, dramatically colored surfaces (synthesized)
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

  const { tonePreference, variantMode = 'sampled' } = options;

  // 1. Tone: required for surface selection
  // If not provided, derive from most prominent color
  const tone: ThemeTone = tonePreference ?? (colors[0].hsl.l < 50 ? 'dark' : 'light');

  // 2. Surface base: THE KEY DECISION - uses variant mode
  const surfaceResult = selectSurfaceColor(colors, tone, variantMode);
  const surfaceBase = surfaceResult.surface;

  // Find a real pixel location for the synthetic surface color (sampled mode already has location)
  if (!surfaceBase.location) {
    surfaceBase.location = findClosestPixelLocation(surfaceBase.hex, colors);
  }

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

  // 5. Accent secondary: perceptually distinct from primary (hue + saturation)
  let accentSecondary: ExtractedColor | null = null;
  let bestSecondaryScore = 0;
  let secondaryColorDistance = 0;

  for (const color of sortedByAccent) {
    if (color.hex === accentPrimary.hex) continue;

    const dist = perceptualColorDistance(
      color.hsl.h, color.hsl.s,
      accentPrimary.hsl.h, accentPrimary.hsl.s
    );
    if (dist >= MIN_COLOR_DISTANCE_SECONDARY) {
      // Combine: perceptual distance and harmony with primary accent
      const harmony = harmonyScore(color.hsl.h, accentPrimary.hsl.h);
      const score = dist + harmony;
      if (!accentSecondary || score > bestSecondaryScore) {
        accentSecondary = color;
        bestSecondaryScore = score;
        secondaryColorDistance = dist;
      }
    }
  }

  // Track whether secondary was extracted vs synthesized
  const secondaryWasExtracted = !!accentSecondary;

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
    secondaryColorDistance = 180;
  }

  // 6. Accent tertiary & quaternary: additional colors for hue injection zones
  // Uses perceptual distance (hue + saturation) to find distinct color families
  const selectedAccents = [
    { h: accentPrimary.hsl.h, s: accentPrimary.hsl.s },
    { h: accentSecondary.hsl.h, s: accentSecondary.hsl.s },
  ];
  let accentTertiary: ExtractedColor | null = null;
  let accentQuaternary: ExtractedColor | null = null;
  let tertiaryWasExtracted = false;
  let quaternaryWasExtracted = false;

  // Find tertiary: must be perceptually distinct from ALL already-selected accents
  for (const color of sortedByAccent) {
    if (color.hex === accentPrimary.hex || color.hex === accentSecondary.hex) continue;

    const distFromAll = selectedAccents.every(acc =>
      perceptualColorDistance(color.hsl.h, color.hsl.s, acc.h, acc.s) >= MIN_COLOR_DISTANCE_TERTIARY
    );
    if (distFromAll) {
      // Score by saturation + harmony with existing palette
      const avgHarmony = selectedAccents.reduce((sum, acc) => sum + harmonyScore(color.hsl.h, acc.h), 0) / selectedAccents.length;
      const score = color.hsl.s + avgHarmony * 0.5;
      if (!accentTertiary || score > (accentTertiary.hsl.s + avgHarmony * 0.5)) {
        accentTertiary = color;
        tertiaryWasExtracted = true;
      }
    }
  }

  // If tertiary found, add it and look for quaternary
  if (accentTertiary) {
    selectedAccents.push({ h: accentTertiary.hsl.h, s: accentTertiary.hsl.s });

    for (const color of sortedByAccent) {
      if (color.hex === accentPrimary.hex || color.hex === accentSecondary.hex || color.hex === accentTertiary.hex) continue;

      const distFromAll = selectedAccents.every(acc =>
        perceptualColorDistance(color.hsl.h, color.hsl.s, acc.h, acc.s) >= MIN_COLOR_DISTANCE_QUATERNARY
      );
      if (distFromAll) {
        const avgHarmony = selectedAccents.reduce((sum, acc) => sum + harmonyScore(color.hsl.h, acc.h), 0) / selectedAccents.length;
        const score = color.hsl.s + avgHarmony * 0.5;
        if (!accentQuaternary || score > (accentQuaternary.hsl.s + avgHarmony * 0.5)) {
          accentQuaternary = color;
          quaternaryWasExtracted = true;
        }
      }
    }
  }

  // Count how many accents came from extraction (not synthesized)
  let extractedAccentCount = 1; // primary always extracted
  if (secondaryWasExtracted) extractedAccentCount++;
  if (tertiaryWasExtracted) extractedAccentCount++;
  if (quaternaryWasExtracted) extractedAccentCount++;

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

  // Include locations for tertiary/quaternary if extracted
  if (accentTertiary?.location) {
    roleLocations.accent_tertiary = accentTertiary.location;
  }
  if (accentQuaternary?.location) {
    roleLocations.accent_quaternary = accentQuaternary.location;
  }

  const debugInfo = {
    contrastRatio: finalContrast,
    primarySaturation: accentPrimary.hsl.s,
    secondaryHueDistance: secondaryColorDistance, // Now perceptual distance, not just hue
    // Surface sampling debug info
    surfaceWasSampled: !!surfaceResult.sampledInfo,
    surfaceCandidateCount: surfaceResult.sampledInfo?.candidateCount,
    surfaceSampledScore: surfaceResult.sampledInfo?.score,
    // Extended accent extraction info
    extractedAccentCount,
  };

  return {
    roles: {
      tone,
      surface_base: surfaceBase.hex,
      text_primary: textPrimaryHex,
      accent_primary: accentPrimary.hex,
      accent_secondary: accentSecondary.hex,
      // Include tertiary/quaternary if extracted (undefined otherwise)
      ...(accentTertiary && { accent_tertiary: accentTertiary.hex }),
      ...(accentQuaternary && { accent_quaternary: accentQuaternary.hex }),
    },
    roleLocations,
    extractedColors: colors,
    debug: debugInfo,
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
