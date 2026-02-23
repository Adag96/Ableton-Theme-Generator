import { hslToHex } from './color-utils';
import type { ThemeTone } from './types';
import type { PaletteSelectionResult } from '../extraction/types';

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';

const HARMONY_TYPES: HarmonyType[] = ['complementary', 'analogous', 'triadic', 'split-complementary'];

/** Generate hue offsets for a given harmony type */
function getHarmonyHues(baseHue: number, harmony: HarmonyType): number[] {
  const hues: number[] = [baseHue];
  switch (harmony) {
    case 'complementary':
      hues.push((baseHue + 180) % 360);
      break;
    case 'analogous':
      hues.push((baseHue + 30) % 360);
      hues.push((baseHue + 330) % 360); // -30
      break;
    case 'triadic':
      hues.push((baseHue + 120) % 360);
      hues.push((baseHue + 240) % 360);
      break;
    case 'split-complementary':
      hues.push((baseHue + 150) % 360);
      hues.push((baseHue + 210) % 360);
      break;
  }
  return hues;
}

/** Random float in range [min, max) */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random harmonious palette that feeds directly into the derivation pipeline.
 * Returns a PaletteSelectionResult with the 5 required semantic color roles.
 */
export function generateRandomPalette(tone: ThemeTone): PaletteSelectionResult {
  const baseHue = rand(0, 360);
  const harmony = pick(HARMONY_TYPES);
  const hues = getHarmonyHues(baseHue, harmony);

  // Surface: use base hue at calibrated lightness/saturation for the tone
  const surfaceS = rand(10, 30);
  const surfaceL = tone === 'dark' ? rand(15, 28) : rand(75, 88);
  const surface_base = hslToHex(baseHue, surfaceS, surfaceL);

  // Text: high contrast against surface
  const textL = tone === 'dark' ? rand(68, 82) : rand(10, 22);
  const textS = rand(0, 8);
  const text_primary = hslToHex(baseHue, textS, textL);

  // Accent 1: use a harmony hue with high saturation
  const accent1Hue = hues.length > 1 ? hues[1] : (baseHue + 180) % 360;
  const accent1S = rand(55, 85);
  const accent1L = rand(45, 65);
  const accent_primary = hslToHex(accent1Hue, accent1S, accent1L);

  // Accent 2: another harmony hue, or offset from accent 1
  const accent2Hue = hues.length > 2
    ? hues[2]
    : (accent1Hue + rand(60, 120)) % 360;
  const accent2S = rand(50, 80);
  const accent2L = rand(45, 65);
  const accent_secondary = hslToHex(accent2Hue, accent2S, accent2L);

  return {
    roles: {
      tone,
      surface_base,
      text_primary,
      accent_primary,
      accent_secondary,
    },
    roleLocations: {},
    extractedColors: [],
  };
}
