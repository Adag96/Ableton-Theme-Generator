import { rgbToHex } from '../theme/color-utils';

export interface ColorSampler {
  /** Sample color at normalized coordinates (0-1) with optional averaging radius */
  sampleAt(normX: number, normY: number, radius?: number): string;
  /** Clean up resources */
  dispose(): void;
}

/**
 * Create a color sampler from an image data URL.
 * Loads the image into an off-screen canvas for efficient pixel sampling.
 */
export function createColorSampler(imageDataUrl: string): Promise<ColorSampler> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const sampler: ColorSampler = {
        sampleAt(normX: number, normY: number, radius = 1): string {
          // Convert normalized coords to pixel coords
          const x = Math.round(normX * (canvas.width - 1));
          const y = Math.round(normY * (canvas.height - 1));

          // For radius=1, sample single pixel; otherwise average a square
          const halfRadius = Math.floor(radius / 2);
          const startX = Math.max(0, x - halfRadius);
          const startY = Math.max(0, y - halfRadius);
          const endX = Math.min(canvas.width - 1, x + halfRadius);
          const endY = Math.min(canvas.height - 1, y + halfRadius);

          let totalR = 0, totalG = 0, totalB = 0;
          let count = 0;

          for (let py = startY; py <= endY; py++) {
            for (let px = startX; px <= endX; px++) {
              const imageData = ctx.getImageData(px, py, 1, 1);
              totalR += imageData.data[0];
              totalG += imageData.data[1];
              totalB += imageData.data[2];
              count++;
            }
          }

          const avgR = Math.round(totalR / count);
          const avgG = Math.round(totalG / count);
          const avgB = Math.round(totalB / count);

          return rgbToHex(avgR, avgG, avgB);
        },

        dispose() {
          // Help garbage collection
          canvas.width = 0;
          canvas.height = 0;
        },
      };

      resolve(sampler);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for color sampling'));
    };

    img.src = imageDataUrl;
  });
}
