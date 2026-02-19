# Handoff: surface_secondary Experiment (Reverted)

**Date:** 2026-02-19
**Status:** Reverted - did not produce visible results
**Related ticket:** Extended Semantic Roles for richer theme generation

---

## Problem Statement

Generated themes feel "flat" compared to hand-designed themes like Snowboard Live 12. Analysis revealed that hand-designed themes use *multiple related but distinct hues* for surface colors, while our algorithm uses a single hue with lightness variations.

**Snowboard's approach:**
- Warm surfaces (H: 39-45°) for primary backgrounds
- Rose/mauve accent (H: 346°) for `SurfaceArea` - a complementary secondary surface
- Cool purple-gray (H: 279°) for depth elements like Desktop
- Result: cohesive but visually rich hierarchy

---

## What We Implemented

### 1. Extract `surface_secondary` from images
**File:** `src/extraction/palette-selection.ts`

Added extraction logic after accent selection:
- Filter for low saturation (≤40%), similar lightness (±20%), different hue (≥30° from surface_base)
- Prefer hue distances of 60-180° for complementary effect
- Fallback: algorithmically shift surface_base hue by ±30°

### 2. Use secondary hue in neutral scale
**File:** `src/theme/derivation.ts`

Modified `buildNeutralScale()` to use `surface_secondary` hue for `n4_area` (which maps to `SurfaceArea` parameter in Ableton).

### 3. Type definitions
**Files:** `src/extraction/types.ts`, `src/types/theme-library.ts`

Added optional `surface_secondary` field to `PaletteSelectionResult.roles` and `SavedTheme.colors`.

### 4. Storage passthrough
**Files:** `src/App.tsx`, `src/hooks/useThemeLibrary.ts`

Ensured `surface_secondary` was saved and restored when regenerating themes.

---

## Why It Failed

The implementation was technically correct - hex values WERE different between WITH and WITHOUT variants:
- `warm-base-cool-secondary` WITH: `#19151d` (H: 270°) vs WITHOUT: `#1f1a13` (H: 35°)
- `high-contrast-dark` WITH: `#15110f` (H: 20°) vs WITHOUT: `#0f1115` (H: 220°)

**But the colors were imperceptible** because:
- `n4_area` for dark themes has lightness ~8-10%
- At such low lightness, the human eye cannot distinguish hue differences
- Both variants appeared as near-black

---

## What Snowboard Actually Does (Needs Investigation)

The key insight we missed: Snowboard's "hue family" effect may not come from `SurfaceArea` being a different hue at the *same darkness*. Instead, it likely:

1. Uses brighter secondary surfaces where hue is visible
2. Applies the secondary hue to *different parameters* that have mid-range lightness
3. Has careful parameter-by-parameter tuning we haven't analyzed

---

## Recommended Next Steps

1. **Analyze Snowboard.ask in detail** - Extract exact hex values for ALL parameters, not just SurfaceArea. Map which parameters have the rose/mauve hue and at what lightness.

2. **Identify visible parameters** - Find Ableton theme parameters that:
   - Have mid-range lightness (40-70%) where hue is perceptible
   - Are visually prominent in the UI
   - Could benefit from secondary hue variation

3. **Consider alternative approaches:**
   - Apply hue variation to `n9_mid_low` or `n7_detail` instead of `n4_area`
   - Use `surface_secondary` for `Desktop` parameter instead
   - Boost saturation when applying to dark areas

---

## Files Changed (All Reverted)

| File | Change |
|------|--------|
| `src/extraction/palette-selection.ts` | Added then removed surface_secondary extraction |
| `src/extraction/types.ts` | Added then removed surface_secondary to types |
| `src/theme/derivation.ts` | Modified then reverted buildNeutralScale |
| `src/types/theme-library.ts` | Added then removed surface_secondary field |
| `src/hooks/useThemeLibrary.ts` | Added then removed passthrough |
| `src/App.tsx` | Added then removed surface_secondary storage |
| `scripts/compare-surface-secondary.ts` | Created then deleted |

---

## Lessons Learned

1. **Test visibility at target lightness** - Before implementing hue variation, verify the target element has enough lightness for hue to be perceptible.

2. **Study reference themes thoroughly** - Don't assume which parameters create an effect. Extract and analyze actual values.

3. **Output test themes to correct location** - Ableton themes go in:
   ```
   /Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Themes/
   ```

---

## Code Snapshot (For Reference)

The extraction algorithm that was implemented (in case it's useful later):

```typescript
// Filter candidates: low saturation, similar lightness, different hue
const surfaceSecondaryCandidates = colors.filter(c => {
  if (c.hex === surfaceBase.hex) return false;
  if (c.hsl.s > MAX_SURFACE_SATURATION) return false; // ≤40%
  if (Math.abs(c.hsl.l - surfaceBase.hsl.l) > 20) return false;
  if (hueDistance(c.hsl.h, surfaceBase.hsl.h) < 30) return false;
  return true;
});

// Sort by hue distance (prefer 60-180° for complementary effect)
const sorted = [...surfaceSecondaryCandidates].sort((a, b) => {
  const distA = hueDistance(a.hsl.h, surfaceBase.hsl.h);
  const distB = hueDistance(b.hsl.h, surfaceBase.hsl.h);
  const scoreA = distA >= 60 && distA <= 180 ? distA : distA * 0.5;
  const scoreB = distB >= 60 && distB <= 180 ? distB : distB * 0.5;
  return scoreB - scoreA;
});
```
