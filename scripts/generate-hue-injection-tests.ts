/**
 * Generate test themes to compare hue injection effects.
 * Creates 6 themes per image: light/dark x (none, 50%, 100%) hue injection.
 *
 * Usage: npx tsx scripts/generate-hue-injection-tests.ts <image1.png> [image2.png] ...
 *
 * Outputs themes directly to Ableton's Themes directory.
 */
import sharp from 'sharp';
import { writeFileSync, existsSync } from 'fs';
import { basename, join } from 'path';
import { generateTheme } from '../src/theme/derivation';
import { generateAskXml } from '../src/theme/ask-generator';
import { selectThemePalette } from '../src/extraction/palette-selection';
import type { ExtractedColor, RGB } from '../src/extraction/types';
import type { SemanticColorRoles, ThemeTone, VariantMode } from '../src/theme/types';

// Ableton themes directory (macOS)
const THEMES_DIR = '/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Themes';

// Extraction settings
const MAX_SIZE = 400;
const QUANTIZATION_BITS = 5;
const COLOR_COUNT = 16;

interface ColorEntry {
  rgb: RGB;
  count: number;
  location: { x: number; y: number };
}

interface ColorBucket {
  colors: ColorEntry[];
  totalCount: number;
}

/** Quantize a color channel */
function quantize(value: number, bits: number): number {
  const shift = 8 - bits;
  return ((value >> shift) << shift) + (1 << (shift - 1));
}

/** Create a unique key for a quantized RGB color */
function colorKey(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

/** Find the channel with the largest range */
function findLargestRangeChannel(bucket: ColorBucket): 'r' | 'g' | 'b' {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const { rgb } of bucket.colors) {
    minR = Math.min(minR, rgb.r); maxR = Math.max(maxR, rgb.r);
    minG = Math.min(minG, rgb.g); maxG = Math.max(maxG, rgb.g);
    minB = Math.min(minB, rgb.b); maxB = Math.max(maxB, rgb.b);
  }
  const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB;
  if (rangeR >= rangeG && rangeR >= rangeB) return 'r';
  if (rangeG >= rangeR && rangeG >= rangeB) return 'g';
  return 'b';
}

/** Split a bucket at the median */
function splitBucket(bucket: ColorBucket): [ColorBucket, ColorBucket] {
  const channel = findLargestRangeChannel(bucket);
  const sorted = [...bucket.colors].sort((a, b) => a.rgb[channel] - b.rgb[channel]);
  const halfCount = bucket.totalCount / 2;
  let runningCount = 0, splitIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    runningCount += sorted[i].count;
    if (runningCount >= halfCount) { splitIndex = Math.max(1, i); break; }
  }
  const left = sorted.slice(0, splitIndex);
  const right = sorted.slice(splitIndex);
  return [
    { colors: left, totalCount: left.reduce((sum, c) => sum + c.count, 0) },
    { colors: right, totalCount: right.reduce((sum, c) => sum + c.count, 0) },
  ];
}

/** Get weighted average color from a bucket */
function averageBucketColor(bucket: ColorBucket): { rgb: RGB; count: number; location: { x: number; y: number } } {
  let r = 0, g = 0, b = 0;
  let mostPopulous = bucket.colors[0];
  for (const entry of bucket.colors) {
    r += entry.rgb.r * entry.count;
    g += entry.rgb.g * entry.count;
    b += entry.rgb.b * entry.count;
    if (entry.count > mostPopulous.count) mostPopulous = entry;
  }
  return {
    rgb: {
      r: Math.round(r / bucket.totalCount),
      g: Math.round(g / bucket.totalCount),
      b: Math.round(b / bucket.totalCount),
    },
    count: bucket.totalCount,
    location: mostPopulous.location,
  };
}

/** RGB to hex conversion */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** RGB to HSL conversion */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Calculate saturation for outlier detection */
function rgbSaturation(r: number, g: number, b: number): number {
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return (l > 0.5 ? d / (2 - max - min) : d / (max + min)) * 100;
}

