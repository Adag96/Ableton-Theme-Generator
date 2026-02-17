import type { ColorLocation, ExtractedColor, ExtractionOptions, RGB } from './types';
import { rgbToHex, rgbToHsl } from '../theme/color-utils';

const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  maxSize: 400,
  colorCount: 10,
  quantizationBits: 5,
};

/** Quantize a color channel to reduce unique colors */
function quantize(value: number, bits: number): number {
  const shift = 8 - bits;
  return ((value >> shift) << shift) + (1 << (shift - 1));
}

/** Create a unique key for a quantized RGB color */
function colorKey(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

/** Color entry with accumulated location for centroid calculation */
interface ColorEntry {
  rgb: RGB;
  count: number;
  /** Accumulated location sum for centroid calculation */
  locationSum: { x: number; y: number };
}

/** Color bucket for median cut algorithm */
interface ColorBucket {
  colors: ColorEntry[];
  totalCount: number;
}

/** Find the channel with the largest range in a bucket */
function findLargestRangeChannel(bucket: ColorBucket): 'r' | 'g' | 'b' {
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (const { rgb } of bucket.colors) {
    minR = Math.min(minR, rgb.r);
    maxR = Math.max(maxR, rgb.r);
    minG = Math.min(minG, rgb.g);
    maxG = Math.max(maxG, rgb.g);
    minB = Math.min(minB, rgb.b);
    maxB = Math.max(maxB, rgb.b);
  }

  const rangeR = maxR - minR;
  const rangeG = maxG - minG;
  const rangeB = maxB - minB;

  if (rangeR >= rangeG && rangeR >= rangeB) return 'r';
  if (rangeG >= rangeR && rangeG >= rangeB) return 'g';
  return 'b';
}

/** Split a bucket at the median of the largest range channel */
function splitBucket(bucket: ColorBucket): [ColorBucket, ColorBucket] {
  const channel = findLargestRangeChannel(bucket);

  // Sort by the channel with largest range
  const sorted = [...bucket.colors].sort((a, b) => a.rgb[channel] - b.rgb[channel]);

  // Find median by pixel count
  const halfCount = bucket.totalCount / 2;
  let runningCount = 0;
  let splitIndex = 0;

  for (let i = 0; i < sorted.length; i++) {
    runningCount += sorted[i].count;
    if (runningCount >= halfCount) {
      splitIndex = Math.max(1, i);
      break;
    }
  }

  const left = sorted.slice(0, splitIndex);
  const right = sorted.slice(splitIndex);

  return [
    {
      colors: left,
      totalCount: left.reduce((sum, c) => sum + c.count, 0),
    },
    {
      colors: right,
      totalCount: right.reduce((sum, c) => sum + c.count, 0),
    },
  ];
}

/** Get weighted average color and centroid location from a bucket */
function averageBucketColor(bucket: ColorBucket): { rgb: RGB; count: number; location: ColorLocation } {
  let r = 0, g = 0, b = 0;
  let locationSumX = 0, locationSumY = 0;

  for (const { rgb, count, locationSum } of bucket.colors) {
    r += rgb.r * count;
    g += rgb.g * count;
    b += rgb.b * count;
    // Accumulate location sums for centroid
    locationSumX += locationSum.x;
    locationSumY += locationSum.y;
  }

  return {
    rgb: {
      r: Math.round(r / bucket.totalCount),
      g: Math.round(g / bucket.totalCount),
      b: Math.round(b / bucket.totalCount),
    },
    count: bucket.totalCount,
    // Centroid = average of all pixel locations in the bucket
    location: {
      x: locationSumX / bucket.totalCount,
      y: locationSumY / bucket.totalCount,
    },
  };
}

/** Calculate HSL saturation from RGB (0-100) */
function rgbSaturation(r: number, g: number, b: number): number {
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;

  if (max === min) return 0;

  const d = max - min;
  return (l > 0.5 ? d / (2 - max - min) : d / (max + min)) * 100;
}

/** Calculate hue from RGB (0-360) */
function rgbHue(r: number, g: number, b: number): number {
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);

  if (max === min) return 0;

  const d = max - min;
  let h = 0;

  if (max === rNorm) {
    h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
  } else if (max === gNorm) {
    h = ((bNorm - rNorm) / d + 2) / 6;
  } else {
    h = ((rNorm - gNorm) / d + 4) / 6;
  }

  return h * 360;
}

