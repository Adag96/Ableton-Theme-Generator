import { rgbToHsl, hslToRgb } from '../theme/color-utils';

interface MoodSliders {
  warmth: number;
  saturation: number;
  brightness: number;
}

const MAX_WIDTH = 1200;

/** Check if any mood slider is non-zero */
export function hasMoodAdjustments(mood: MoodSliders): boolean {
  return mood.warmth !== 0 || mood.saturation !== 0 || mood.brightness !== 0;
}

/**
 * Apply mood adjustments to an image data URL via canvas pixel manipulation.
 * Uses the same math as applyMoodToColor: ±20° hue, ±50% saturation scale, ±15 lightness shift.
 */
export function applyMoodToImageDataUrl(
  dataUrl: string,
  mood: MoodSliders
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Downscale large images for performance (saved previews are thumbnails)
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas 2d context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Pre-compute mood parameters
      const hueShift = (mood.warmth / 100) * 20;
      const satScale = 1 + (mood.saturation / 100) * 0.5;
      const lightnessShift = (mood.brightness / 100) * 15;

      // Per-pixel: RGB → HSL → apply mood → HSL → RGB
      for (let i = 0; i < data.length; i += 4) {
        const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);

        const h = (hsl.h + hueShift + 360) % 360;
        const s = Math.max(0, Math.min(100, hsl.s * satScale));
        const l = Math.max(0, Math.min(100, hsl.l + lightnessShift));

        const rgb = hslToRgb(h, s, l);
        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
        // Alpha (data[i + 3]) unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for mood processing'));
    img.src = dataUrl;
  });
}
