# ABL-111: Enhanced Hue Injection with Additional Extracted Colors

## Implementation Checklist

- [x] **Step 1:** Update types (`types.ts`) to include `accent_quaternary`
- [x] **Step 2:** Extend palette selection to extract 3rd/4th accents
- [x] **Step 3:** Pass extended palette through to derivation
- [x] **Step 4:** Update hue injection to use all 4 accents with zone mapping
- [x] **Step 5:** Implement strength-based accent gating
- [x] **Step 6:** Show extra accent swatches in UI when hue injection is enabled
- [ ] **Step 7:** Test with various images (2-color, 3-color, 4+ color)

---

## Summary of Changes

### Files Modified

| File | Change |
|------|--------|
| `src/theme/types.ts` | Added `accent_quaternary` to SemanticColorRoles and ResolvedColorRoles |
| `src/extraction/types.ts` | Extended RoleLocations to include tertiary/quaternary, added `extractedAccentCount` to debug info, extended roles type |
| `src/extraction/palette-selection.ts` | Added extraction logic for 3rd/4th accents with ≥60° hue distance, fallback chain, debug tracking |
| `src/theme/derivation.ts` | Reorganized hue injection zones: primary (waveforms), secondary (loops), tertiary (automation), quaternary (spectrum). Added strength-based gating |
| `src/types/theme-library.ts` | Added `accent_tertiary` and `accent_quaternary` to SavedTheme colors |
| `src/components/ThemeCard.tsx` | Show tertiary/quaternary swatches when hue injection is enabled |
| `src/components/ThemeDetailModal.tsx` | Show tertiary/quaternary swatches and color markers when hue injection is enabled |
| `src/App.tsx` | Save tertiary/quaternary colors when creating/updating themes |

### Hue Injection Zone Mapping

| Accent | Parameters | Strength Threshold |
|--------|-----------|-------------------|
| `accent_primary` | WaveformColor, DimmedWaveformColor, BrowserSampleWaveform | 0.00+ (always) |
| `accent_secondary` | LoopColor, OffGridLoopColor | 0.25+ |
| `accent_tertiary` | AutomationColor, AutomationMouseOver | 0.50+ |
| `accent_quaternary` | SpectrumDefaultColor | 0.75+ |

### Fallback Chain

- Tertiary falls back to secondary if not extracted
- Quaternary falls back to tertiary (which may itself be secondary)
- This ensures all zones get colored with graceful degradation

### UI Behavior

- Theme cards and detail modal show up to 6 swatches (4 base + 2 extra when hue injection enabled)
- Extra swatches only appear when:
  1. Hue injection is enabled on the theme
  2. The tertiary/quaternary color exists (was extracted from image)
- Color markers on preview image also show the extra accent locations when available
