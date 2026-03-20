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

---

**✅ PHASE 1A COMPLETE (2026-03-07)**

**Implementation Summary:**
- Added `selectSampledSurface()` function in `palette-selection.ts`
- Modified `selectSurfaceColor()` to try sampled mode first, fall back to synthesis
- Added debug info to `PaletteSelectionResult` for tracking sampling success
- Replaced "Transparent" mode with "Sampled" as default (UI now shows: Sampled | Vibrant)

**Threshold Tuning Results:**
- Initial saturation range (10-40%) had 60% failure rate on MidJourney images
- Widened to 5-60%: improved to 40% failure rate
- Final range (5-70%): achieved ~80% success rate on diverse images
- Lightness and population thresholds unchanged (15-30% dark, 70-85% light, ≥2% population)

**Key Finding:** MidJourney/AI-generated images tend to be highly saturated. The original 40% saturation cap was too restrictive. 70% allows more vibrant surfaces, but users can adjust with mood sliders if needed.

**Files Modified:**
- `src/theme/types.ts` - Updated `VariantMode` to `'sampled' | 'vibrant'`
- `src/extraction/types.ts` - Added surface sampling debug fields
- `src/extraction/palette-selection.ts` - Added `selectSampledSurface()`, updated constants
- `src/components/ImageImportView.tsx` - Updated UI to show Sampled/Vibrant toggle

---

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

**🔄 PHASE 1B IN PROGRESS (2026-03-09)**

**Implementation Summary:**
- Added `HueInjectionConfig` type to `types.ts` with `enabled` and `strength` fields
- Added `applyAccentHueToSurface()` function in `derivation.ts` — uses accent's exact hue (no interpolation) at surface-appropriate lightness/saturation
- Modified `resolveRoles()` to apply hue injection when enabled
- Added UI toggle in ImageImportView with strength slider (0-100%)

**Key Learning:** Initial approach interpolated hues between surface and accent, which created "mystery colors" not present in the image (e.g., green appearing when blending cream→blue). Fixed by using accent's exact hue and only varying saturation with strength.

**Resolved Roles Tested:**

| Zone | Status | Notes |
|------|--------|-------|
| `detail_bg` | ✅ Included | Full strength. Detail view background. Results consistently good. |
| `surface_highlight` | ✅ Included | 60% strength. Hover/selection states. Subtle but positive. |
| `control_bg` | ✅ Included | 80% strength. Knob/meter backgrounds. Adds depth. |
| `surface_border` | ⏸️ Shelved | 50% strength tested. Results inconsistent — sometimes good, sometimes feels disconnected. Revisit later. |

**Current resolved role injection targets (in code):**
- `detail_bg`: accent_secondary hue at `strength`
- `surface_highlight`: accent_secondary hue at `strength * 0.6`
- `control_bg`: accent_secondary hue at `strength * 0.8`

---

**Neutral Scale / Parameter Overrides Tested (2026-03-09):**

Explored injecting hue into the neutral scale stops that affect retro displays (EQ, Spectrum, etc.).

| Target | Status | Notes |
|--------|--------|-------|
| Deep stops (n0-n2) | ⏸️ Shelved | Affects `RetroDisplayBackground`. Made the whole display look like a colored overlay — not intentional or well-designed. |
| Mid stops (n9, n11) | ⏸️ Shelved | Affects `SpectrumDefaultColor`, `BrowserSampleWaveform`. Changed baseline appearance even when injection disabled due to parameter map changes. |
| `SpectrumDefaultColor` (direct override) | ✅ Included (dark only) | Direct parameter override when injection enabled. Uses `accent_primary` hue at L=45%, S=20-45%, alpha=62%. See note below about light vs dark themes. |

**Key Learnings from Neutral Scale Testing:**
1. Changing the neutral scale affects too many parameters at once — hard to control
2. Better approach: directly override specific parameters in `generateTheme()` when injection is enabled
3. Must preserve baseline behavior when injection is OFF — users expect 0% to look identical to before
4. Spectrum waveform should match EQ nodes (`accent_primary`), not EQ curve lines (`accent_secondary`)