/** Calculate hue for outlier detection */
function rgbHue(r: number, g: number, b: number): number {
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === rNorm) h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
  else if (max === gNorm) h = ((bNorm - rNorm) / d + 2) / 6;
  else h = ((rNorm - gNorm) / d + 4) / 6;
  return h * 360;
}

/** Circular hue distance */
function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/** Check if a color is well-represented */
function isWellRepresented(
  entry: ColorEntry,
  bucketAverages: Array<{ rgb: RGB; hue: number; saturation: number }>
): boolean {
  const entryHue = rgbHue(entry.rgb.r, entry.rgb.g, entry.rgb.b);
  const entrySat = rgbSaturation(entry.rgb.r, entry.rgb.g, entry.rgb.b);
  for (const bucket of bucketAverages) {
    if (hueDistance(entryHue, bucket.hue) < 30 && Math.abs(entrySat - bucket.saturation) < 20) {
      return true;
    }
  }
  return false;
}

/** Find saturated outliers */
function findSaturatedOutliers(
  colorMap: Map<number, ColorEntry>,
  existingBuckets: ColorBucket[]
): ColorBucket[] {
  const bucketAverages = existingBuckets
    .filter(b => b.colors.length > 0)
    .map(bucket => {
      const avg = averageBucketColor(bucket);
      return {
        rgb: avg.rgb,
        hue: rgbHue(avg.rgb.r, avg.rgb.g, avg.rgb.b),
        saturation: rgbSaturation(avg.rgb.r, avg.rgb.g, avg.rgb.b),
      };
    });

  const outlierCandidates: Array<{ entry: ColorEntry; saturation: number }> = [];
  for (const entry of colorMap.values()) {
    const saturation = rgbSaturation(entry.rgb.r, entry.rgb.g, entry.rgb.b);
    if (saturation >= 50 && !isWellRepresented(entry, bucketAverages)) {
      outlierCandidates.push({ entry, saturation });
    }
  }

  outlierCandidates.sort((a, b) => {
    const scoreA = a.saturation * Math.log(a.entry.count + 1);
    const scoreB = b.saturation * Math.log(b.entry.count + 1);
    return scoreB - scoreA;
  });

  const outlierBuckets: ColorBucket[] = [];
  const usedHues: number[] = [];
  for (const { entry } of outlierCandidates) {
    if (outlierBuckets.length >= 3) break;
    const hue = rgbHue(entry.rgb.r, entry.rgb.g, entry.rgb.b);
    if (!usedHues.some(h => hueDistance(h, hue) < 30)) {
      usedHues.push(hue);
      outlierBuckets.push({ colors: [entry], totalCount: entry.count });
    }
  }
  return outlierBuckets;
}

/**
 * Extract colors from image using sharp (Node.js implementation)
 */
async function extractColorsFromImage(imagePath: string): Promise<ExtractedColor[]> {
  // Load and resize image
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const scale = Math.min(1, MAX_SIZE / Math.max(metadata.width!, metadata.height!));
  const width = Math.round(metadata.width! * scale);
  const height = Math.round(metadata.height! * scale);

  const { data, info } = await image
    .resize(width, height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  const channels = info.channels;

  // Build color frequency map
  const colorMap = new Map<number, ColorEntry>();
  for (let i = 0; i < data.length; i += channels) {
    const r = quantize(data[i], QUANTIZATION_BITS);
    const g = quantize(data[i + 1], QUANTIZATION_BITS);
    const b = quantize(data[i + 2], QUANTIZATION_BITS);

    // Skip transparent pixels (if alpha channel exists)
    if (channels === 4 && data[i + 3] < 128) continue;

    const pixelIndex = i / channels;
    const x = (pixelIndex % info.width) / info.width;
    const y = Math.floor(pixelIndex / info.width) / info.height;

    const key = colorKey(r, g, b);
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { rgb: { r, g, b }, count: 1, location: { x, y } });
    }
  }

  // Median cut algorithm
  const initialBucket: ColorBucket = {
    colors: Array.from(colorMap.values()),
    totalCount: totalPixels,
  };

  const buckets: ColorBucket[] = [initialBucket];
  while (buckets.length < COLOR_COUNT) {
    let maxIndex = 0, maxSize = 0;
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].colors.length > maxSize) {
        maxSize = buckets[i].colors.length;
        maxIndex = i;
      }
    }
    if (maxSize <= 1) break;
    const [left, right] = splitBucket(buckets[maxIndex]);
    buckets.splice(maxIndex, 1, left, right);
  }

  // Add saturated outliers
  buckets.push(...findSaturatedOutliers(colorMap, buckets));

  // Convert to extracted colors
  return buckets
    .filter(b => b.colors.length > 0)
    .map(bucket => {
      const { rgb, count, location } = averageBucketColor(bucket);
      return {
        hex: rgbToHex(rgb.r, rgb.g, rgb.b),
        rgb,
        hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
        population: count,
        percentage: (count / totalPixels) * 100,
        location,
      };
    })
    .sort((a, b) => b.population - a.population);
}

