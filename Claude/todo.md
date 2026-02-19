# ABL-25: Theme Design Quality Improvement Spike

## Progress Tracker

### Phase 1: Test Infrastructure
- [x] Create comparison test script (`scripts/compare-theme-quality.ts`)
- [x] Create before/after generation scripts

### Phase 2: Implement Fixes
- [x] Surface saturation filtering (palette-selection.ts)
- [x] Minimum lightness spread enforcement (derivation.ts)
- [x] Color harmony scoring (palette-selection.ts)
- [x] Optional: surface_secondary and accent_tertiary roles (types.ts)

### Phase 3: Generate Comparison Themes
- [x] Generated BEFORE themes (old algorithm)
- [x] Generated AFTER themes (new algorithm)

### Phase 4: Visual Comparison & Documentation
- [ ] Load themes in Ableton Live 12
- [ ] Document findings

---

## A/B Comparison Results

### Highlight Spread (surface_highlight - surface_base)

| Theme | BEFORE | AFTER | Improvement |
|-------|--------|-------|-------------|
| high-saturation-red | 8.4% | **12.0%** | +3.6% |
| very-dark-base | 8.2% | **12.2%** | +4.0% |
| multi-color-harmony | 8.4% | **12.0%** | +3.6% |
| pastel-muted | 8.4% | **12.0%** | +3.6% |
| light-high-saturation | 6.1% | 1.0% | (edge case*) |
| extended-palette | 8.4% | **12.0%** | +3.6% |

*Light theme at L=94% has no room to go lighter; may need separate handling.

### Control BG Lightness (visibility floor)

| Theme | BEFORE | AFTER | Notes |
|-------|--------|-------|-------|
| very-dark-base | **0.0%** | **5.1%** | Critical fix! Was invisible |
| Other themes | No change | No change | Already above 5% minimum |

### Key Observations

1. **Critical Fix: very-dark-base**
   - BEFORE: Control BG at L=0% (pure black, invisible against near-black surfaces)
   - AFTER: Control BG at L=5.1% (visible separation)

2. **Consistent 12% Spread**
   - All dark themes now have minimum 12% lightness spread
   - Should make track lanes and UI elements more distinguishable

3. **Light Theme Edge Case**
   - Very bright light themes (L > 90%) can't achieve 12% upward spread
   - May need to cap base lightness or use different strategy for highlights

---

## Generated Theme Files

Location: `test-themes/quality-comparison/`

```
extended-palette-AFTER.ask       extended-palette-BEFORE.ask
high-saturation-red-AFTER.ask    high-saturation-red-BEFORE.ask
light-high-saturation-AFTER.ask  light-high-saturation-BEFORE.ask
multi-color-harmony-AFTER.ask    multi-color-harmony-BEFORE.ask
pastel-muted-AFTER.ask           pastel-muted-BEFORE.ask
very-dark-base-AFTER.ask         very-dark-base-BEFORE.ask
```

**Testing Instructions:**
1. Copy `.ask` files to Ableton Live 12's theme directory
2. Load each BEFORE/AFTER pair and compare:
   - Track lane visibility (especially in very-dark-base)
   - Selected vs unselected element contrast
   - Overall surface differentiation

---

## Files Modified

| File | Changes |
|------|---------|
| `src/extraction/palette-selection.ts` | Surface saturation filter, harmony scoring |
| `src/theme/derivation.ts` | Minimum lightness spread, optional extended roles |
| `src/theme/types.ts` | Added `surface_secondary` and `accent_tertiary` optional roles |
| `src/theme/contrast.ts` | Fixed type compatibility with optional roles |
| `scripts/compare-theme-quality.ts` | Comparison test script |
| `scripts/generate-before-themes.ts` | Generates BEFORE themes |
| `scripts/generate-after-themes.ts` | Generates AFTER themes |
