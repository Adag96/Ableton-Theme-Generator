import type { ExtractedColor, ExtractionOptions, RGB } from './types';
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

/** Color bucket for median cut algorithm */
interface ColorBucket {
  colors: Array<{ rgb: RGB; count: number }>;
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

/** Get weighted average color from a bucket */
function averageBucketColor(bucket: ColorBucket): { rgb: RGB; count: number } {
  let r = 0, g = 0, b = 0;

  for (const { rgb, count } of bucket.colors) {
    r += rgb.r * count;
    g += rgb.g * count;
    b += rgb.b * count;
  }

  return {
    rgb: {
      r: Math.round(r / bucket.totalCount),
      g: Math.round(g / bucket.totalCount),
      b: Math.round(b / bucket.totalCount),
    },
    count: bucket.totalCount,
  };
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

  // Build color frequency map with quantization
  const colorMap = new Map<number, { rgb: RGB; count: number }>();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = quantize(pixels[i], opts.quantizationBits);
    const g = quantize(pixels[i + 1], opts.quantizationBits);
    const b = quantize(pixels[i + 2], opts.quantizationBits);
    const a = pixels[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    const key = colorKey(r, g, b);
    const existing = colorMap.get(key);

    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { rgb: { r, g, b }, count: 1 });
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

  // Convert buckets to extracted colors
  const colors: ExtractedColor[] = buckets
    .filter(b => b.colors.length > 0)
    .map(bucket => {
      const { rgb, count } = averageBucketColor(bucket);
      return {
        hex: rgbToHex(rgb.r, rgb.g, rgb.b),
        rgb,
        hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
        population: count,
        percentage: (count / totalPixels) * 100,
      };
    })
    .sort((a, b) => b.population - a.population);

  return colors;
}
