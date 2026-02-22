import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AccentColors {
  primary: string;     // Main accent color (e.g., extracted dominant color)
  secondary: string;   // Secondary accent (complementary color)
  glow: string;        // Glow color with alpha
  glowSecondary: string;
}

interface AccentContextValue {
  colors: AccentColors;
  setAccentFromPalette: (colors: { primary: string; secondary?: string }) => void;
  resetToDefaults: () => void;
}

const DEFAULT_COLORS: AccentColors = {
  primary: '#00d4aa',
  secondary: '#ff7864',
  glow: 'rgba(0, 212, 170, 0.6)',
  glowSecondary: 'rgba(255, 120, 100, 0.5)',
};

const AccentContext = createContext<AccentContextValue | null>(null);

/**
 * Convert hex color to rgba with specified alpha
 */
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 212, 170, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a hex color for hover states
 */
function lightenHex(hex: string, percent: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r = Math.min(255, Math.floor(r + (255 - r) * percent));
  g = Math.min(255, Math.floor(g + (255 - g) * percent));
  b = Math.min(255, Math.floor(b + (255 - b) * percent));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Update CSS custom properties on document root
 */
function updateCSSVariables(colors: AccentColors) {
  const root = document.documentElement;

  root.style.setProperty('--accent-solid', colors.primary);
  root.style.setProperty('--accent-solid-hover', lightenHex(colors.primary, 0.15));
  root.style.setProperty('--accent-solid-secondary', colors.secondary);
  root.style.setProperty('--accent-glow', colors.glow);
  root.style.setProperty('--accent-glow-secondary', colors.glowSecondary);

  // Update inner glow variables
  root.style.setProperty('--glow-accent', `0 0 20px ${colors.glow}`);
  root.style.setProperty('--glow-accent-strong', `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`);
  root.style.setProperty('--glow-inner', `inset 0 0 30px ${colors.glow}`);
  root.style.setProperty('--glow-inner-subtle', `inset 0 0 20px ${hexToRgba(colors.primary, 0.15)}`);
}

export const AccentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState<AccentColors>(DEFAULT_COLORS);

  // Apply CSS variables whenever colors change
  useEffect(() => {
    updateCSSVariables(colors);
  }, [colors]);

  const setAccentFromPalette = useCallback((palette: { primary: string; secondary?: string }) => {
    const primary = palette.primary;
    const secondary = palette.secondary || DEFAULT_COLORS.secondary;

    setColors({
      primary,
      secondary,
      glow: hexToRgba(primary, 0.6),
      glowSecondary: hexToRgba(secondary, 0.5),
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setColors(DEFAULT_COLORS);
  }, []);

  return (
    <AccentContext.Provider value={{ colors, setAccentFromPalette, resetToDefaults }}>
      {children}
    </AccentContext.Provider>
  );
};

export function useAccentColors(): AccentContextValue {
  const context = useContext(AccentContext);
  if (!context) {
    throw new Error('useAccentColors must be used within an AccentProvider');
  }
  return context;
}

/**
 * Hook to temporarily preview accent colors (e.g., on hover)
 * Returns to previous colors when preview ends
 */
export function useAccentPreview() {
  const { colors, setAccentFromPalette } = useAccentColors();
  const [savedColors, setSavedColors] = useState<AccentColors | null>(null);

  const startPreview = useCallback((previewColors: { primary: string; secondary?: string }) => {
    if (!savedColors) {
      setSavedColors(colors);
    }
    setAccentFromPalette(previewColors);
  }, [colors, savedColors, setAccentFromPalette]);

  const endPreview = useCallback(() => {
    if (savedColors) {
      setAccentFromPalette({ primary: savedColors.primary, secondary: savedColors.secondary });
      setSavedColors(null);
    }
  }, [savedColors, setAccentFromPalette]);

  return { startPreview, endPreview };
}
