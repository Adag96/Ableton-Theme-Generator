# Image-to-Theme Generation Improvements

**Ticket:** ABL-96
**Date:** 2026-03-06
**Status:** Research Complete → Revised with Slider Plan

---

## Context

Testing revealed two recurring pain points with generated themes:
1. **Monotone feel** — themes derive most colors from a single main color, lacking diversity
2. **Single color dominance** — one color can dominate even when not prominent in the source image; sometimes `surface_base` is synthesized algorithmically rather than extracted

**Goal:** Research document outlining 2-3 approaches with tradeoffs, to decide later which to implement.

---

## Current Algorithm Analysis

### How It Works Today

```
Image → Median Cut (16 colors) + Outlier Detection (up to 3 vibrant colors)
     → Compute dominant hue (saturation × population weighted)
     → Synthesize surface_base at dominant hue + fixed lightness (22% dark / 80% light)
     → Select accent_primary (highest saturation, harmony bonus)
     → Select accent_secondary (60°+ hue distance from primary)
     → Derive 12 roles → 15-stop neutral scale → 236 theme parameters
```

### Root Causes of Pain Points

| Problem | Root Cause |
|---------|------------|
| Monotone feel | Surface is synthesized from dominant hue; neutral scale derives from surface; ~80% of 236 params come from neutral scale |
| Single color dominance | Dominant hue is a saturation-weighted mean, so one vivid region can pull the entire hue |
| Surface not from image | Surface lightness (22%/80%) is fixed by design; only hue is extracted |

### Key Files
- `src/extraction/color-extraction.ts` — Median cut + outlier detection
- `src/extraction/palette-selection.ts` — `selectThemePalette()`, dominant hue, surface synthesis
- `src/theme/derivation.ts` — Role derivation, neutral scale building

---

## Approach 1: Multi-Hue Zone Injection

**Idea:** Instead of a single dominant hue for the entire theme, inject secondary hues into specific UI zones (detail view, browser, selection highlights).

### How It Would Work

1. **Extract 2-3 dominant hue clusters** from the image (not just one weighted mean)
   - Use k-means clustering on hue values weighted by saturation
   - Or: Take hue of `accent_primary`, `accent_secondary`, and a third if available

2. **Assign hues to zones:**
   - `surface_base` — Primary hue (largest cluster)
   - `detail_bg` / `surface_highlight` — Secondary hue (if 60°+ apart)
   - `selection_bg` — Tertiary hue or complement

3. **Modify neutral scale to support multi-hue**
   - Currently: Single hue across all 15 stops
   - New: Zone-specific hue for certain stops (n7_detail, n8_highlight)

### Pros
- Directly addresses "monotone" complaint
- Visible color variety without breaking cohesion
- Can leverage existing accent colors already extracted

### Cons
- Risk of clashing colors if not carefully validated
- Increases complexity of the neutral scale
- May require harmony validation between zone hues

### Effort Estimate
Medium — Requires changes to `buildNeutralScale()` and `resolveRoles()`.

---

## Approach 2: Direct Pixel Sampling for Surface Color

**Idea:** Instead of synthesizing `surface_base` at a fixed lightness, extract an actual color from the image that's suitable for surfaces.

### How It Would Work

1. **Filter extracted colors for surface suitability:**
   - Lightness within target range: 15-30% (dark) or 70-85% (light)
   - Moderate saturation: 10-40% (to avoid overly vivid surfaces)
   - Sufficient population: ≥2% of pixels

2. **Score candidates:**
   - Closeness to ideal lightness (22%/80%)
   - Harmony with accent colors already selected
   - Population (more pixels = more representative)

3. **Fall back to synthesis** if no suitable candidate exists

### Pros
- Surface color comes directly from the image ("what you see is what you get")
- Preserves natural color relationships from the source
- Users feel more connection between image and theme

### Cons
- Many images may not have suitable surface-tone colors (especially bright/saturated photos)
- Could produce inconsistent lightness across different images
- May require more fallback logic

### Effort Estimate
Low-Medium — Changes primarily in `selectSurfaceColor()` in `palette-selection.ts`.

---

## Approach 3: Perceptual Color Diversity Scoring

**Idea:** Score candidate themes by perceptual diversity and reject/adjust monotone results.