**Light vs Dark Theme Differences (2026-03-12):**

The `SpectrumDefaultColor` injection produces very different results on light vs dark themes:
- **Dark themes:** Noticeable, subjective variety. The colored spectrum fill stands out against the dark background.
- **Light themes:** Extremely subtle, almost imperceptible. Tested L values down to 28%, saturation up to 65%, and alpha up to 75% — still barely visible against light backgrounds.

This is likely due to how Ableton renders the spectrum analyzer overlay on light backgrounds. The baseline light theme value (`surface_highlight` at 33% alpha) is already very washed out, and our injection can't overcome the inherent low contrast.

**Decision:** Keep `SpectrumDefaultColor` in the hue injection algorithm. Accept that the effect is primarily visible on dark themes. No special light theme handling — use same values for both (the effect just won't be noticeable on light themes).

**Next to test:**
- Consider other direct parameter overrides that could benefit from hue injection

---

**New Hue Injection Candidates (2026-03-13):**

From manual parameter mapping session, identified high-impact parameters that are currently neutral/fixed in Ableton's themes but could benefit from hue injection:

| Parameter | Current Derivation | Injection Proposal | Impact |
|-----------|-------------------|-------------------|--------|
| `WaveformColor` | `n2_dark` (neutral) | Inject `accent_primary` hue at low saturation | Waveforms in clips take on theme color — **very visible** |
| `DimmedWaveformColor` | `n9b_mid` (neutral) | Same hue as WaveformColor, lighter | Deactivated clips stay cohesive |
| `LoopColor` | `n11b_ruler` (neutral gray) | Inject `accent_primary` or `accent_secondary` hue | Loop markers, locators become themed — **highly visible** |
| `BrowserSampleWaveform` | `n11_mid_high` (neutral) | Inject accent hue | Browser feels more cohesive |
| `AutomationColor` | Fixed red `#ff4d47` | Derive from `accent_secondary` | Automation lanes match theme — **dramatic change** |
| `VelocitySelectedOrHovered` | Fixed blue `#5b8cff` | Derive from `selection_bg` or `accent_primary` | MIDI editing feels themed |

**Design Decision (2026-03-13):**
- Base algorithm stays faithful to Ableton's design patterns (neutral waveforms, gray markers, red automation)
- Hue injection becomes the opt-in path for creative color variation
- These new targets will be added to the color variation slider, giving users control over how "expressive" their theme becomes

**Implementation Priority:**
1. `WaveformColor` + `DimmedWaveformColor` — highest visual impact, affects every clip
2. `LoopColor` — visible in arrangement view constantly
3. `AutomationColor` — dramatic but may feel "wrong" to some users (red = automation is ingrained)
4. `BrowserSampleWaveform` — nice-to-have, less frequently noticed

---

### Phase 1C: Expanded Hue Injection Implementation Plan

**Goal:** Add new parameter targets to hue injection in a controlled, aesthetic way. Each tier adds more color expressiveness, scaled by the existing strength slider.

#### Design Principles

1. **Accent hue, not interpolation** — Use the exact hue from `accent_primary` or `accent_secondary`, never blend hues (avoids "mystery colors")
2. **Preserve lightness relationships** — Keep the same relative lightness as the original neutral value
3. **Scale saturation with strength** — At 0% strength, saturation = 0 (neutral). At 100%, saturation = target max
4. **Group related parameters** — Parameters that appear together visually should share the same hue source
5. **Tier by visibility** — Most visible changes first, subtle refinements later

---

#### Tier 1: Arrangement Waveforms & Notes (Highest Impact)

**Parameters:**
| Parameter | Hue Source | Saturation Range | Lightness | Notes |
|-----------|------------|------------------|-----------|-------|
| `WaveformColor` | `accent_primary` | 0-15% | ~10% (dark) | Low saturation to avoid overwhelming clips |
| `DimmedWaveformColor` | `accent_primary` | 0-10% | ~40% | Deactivated clips, slightly lighter |

**Why accent_primary:** Waveforms are the "content" of the arrangement — they should match the primary theme color, not the secondary accent.

**Implementation:**
```ts
// In generateTheme() parameter overrides section
if (hueInjection.enabled) {
  const waveformSat = hueInjection.strength * 0.15; // max 15%
  parameters.WaveformColor = oklchToHex({
    l: 0.10,
    c: waveformSat,
    h: accentPrimaryHue,
    alpha: 0.94 // preserve original alpha
  });
}
```

**Test criteria:**
- Clips should feel "tinted" not "colored"
- Still readable against clip backgrounds
- Deactivated clips should be obviously dimmed but cohesive

---

#### Tier 2: Timeline & Navigation (High Visibility)

**Parameters:**
| Parameter | Hue Source | Saturation Range | Lightness | Notes | Status |
|-----------|------------|------------------|-----------|-------|--------|
| `LoopColor` | `accent_secondary` | 30-50% | 50-60% (dark), 25-35% (light) | Loop brace, locators | ✅ Done |
| `OffGridLoopColor` | `accent_secondary` | Same as LoopColor | Same, with 4f alpha | Loop region fill | ✅ Done |
| `ArrangementRulerMarkings` | `accent_secondary` | 0-15% | ~57% | Time ruler text/ticks | Not tested |
| `GridLineBase` | `accent_secondary` | 0-8% | ~3% | Very subtle grid tint | ❌ Rejected |

**Why accent_secondary:** These are "structural" elements that frame the content — secondary accent keeps them distinct from waveforms.

**Test criteria:**
- Loop region should feel themed but not distracting
- Grid should be barely perceptible color, mostly just structural
- Ruler marks should remain highly legible

**GridLineBase rejection notes (2026-03-20):** Tested with 40-80% saturation and 8-15% lightness. Even with high saturation, colored gridlines can become too similar to surface colors in certain palettes, reducing their visibility as structural elements. Keeping gridlines neutral preserves their functional role.

---

#### Tier 3: Device Displays (Medium Impact)

**Parameters already implemented:**
- `SpectrumDefaultColor` — ✅ Done
- `detail_bg`, `surface_highlight`, `control_bg` — ✅ Done (resolved roles)

**Parameters already using accent colors directly (no hue injection needed):**
| Parameter | Hue Source | Notes |
|-----------|------------|-------|
| `RetroDisplayHandle1` | `accent_primary` | EQ nodes, filter handles — already mapped to accent_primary in parameter-map.json |
| `RetroDisplayRed` | `accent_secondary` | EQ curves, mod buttons — already mapped to accent_secondary in parameter-map.json |

**Note (2026-03-20):** These parameters are already correctly mapped to accent colors in the base parameter map, so they don't need special hue injection handling — they automatically use the extracted accents.

---

#### Tier 4: Browser & UI Polish (Lower Priority)

**Parameters:**
| Parameter | Hue Source | Saturation Range | Lightness | Notes | Status |
|-----------|------------|------------------|-----------|-------|--------|
| `BrowserSampleWaveform` | `accent_primary` | 25-50% | 50-60% (dark), 40-50% (light) | Waveform previews in browser | ✅ Done |
| `AutomationColor` | `accent_secondary` | 70-90% | 55-65% (dark), 45-50% (light) | Automation lines, breakpoints, indicator dots | ✅ Done |
| `AutomationMouseOver` | `accent_secondary` | ~60-75% | ±15% from AutomationColor | Hover state for automation | ✅ Done |
| `VelocitySelectedOrHovered` | `selection_bg` | Direct use | Match selection | MIDI note hover state | Not tested |

**BrowserSampleWaveform notes (2026-03-20):** Also added a baseline fix for light themes — the neutral scale's `n11_mid_high` was using surface lightness (~80%), making browser waveforms nearly invisible. Now overridden to ~40% lightness for light themes regardless of hue injection state.

**AutomationColor notes (2026-03-20):** Tested and approved despite red being traditionally associated with automation in Ableton. Users enabling hue injection are consciously trading "clean/conventional" for "expressive/vibey" — the slider makes this tradeoff explicit.

---

#### Implementation Order

| Step | Parameters | Test Focus | Status |
|------|------------|------------|--------|
| 1 | `WaveformColor`, `DimmedWaveformColor` | Clip readability, cohesion | ✅ Done (2026-03-20) |
| 2 | `LoopColor`, `OffGridLoopColor` | Timeline legibility | ✅ Done (2026-03-20) |
| 3 | `GridLineBase` | Subtlety check | ❌ Rejected (2026-03-20) |
| 4 | `BrowserSampleWaveform` | Browser cohesion | ✅ Done (2026-03-20) |
| 5 | `AutomationColor`, `AutomationMouseOver` | Automation visibility | ✅ Done (2026-03-20) |
| 6 | `RetroDisplayHandle1`, `RetroDisplayRed` | Already accent-derived | ✅ Already mapped (no injection needed) |
| 7 | `VelocitySelectedOrHovered` | MIDI editing feel | Not tested |
| 8 | `ArrangementRulerMarkings` | Ruler legibility | Not tested |

#### Summary of Hue Injection Parameters (as of 2026-03-20)

**Implemented and active:**
| Parameter | Hue Source | Description |
|-----------|------------|-------------|
| `WaveformColor` | `accent_primary` | Arrangement waveforms |
| `DimmedWaveformColor` | `accent_primary` | Deactivated clip waveforms |
| `LoopColor` | `accent_secondary` | Loop braces, locators, timeline markers |
| `OffGridLoopColor` | `accent_secondary` | Loop region fill (with alpha) |
| `SpectrumDefaultColor` | `accent_primary` | Spectrum analyzer waveform |
| `BrowserSampleWaveform` | `accent_primary` | Browser waveform previews |
| `AutomationColor` | `accent_secondary` | Automation lines, breakpoints, indicator dots |
| `AutomationMouseOver` | `accent_secondary` | Automation hover state |

**Rejected:**
| Parameter | Reason |
|-----------|--------|
| `GridLineBase` | Colored gridlines can blend with surface colors, reducing visibility |

**Not needing injection (already accent-mapped):**
| Parameter | Existing Mapping |
|-----------|------------------|
| `RetroDisplayHandle1` | `accent_primary` |
| `RetroDisplayRed` | `accent_secondary` |

---

**Step 1 Implementation Notes (2026-03-15, revised 2026-03-20):**

Added to `generateTheme()` in `derivation.ts`:
- `WaveformColor`: accent_primary hue, S=40-65%, L=20-30% (dark) / 30-40% (light), alpha=ef
- `DimmedWaveformColor`: accent_primary hue, S=25-40%, L=35-45% (dark) / 45-55% (light), alpha=df

**Revision notes (2026-03-20):** Original implementation had three bugs:
1. Saturation cap (15%) was below the neutral scale baseline (~28% for saturated surfaces) — injection was actually *desaturating*
2. Hardcoded lightness at ~9% (dark) made saturation imperceptible — HSL saturation is invisible below ~15% lightness
3. Waveform overrides were inside the hue distance gate (30°+) — blocked injection when accent/surface shared similar hues, even though the saturation boost was the primary value

Fix: Raised saturation/lightness to values clearly above baseline, and moved waveform overrides outside the hue distance gate. Verified working on both light and dark themes.

---

#### Rollback Safety

Each parameter override should be wrapped in a conditional:
```ts
if (hueInjection.enabled && hueInjection.strength > 0) {
  // apply override
}
```

At strength = 0, all parameters remain at their baseline (Ableton-faithful) values.

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
