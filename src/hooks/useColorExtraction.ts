import { useState, useEffect, useCallback } from 'react';
import { extractColorsFromImage, selectThemePalette } from '../extraction';
import type { PaletteSelectionResult, PaletteSelectionOptions } from '../extraction';
import type { ThemeTone } from '../theme/types';

interface UseColorExtractionResult {
  /** Selected palette with semantic roles */
  palette: PaletteSelectionResult | null;
  /** Whether extraction is in progress */
  isExtracting: boolean;
  /** Error message if extraction failed */
  error: string | null;
  /** Manually trigger extraction for a new image path */
  extract: (imagePath: string, tonePreference?: ThemeTone) => void;
}

/**
 * React hook for extracting color palette from an image file.
 *
 * @param imagePath - Path to the image file (or null to skip)
 * @param tonePreference - Optional tone preference to guide color selection
 * @returns Extraction state and palette result
 */
export function useColorExtraction(
  imagePath: string | null,
  tonePreference?: ThemeTone
): UseColorExtractionResult {
  const [palette, setPalette] = useState<PaletteSelectionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (path: string, tone?: ThemeTone) => {
    setIsExtracting(true);
    setError(null);
    setPalette(null);

    try {
      // Read image as data URL via IPC to avoid file:// CORS issues
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const dataUrl = await window.electronAPI.readImageAsDataUrl(path);
      if (!dataUrl) {
        throw new Error('Failed to read image file');
      }

      const img = new Image();

      img.onload = () => {
        try {
          const colors = extractColorsFromImage(img);
          const options: PaletteSelectionOptions = tone ? { tonePreference: tone } : {};
          const result = selectThemePalette(colors, options);
          setPalette(result);
        } catch (err) {
          console.error('Color extraction failed:', err);
          setError(err instanceof Error ? err.message : 'Extraction failed');
        } finally {
          setIsExtracting(false);
        }
      };

      img.onerror = () => {
        setError('Failed to load image');
        setIsExtracting(false);
      };

      img.src = dataUrl;
    } catch (err) {
      console.error('Image loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setIsExtracting(false);
    }
  }, []);

  // Auto-extract when imagePath or tonePreference changes
  useEffect(() => {
    if (imagePath && tonePreference) {
      extract(imagePath, tonePreference);
    } else if (!imagePath) {
      setPalette(null);
      setError(null);
    }
    // Note: extraction only runs when BOTH imagePath and tonePreference are set
  }, [imagePath, tonePreference, extract]);

  return { palette, isExtracting, error, extract };
}