### How It Would Work

1. **Define a diversity metric** based on resolved roles:
   - Count unique hue "zones" (group hues within 30°)
   - Measure saturation variance across roles
   - Penalize if >70% of surface roles share the same hue zone

2. **Generate multiple candidate palettes** (3-5) by varying:
   - Which extracted color becomes `accent_primary`
   - Whether surface uses hue from primary or secondary cluster
   - Transparent vs vibrant mode

3. **Rank by diversity + harmony** and select best
   - Diversity score + harmony score (split-complementary bonus)
   - Reject palettes where diversity < threshold

4. **Optional: Expose slider** to user ("Color Variety: Low ↔ High")

### Pros
- Doesn't change the core algorithm, adds a validation/selection layer
- Can be tuned with a single threshold parameter
- Easy to A/B test with users

### Cons
- Doesn't fix root cause; some images may never produce diverse palettes
- Adds computation (multiple palette candidates)
- May reject "good enough" palettes that users would have liked

### Effort Estimate
Medium — New scoring function + candidate generation loop.

---

## Comparison Matrix

| Criterion | Approach 1: Multi-Hue Zones | Approach 2: Direct Sampling | Approach 3: Diversity Scoring |
|-----------|----------------------------|----------------------------|------------------------------|
| Directly addresses monotone | **Yes** (inject variety) | Partially (depends on image) | Partially (reject bad ones) |
| Image-to-theme connection | Same | **Better** (actual pixels) | Same |
| Risk of clashing colors | Higher | Lower | Lower |
| Fallback handling | Moderate | Needed | Not needed |
| Implementation complexity | Medium-High | Low-Medium | Medium |
| User control opportunity | Zone toggles | N/A | Diversity slider |
| Works on any image | **Yes** | May fallback often | Depends |

---

## Revised Strategy: "Color Variety" Slider

### Key Insight

Monotone results aren't a bug — they're a valid aesthetic choice. Some users want subtle/cohesive themes, others want vibrant/diverse. Rather than replacing the current algorithm, we **extend it with a continuous slider** that lets users choose their position on the spectrum.

### Slider Behavior (Continuous Interpolation)

The slider maps to a `colorVariety` parameter (0.0 to 1.0). Each behavior is **parameterized as a gradient**, not a toggle:

| Slider Value | Surface Color | Hue Injection | Effect |
|--------------|---------------|---------------|--------|
| **0.0** | 100% synthesized (fixed L, dominant H) | None | Current monotone |
| **0.5** | 50/50 blend of synthesized + sampled pixel | Secondary hue at 50% influence in zones | Moderate variety |
| **1.0** | 100% sampled pixel (with fallback) | Full secondary/tertiary hue in zones | Maximum variety |

### Interpolation Mechanics

**1. Surface color blending** — Interpolate in OKLCH between synthesized and sampled:
```ts
const surface = lerpOklch(synthesized, sampled, colorVariety)
```

**2. Zone hue injection** — Scale influence of secondary hues into specific roles:
```ts
const zoneHueStrength = colorVariety * 0.8 // max 80% influence
const detailBg = injectHue(baseSurface, secondaryHue, zoneHueStrength)
```

**3. Neutral scale hue spread** — Spread stops toward secondary hue as variety increases:
```ts
const hueSpread = colorVariety * 30 // degrees toward secondary
// Stop n0 = base hue, stop n14 = base + hueSpread
```

At 0.0, all multipliers are zero → current behavior untouched. At 1.0, full effect. Everything in between is a smooth gradient.

### Strategic Advantages

- **No algorithm replacement** — extend rather than rewrite
- **User agency** — reduces "bad theme" complaints
- **Safe default** — slider starts at 0.0 (current behavior)
- **Data opportunity** — see where users actually land on the slider

---

## Implementation Plan

### Phase 1: Develop & Validate New Approaches (Isolated)

Before integrating into a slider, implement and test each approach independently to ensure quality.

#### Phase 1A: Direct Pixel Sampling (Approach 2)

**Goal:** Implement surface sampling as a standalone mode, test on diverse images.

