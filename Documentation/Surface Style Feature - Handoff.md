# Surface Style Feature - Handoff Document

**Date**: 2026-02-19
**Status**: Implemented, needs user testing
**Related Tickets**: ABL-19 (BLOCKER), ABL-2

---

## Problem Statement

Users reported that generated themes don't visually resemble their reference images:
- Surface/background colors were often irrelevant to the image
- The theme didn't "feel" like the input image
- Original algorithm prioritized pixel count over perceptual importance

**Root cause identified**: The color extraction was only affecting accent colors, while **surfaces are 99% of visual perception** in Ableton. Changing accents alone doesn't meaningfully change how a theme "feels."

---

## Solution Implemented

### Concept: Surface Style Variants

Instead of warm/cool/neutral accent temperature (which had minimal impact), we now have three fundamentally different **surface selection strategies**:

| Mode | Philosophy | Selection Logic |
|------|------------|-----------------|
| **Faithful** | Replicate the image's feel | Use the most prominent color matching the tone |
| **Vibrant** | Bold interpretation | Use the most saturated color matching the tone |
| **Muted** | Safe, professional | Filter for low-saturation colors only |

### Why This Matters

The surface color is derived into the entire neutral scale (13 stops) which controls:
- All panel backgrounds
- Detail view backgrounds
- Control backgrounds
- Borders and separators
- Scrollbars and disabled states

Changing the surface fundamentally changes the entire theme appearance.

---

## Technical Implementation

### Files Modified

| File | Changes |
|------|---------|
| `src/theme/types.ts` | `VariantMode = 'faithful' \| 'vibrant' \| 'muted'` |
| `src/extraction/palette-selection.ts` | New `selectSurfaceColor()` function with mode-specific logic |
| `src/extraction/color-extraction.ts` | Increased `colorCount` from 10 to 16 |
| `src/hooks/useColorExtraction.ts` | Passes `variantMode` to palette selection |
| `src/components/ImageImportView.tsx` | UI with "Surface Style" toggle (Faithful/Vibrant/Muted) |
| `src/components/ImageImportView.css` | Styles for variant tabs |

### Key Algorithm: `selectSurfaceColor()`

Located in `src/extraction/palette-selection.ts` (lines 62-139):

```typescript
function selectSurfaceColor(
  colors: ExtractedColor[],
  tonePreference: ThemeTone,
  variantMode: VariantMode
): ExtractedColor
```

**Faithful mode** (default):
- Takes the most prominent color that matches the tone (dark < 50% lightness, light >= 50%)
- Only caps saturation if > 60% (preserves character)
- Returns the actual extracted color when possible

**Vibrant mode**:
- Sorts matching colors by saturation (highest first)
- Picks the most saturated color with sat >= 30%
- Caps at 75% saturation max

**Muted mode** (original behavior):
- Filters for colors with saturation <= 40%
- If none found, desaturates the most prominent to 30%
- Most conservative, "safe" results

### Saturation Constants

```typescript
MUTED_MAX_SATURATION = 40      // Max sat for muted mode candidates
MUTED_DESATURATED_TARGET = 30  // Target when desaturating for muted
FAITHFUL_MAX_SATURATION = 60   // Cap for faithful mode
VIBRANT_MAX_SATURATION = 75    // Cap for vibrant mode
VIBRANT_MIN_SATURATION = 30    // Min sat to consider for vibrant
```

---

## What Was Removed

The original warm/cool/neutral approach was completely replaced:
- Removed `isWarmHue()` and `isCoolHue()` helper functions
- Removed `getVariantBonus()` function
- Removed `VARIANT_MATCH_BONUS` and `VARIANT_OPPOSITE_PENALTY` constants
- Accent selection no longer has temperature preference (uses pure saturation + harmony)

---

## UI Location

The "Surface Style" toggle appears in `ImageImportView.tsx` after the Contrast toggle:

```
Theme Style:     [Dark] [Light]
Contrast:        [Low] [Medium] [High] [Max]
Surface Style:   [Faithful] [Vibrant] [Muted]    <-- NEW
```

Default is **Faithful** (replicate image feel).

---

## Testing Checklist

### Manual Testing Needed

1. **Faithful mode**
   - [ ] Image with prominent dark blue background → dark theme should have blue-tinted surfaces
   - [ ] Image with prominent warm brown → theme should feel warm/earthy
   - [ ] Verify surfaces match the "dominant feel" of the image

2. **Vibrant mode**
   - [ ] Image with both muted and saturated colors → should pick saturated
   - [ ] Verify surfaces are noticeably more colorful than Faithful
   - [ ] Check that extremely saturated results (>75%) are properly capped

3. **Muted mode**
   - [ ] Should produce similar results to the old algorithm
   - [ ] Verify surfaces are always desaturated/professional looking
   - [ ] Good fallback for images that produce "too wild" results in other modes

4. **Edge cases**
   - [ ] Image with only light colors + Dark theme selected
   - [ ] Image with only dark colors + Light theme selected
   - [ ] Very desaturated image (grayscale-ish)
   - [ ] Extremely saturated image (neon colors)

### Comparison Testing

For each test image, generate all 6 combinations:
- Dark + Faithful, Dark + Vibrant, Dark + Muted
- Light + Faithful, Light + Vibrant, Light + Muted

Verify each mode produces **visibly different** surfaces.

---

## Known Limitations / Future Considerations

1. **Accent colors unchanged by mode**: Currently only surface selection uses the variant mode. Accents are always selected by saturation + harmony. Could extend if needed.

2. **No "auto" mode**: User must choose. Could potentially detect image characteristics and suggest a mode.

3. **Lightness not adjusted**: Faithful/Vibrant preserve the extracted color's lightness. For dark themes with no dark colors, we synthesize one at L=18. This might need tuning.

4. **Color extraction count**: Increased from 10 to 16 colors. This gives more options but could be tuned further.

---

## Rollback Instructions

If this approach doesn't work out, the previous warm/cool/neutral implementation is in git history. Key commits to reference:
- The commit before this feature will have the original muted-only surface selection
- The warm/cool/neutral attempt is also in history if needed for reference

To rollback:
1. Revert `VariantMode` type to `'warm' | 'cool' | 'neutral'`
2. Restore the old surface selection logic (single strategy, always desaturates)
3. Restore `isWarmHue`, `isCoolHue`, `getVariantBonus` if keeping accent temperature
4. Update UI labels back

---

## Questions for Future Work

1. Should Faithful mode have even less saturation capping (allow up to 70-80%)?
2. Should Vibrant mode also affect accent selection (prefer more saturated accents)?
3. Is the 50% lightness threshold for dark/light correct, or should it be adjusted?
4. Should there be a preview of just the surface color before full theme generation?

---

## Contact

This feature addresses the core complaint in ABL-19. The hypothesis is that by controlling **surface color selection** (not just accents), we can create meaningfully different theme interpretations from the same image.

Testing feedback should inform whether the saturation thresholds need adjustment or if the fundamental approach needs rethinking.