/** Calculate circular hue distance */
function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/** Check if a color entry is well-represented by existing buckets */
function isWellRepresented(
  entry: ColorEntry,
  bucketAverages: Array<{ rgb: RGB; hue: number; saturation: number }>
): boolean {
  const entryHue = rgbHue(entry.rgb.r, entry.rgb.g, entry.rgb.b);
  const entrySat = rgbSaturation(entry.rgb.r, entry.rgb.g, entry.rgb.b);

  for (const bucket of bucketAverages) {
    const hueDist = hueDistance(entryHue, bucket.hue);
    const satDiff = Math.abs(entrySat - bucket.saturation);

    // Well-represented = within 30 hue degrees and 20% saturation
    if (hueDist < 30 && satDiff < 20) {
      return true;
    }
  }

  return false;
}

/** Find saturated colors that weren't captured well by median cut */
function findSaturatedOutliers(
  colorMap: Map<number, ColorEntry>,
  existingBuckets: ColorBucket[]
): ColorBucket[] {
  const MIN_OUTLIER_SATURATION = 50;
  const MAX_OUTLIERS = 3;

  // Compute bucket averages for comparison
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

  // Find saturated entries not well-represented
  const outlierCandidates: Array<{ entry: ColorEntry; saturation: number }> = [];

  for (const entry of colorMap.values()) {
    const saturation = rgbSaturation(entry.rgb.r, entry.rgb.g, entry.rgb.b);

    if (saturation >= MIN_OUTLIER_SATURATION && !isWellRepresented(entry, bucketAverages)) {
      outlierCandidates.push({ entry, saturation });
    }
  }

  // Sort by saturation * count to prioritize both saturation and presence
  outlierCandidates.sort((a, b) => {
    const scoreA = a.saturation * Math.log(a.entry.count + 1);
    const scoreB = b.saturation * Math.log(b.entry.count + 1);
    return scoreB - scoreA;
  });

  // Create small buckets for top outliers, ensuring hue diversity
  const outlierBuckets: ColorBucket[] = [];
  const usedHues: number[] = [];

  for (const { entry } of outlierCandidates) {
    if (outlierBuckets.length >= MAX_OUTLIERS) break;

    const hue = rgbHue(entry.rgb.r, entry.rgb.g, entry.rgb.b);

    // Skip if too close in hue to an already-added outlier
    const tooClose = usedHues.some(h => hueDistance(h, hue) < 30);
    if (tooClose) continue;

    usedHues.push(hue);
    outlierBuckets.push({
      colors: [entry],
      totalCount: entry.count,
    });
  }

  return outlierBuckets;
}

/**
 * Extract dominant colors from an image using median cut algorithm.
 *
 * @param image - Loaded HTMLImageElement
 * @param options - Extraction options
 * @returns Array of extracted colors sorted by population (descending)
 */
export function extractColorsFromImage(
  image: HTMLImageElement,
  options: ExtractionOptions = {}
): ExtractedColor[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create canvas and scale image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  // Calculate scaled dimensions
  const scale = Math.min(1, opts.maxSize / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  canvas.width = width;
  canvas.height = height;

  // Draw scaled image
  ctx.drawImage(image, 0, 0, width, height);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const totalPixels = width * height;

  // Build color frequency map with quantization and location tracking
  const colorMap = new Map<number, ColorEntry>();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = quantize(pixels[i], opts.quantizationBits);
    const g = quantize(pixels[i + 1], opts.quantizationBits);
    const b = quantize(pixels[i + 2], opts.quantizationBits);
    const a = pixels[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    // Calculate pixel coordinates (normalized 0-1)
    const pixelIndex = i / 4;
    const x = (pixelIndex % width) / width;
    const y = Math.floor(pixelIndex / width) / height;

    const key = colorKey(r, g, b);
    const existing = colorMap.get(key);

    if (existing) {
      existing.count++;
      // Accumulate location for centroid calculation
      existing.locationSum.x += x;
      existing.locationSum.y += y;
    } else {
      colorMap.set(key, { rgb: { r, g, b }, count: 1, locationSum: { x, y } });
    }
  }

  // Convert to initial bucket
  const initialBucket: ColorBucket = {
    colors: Array.from(colorMap.values()),
    totalCount: totalPixels,
  };

  // Median cut: split until we have enough buckets
  const buckets: ColorBucket[] = [initialBucket];

  while (buckets.length < opts.colorCount) {
    // Find bucket with most colors to split
    let maxIndex = 0;
    let maxSize = 0;

    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].colors.length > maxSize) {
        maxSize = buckets[i].colors.length;
        maxIndex = i;
      }
    }

    // Can't split further if bucket has 1 color
    if (maxSize <= 1) break;

    const [left, right] = splitBucket(buckets[maxIndex]);
    buckets.splice(maxIndex, 1, left, right);
  }

  // Phase 2: Hunt for saturated outliers not captured by median cut
  const saturatedOutliers = findSaturatedOutliers(colorMap, buckets);
  buckets.push(...saturatedOutliers);

  // Convert buckets to extracted colors
  const colors: ExtractedColor[] = buckets
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

  return colors;
}