**Tasks:**
1. Add `selectSampledSurface()` function in `palette-selection.ts`
   - Filter extracted colors by lightness (15-30% dark / 70-85% light)
   - Filter by saturation (10-40% to avoid overly vivid)
   - Score by: closeness to ideal L, harmony with accents, population
   - Return best candidate or `null` if none suitable

2. Add temporary toggle/flag to force sampled surface mode
   - e.g., `FORCE_SAMPLED_SURFACE=true` in dev

3. Test on 10-15 diverse images:
   - Landscapes, portraits, abstract art, UI screenshots, low-saturation photos
   - Document: which images found suitable surfaces, which fell back
   - Compare before/after aesthetically

4. Tune thresholds based on test results

**Deliverable:** Working sampled surface mode with documented test results.

#### Phase 1B: Multi-Hue Zone Injection (Approach 1)

**Goal:** Implement hue injection as a standalone mode, validate it doesn't produce clashing results.

**Tasks:**
1. Extract secondary/tertiary hue clusters
   - Option A: Use existing `accent_secondary` hue
   - Option B: K-means on hue values weighted by saturation (if needed)

2. Add `injectZoneHues()` function in `derivation.ts`
   - Apply secondary hue to `detail_bg`, `surface_highlight`
   - Apply tertiary hue to `selection_bg` (if available and 60°+ apart)

3. Add temporary toggle to force hue injection mode

4. Test on same 10-15 images:
   - Document: harmony assessment, any clashing results
   - Identify images where injection helps vs hurts

5. Add harmony validation if needed (reject if contrast too low)

**Deliverable:** Working hue injection mode with documented test results.

---

### Phase 2: Integrate into Continuous Slider

Once both approaches are validated independently, wire them into a single slider control.

#### Phase 2A: Parameterize Approaches

**Tasks:**
1. Modify `selectSurfaceColor()` to accept `colorVariety: number`
   - At 0.0: return synthesized (current)
   - At 1.0: return sampled (or fallback to synthesized)
   - Between: `lerpOklch(synthesized, sampled, colorVariety)`

2. Modify `buildNeutralScale()` to accept `colorVariety: number`
   - Spread hue across stops: `baseHue + (stopIndex / 14) * hueSpread`
   - `hueSpread = colorVariety * maxSpread` (tune maxSpread, likely 20-40°)

3. Modify `resolveRoles()` to inject zone hues scaled by `colorVariety`

#### Phase 2B: Add UI Control

**Tasks:**
1. Add "Color Variety" slider to theme creator panel
   - Range: 0-100 (maps to 0.0-1.0 internally)
   - Default: 0 (current behavior, safe default)
   - Label: "Color Variety" with endpoints "Subtle" ↔ "Vibrant"

2. Wire slider to `ThemeConfig.colorVariety`

3. Regenerate theme on slider change (debounced)

#### Phase 2C: Final Testing & Tuning

**Tasks:**
1. Test full slider range on 10-15 images
2. Tune interpolation curves if linear feels wrong (e.g., ease-in for surface blend)
3. Verify 0.0 produces identical output to current algorithm (regression test)
4. User testing: gather feedback on slider behavior

---

### Phase 3: Polish & Ship

1. Add tooltip explaining slider behavior
2. Consider persisting slider value per-theme or globally
3. Document in Feature Overview
4. Ship!

---

## File Change Summary

| File | Changes |
|------|---------|
| `src/extraction/palette-selection.ts` | Add `selectSampledSurface()`, modify `selectSurfaceColor()` to accept `colorVariety` |
| `src/theme/derivation.ts` | Modify `buildNeutralScale()` for hue spread, add `injectZoneHues()` |
| `src/types/theme.ts` | Add `colorVariety: number` to `ThemeConfig` |
| `src/components/ThemeCreator.tsx` | Add slider UI |
| (new) `src/utils/color-lerp.ts` | Add `lerpOklch()` helper if not already present |

---

## Open Questions

1. **Slider default position** — 0 (current behavior) seems safest, but 0.3-0.5 might produce better first impressions. Test and decide.
2. **Fallback behavior** — When sampled surface fails at high variety, should we blend with synthesized or hard-fall to synthesized? Blending seems smoother.
3. **Hue spread direction** — Spread toward secondary hue, or toward complementary? Secondary seems more natural.
