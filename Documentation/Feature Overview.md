# Feature Overview

This document describes how each feature in the theme generator works from a technical perspective. It serves as a reference for understanding the behavior and decision logic behind the application.

---

## Table of Contents

1. [Image Import](#image-import)
2. [Tone Selection](#tone-selection)
3. [Color Extraction](#color-extraction)
4. [Theme Generation](#theme-generation)
5. [Theme Library](#theme-library)

---

## Image Import

**Location:** `src/components/ImageImportView.tsx`

Users can import an image via drag-and-drop or file browser dialog. Supported formats: PNG, JPG, JPEG.

### Flow

1. User drops or selects an image file
2. Image is loaded as a data URL for preview display
3. User selects a tone preference (Dark/Light)
4. Color extraction runs with the selected tone
5. User reviews extracted palette and generates theme

---

## Tone Selection

**Location:** `src/components/ImageImportView.tsx`, `src/extraction/palette-selection.ts`

The tone selection determines whether the generated theme will be a dark or light theme. This choice fundamentally affects which colors are prioritized from the image.

### User Flow

After importing an image, the user must select either **Dark** or **Light** before color extraction begins. This is a required step — extraction does not run until a tone is selected.

### How Tone Affects Color Extraction

The tone preference is passed to the palette selection algorithm, which uses it to select the `surface_base` color:

| Tone | Surface Base Selection |
|------|----------------------|
| **Dark** | Prioritize colors with HSL lightness < 50% |
| **Light** | Prioritize colors with HSL lightness ≥ 50% |

#### Algorithm Details

1. **Filter by lightness:** Colors are filtered to those matching the tone preference
2. **Select most prominent:** From matching colors, pick the one with highest population (pixel count)
3. **Fallback if no match:** If no colors match the preference (e.g., selecting "Light" on a very dark image), the algorithm creates an adjusted color:
   - Takes the least saturated color from the image
   - Adjusts its lightness to a target value (20% for dark, 75% for light)
   - Caps saturation at 15% to create a neutral-ish surface

### Why This Matters

Previously, tone was auto-detected based on the dominant color's lightness. This caused most images to produce dark themes, since dominant colors in photos are often darker (shadows, backgrounds). By letting users choose first, the algorithm can actively seek out colors that support their desired theme style.

---

## Color Extraction

**Location:** `src/extraction/color-extraction.ts`, `src/extraction/palette-selection.ts`

Color extraction analyzes the imported image to identify key colors for theme generation.

### Extraction Pipeline

```
Image → Canvas Downscale → Pixel Sampling → Quantization → Clustering → Palette Selection
```

### Step 1: Canvas Downscaling

The image is drawn onto a canvas, scaled down to a maximum dimension of 400px. This improves performance without significantly affecting color accuracy.

### Step 2: Pixel Sampling & Quantization

Pixels are sampled from the canvas and quantized (color buckets) to reduce the color space. Default: 5 bits per channel, yielding 32 levels per channel.

### Step 3: Clustering

Similar colors are grouped together. The result is a list of representative colors sorted by population (how many pixels mapped to each color).

### Step 4: Palette Selection

From the extracted colors, semantic roles are assigned:

| Role | Selection Logic |
|------|-----------------|
| `surface_base` | Most prominent color matching tone preference |
| `text_primary` | Color with best contrast ratio against surface_base (min 4.5:1) |
| `accent_primary` | Most saturated color (warm hues get +10 bonus), min 35% saturation |
| `accent_secondary` | Next saturated color with ≥60° hue distance from primary (cool hues preferred) |

### Fallback Behaviors

- **text_primary:** If no extracted color meets contrast requirements, falls back to white (#ffffff) for dark themes or near-black (#121212) for light themes
- **accent_secondary:** If no color has sufficient hue distance, a synthetic complementary color is generated from accent_primary

### Output

The extraction produces a `PaletteSelectionResult` containing:
- The 5 semantic color roles (tone, surface_base, text_primary, accent_primary, accent_secondary)
- Location markers showing where each color was sampled on the image
- Debug info (contrast ratios, saturation values, hue distances)

---

## Theme Generation

**Location:** `src/theme/derivation.ts`, `src/theme/ask-generator.ts`

Once the palette is selected, the theme generation engine converts 5 input colors into a complete Ableton Live 12 theme file.

### Pipeline

```
5 Input Colors → 12 Resolved Roles → 15-stop Neutral Scale → 236 Parameters → .ask XML
```

For complete details on this pipeline, see [Semantic Color Roles Specification.md](./Semantic%20Color%20Roles%20Specification.md).

### Summary

1. **Role Resolution:** The 5 required colors are expanded to 12 semantic roles (surface_highlight, control_bg, etc. are derived)
2. **Neutral Scale:** A 15-stop lightness ramp is built, preserving the hue/saturation of surface colors
3. **Parameter Generation:** Each of the 236 theme parameters is resolved from roles, scale values, or fixed semantic colors
4. **XML Generation:** The parameters are formatted into Ableton's .ask XML format

---

## Theme Library

**Location:** `src/hooks/useThemeLibrary.ts`, `src/components/MyThemesView.tsx`

Generated themes are saved to a local library for easy access.

### Storage

Themes are saved as .ask files to the user's Ableton themes directory. The library metadata (name, creation date, preview image, colors) is stored separately in the application's user data directory.

### Features

- View all saved themes with visual previews
- Delete themes from the library
- Themes are saved with user-provided names

---

## File Reference

| Feature | Key Files |
|---------|-----------|
| Image Import | `src/components/ImageImportView.tsx`, `src/components/ImageImportView.css` |
| Color Extraction | `src/extraction/color-extraction.ts`, `src/extraction/palette-selection.ts` |
| Theme Generation | `src/theme/derivation.ts`, `src/theme/ask-generator.ts` |
| Theme Library | `src/hooks/useThemeLibrary.ts`, `src/components/MyThemesView.tsx` |