/**
 * Extract a short, meaningful name from an image path.
 * Takes the first recognizable word (ignoring UUIDs, numbers, etc.)
 */
function extractShortName(imagePath: string): string {
  const fileName = basename(imagePath, '.png');
  // Split on common separators and filter out UUID-like strings and short tokens
  const tokens = fileName.split(/[-_\s]+/)
    .filter(t => t.length > 3 && !/^[a-f0-9]{4,}$/i.test(t) && !/^\d+$/.test(t));
  // Return first meaningful token, capitalized, or fallback
  if (tokens.length > 0) {
    const word = tokens[0].toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return 'Image';
}

/**
 * Generate themes for an image with different hue injection settings
 */
async function generateTestThemes(imagePath: string): Promise<void> {
  const imageName = extractShortName(imagePath);
  console.log(`\n=== Processing: ${imageName} ===`);

  // Extract colors
  const colors = await extractColorsFromImage(imagePath);
  console.log(`Extracted ${colors.length} colors`);

  // Test configurations
  const configs: Array<{
    tone: ThemeTone;
    hueEnabled: boolean;
    hueStrength: number;
    suffix: string;
  }> = [
    // Dark themes
    { tone: 'dark', hueEnabled: false, hueStrength: 0, suffix: 'Dark-NoHue' },
    { tone: 'dark', hueEnabled: true, hueStrength: 0.5, suffix: 'Dark-Hue50' },
    { tone: 'dark', hueEnabled: true, hueStrength: 1.0, suffix: 'Dark-Hue100' },
    // Light themes
    { tone: 'light', hueEnabled: false, hueStrength: 0, suffix: 'Light-NoHue' },
    { tone: 'light', hueEnabled: true, hueStrength: 0.5, suffix: 'Light-Hue50' },
    { tone: 'light', hueEnabled: true, hueStrength: 1.0, suffix: 'Light-Hue100' },
  ];

  for (const config of configs) {
    // Select palette with the specified tone
    const paletteResult = selectThemePalette(colors, {
      tonePreference: config.tone,
      variantMode: 'sampled' as VariantMode,
    });

    // Build semantic roles with hue injection settings
    const roles: SemanticColorRoles = {
      ...paletteResult.roles,
      hueInjection: config.hueEnabled
        ? { enabled: true, strength: config.hueStrength }
        : undefined,
    };

    // Generate theme
    const themeData = generateTheme(roles);
    const xml = generateAskXml(themeData);

    // Write to Ableton themes directory
    const themeName = `TEST-${imageName}-${config.suffix}`;
    const outputPath = join(THEMES_DIR, `${themeName}.ask`);
    writeFileSync(outputPath, xml, 'utf-8');
    console.log(`  Created: ${themeName}.ask`);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/generate-hue-injection-tests.ts <image1.png> [image2.png] ...');
    process.exit(1);
  }

  // Verify themes directory exists
  if (!existsSync(THEMES_DIR)) {
    console.error(`Ableton themes directory not found: ${THEMES_DIR}`);
    process.exit(1);
  }

  for (const imagePath of args) {
    if (!existsSync(imagePath)) {
      console.error(`Image not found: ${imagePath}`);
      continue;
    }
    await generateTestThemes(imagePath);
  }

  console.log('\nDone! Restart Ableton Live to see the new themes.');
}

main().catch(console.error);
