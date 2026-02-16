import type { HSL } from './types';

/** Parse a hex color string (#rrggbb or #rrggbbaa) to RGB components (0-255) */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a?: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) : undefined;
  return { r, g, b, a };
}

/** Convert RGB (0-255) to hex string (#rrggbb) */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convert RGB (0-255) to HSL */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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

/** Convert HSL to RGB (0-255) */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
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
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  };
}

/** Convert hex to HSL */
export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

/** Convert HSL to hex */
export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/** Linearly interpolate between two hex colors at position t (0-1) */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToHsl(colorA);
  const b = hexToHsl(colorB);

  // Handle hue interpolation across the 0/360 boundary
  let hDiff = b.h - a.h;
  if (hDiff > 180) hDiff -= 360;
  if (hDiff < -180) hDiff += 360;

  const h = (a.h + hDiff * t + 360) % 360;
  const s = a.s + (b.s - a.s) * t;
  const l = a.l + (b.l - a.l) * t;

  return hslToHex(h, s, l);
}

/** Adjust lightness of a hex color by a delta (positive = lighter, negative = darker) */
export function adjustLightness(hex: string, delta: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + delta)));
}

/** Adjust saturation of a hex color by a delta */
export function adjustSaturation(hex: string, delta: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, Math.max(0, Math.min(100, hsl.s + delta)), hsl.l);
}

/** Set lightness of a hex color to an absolute value (0-100) */
export function setLightness(hex: string, lightness: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, lightness);
}

/** Append alpha channel to a 6-digit hex color. alpha is a 2-char hex string (e.g. "7f") */
export function withAlpha(hex: string, alpha: string): string {
  const clean = hex.replace('#', '').slice(0, 6);
  return `#${clean}${alpha}`;
}

/** Calculate relative luminance for WCAG contrast calculations */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Calculate WCAG contrast ratio between two hex colors (result >= 1) */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
