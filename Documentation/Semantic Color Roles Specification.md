# Semantic Color Roles Specification

This document defines the intermediate mapping layer between user-provided colors and Ableton Live 12's 236 theme parameters. It is the single source of truth for how the theme generation engine works.

---

## Overview

An Ableton Live 12 theme file (.ask) contains 236 parameters. However, these 236 values derive from only **5 required input colors** plus a tone flag. The derivation system works in three stages:

```
5 Input Colors → 12 Resolved Roles → 15-stop Neutral Scale → 236 Parameters
```

---

## The 12 Semantic Color Roles

| # | Role | Required? | Description |
|---|------|-----------|-------------|
| 1 | `tone` | **Yes** | `"light"` or `"dark"` — controls derivation direction |
| 2 | `surface_base` | **Yes** | Main panel backgrounds (browser, arrangement, session, detail) |
| 3 | `text_primary` | **Yes** | Primary text and icons throughout the UI |
| 4 | `accent_primary` | **Yes** | Active toggle color (ChosenDefault, Progress, retro displays) |
| 5 | `accent_secondary` | **Yes** | Alternative highlight (ChosenAlternative, RangeDefault, threshold lines) |
| 6 | `contrastLevel` | Optional | Surface contrast multiplier: `"low"` \| `"medium"` (default) \| `"high"` \| `"very-high"` |
| 7 | `surface_highlight` | Derived | Selected track/focused element background |
| 8 | `surface_border` | Derived | Outer frames, desktop borders |
| 9 | `detail_bg` | Derived | Clip editor area backgrounds |
| 10 | `control_bg` | Derived | Input field and knob backgrounds |
| 11 | `text_secondary` | Derived | Disabled/dim text, borders |
| 12 | `selection_bg` | Derived | Selection highlight background |
| 13 | `selection_fg` | Derived | Text on selection highlights |

### Contrast Level

The `contrastLevel` parameter controls the lightness spread between surface colors. Higher contrast creates more visual separation between panels and controls.

| Level | Multiplier | Effect |
|-------|------------|--------|
| `low` | 1.0× | Original/subtle (matches Ableton default style) |
| `medium` | 1.4× | Moderate contrast boost (default) |
| `high` | 1.8× | Noticeable visual separation |
| `very-high` | 2.2× | Maximum differentiation |

The multiplier is applied to the base lightness offsets when deriving surface colors:
- `surface_highlight`: base offset +6L (dark) or +9L (light)
- `surface_border`: base offset -4L (dark) or -5L (light)
- `control_bg`: base offset -9L (dark) or +16L (light)

### Derivation Rules for Optional Roles

When not provided, optional roles are derived from the required ones. Surface color derivations are scaled by the contrast multiplier (CM):

| Role | Dark Theme Derivation | Light Theme Derivation |
|------|----------------------|----------------------|
| `surface_highlight` | surface_base lightness + (6 × CM), min 12% spread | surface_base lightness + (9 × CM) |
| `surface_border` | surface_base lightness - (4 × CM) | surface_base lightness - (5 × CM) |
| `detail_bg` | lerp(surface_base, surface_highlight, 0.5) | same |
| `control_bg` | surface_base lightness - (9 × CM), min L=5% | surface_base lightness + (16 × CM) |
| `text_secondary` | lerp(surface_base, text_primary, 0.5) | same |
| `selection_bg` | accent_secondary hue, S≤40, L=78 | accent_secondary hue, S≤40, L=88 |
| `selection_fg` | #070707 | #121212 |

Where CM = contrast multiplier (1.0 for low, 1.4 for medium, 1.8 for high, 2.2 for very-high).

**Dark Theme Minimums:** To ensure UI element visibility, dark themes enforce:
- `surface_highlight` must be at least 12% lighter than `surface_base` (ensures selected tracks/devices are distinguishable)
- `control_bg` lightness cannot fall below 5% (prevents invisible controls on very dark themes)

---

## The 15-Stop Neutral Scale

~80% of all theme parameters derive from a neutral lightness ramp that preserves the hue and saturation of the surface colors (enabling tinted themes like purple or teal). The scale has 15 stops anchored at 3 points:

### Dark Theme Stops

| Stop | Lightness | Example (Neutral) | Example (Steel Blue) | Derivation |
|------|-----------|-------------------|---------------------|------------|
| n0_deepest | ~3% | `#070707` | `#060709` | control_bg.L × 0.23 |
| n1_deep | ~7% | `#111111` | `#0f1115` | control_bg.L × 0.57 |
| n2_dark | ~9% | `#181818` | `#15181e` | control_bg.L × 0.80 |
| **n3_control** | ~12% | `#1e1e1e` | `#1a1e25` | = control_bg (anchor) |
| n4_area | ~14% | `#242424` | `#1f242c` | lerp(control_bg, surface_base, 0.25) |
| **n5_border** | ~17% | `#2a2a2a` | `#252a34` | = surface_border (anchor) |
| **n6_surface** | ~21% | `#363636` | `#2d3440` | = surface_base (anchor) |
| n7_detail | ~24% | `#3e3e3e` | `#333b49` | = detail_bg (anchor) |
| **n8_highlight** | ~28% | `#464646` | `#3a4352` | = surface_highlight (anchor) |
| n9_mid_low | ~37% | `#5d5d5d` | `#536076` | lerp(highlight, text_secondary, 0.49) |
| n9b_mid | ~41% | `#696969` | `#606f89` | lerp(n9, text_secondary, 0.5) |
| **n10_mid** | ~46% | `#757575` | `#6c7f9d` | = text_secondary (anchor) |
| n11_mid_high | ~53% | `#868686` | `#8794aa` | lerp(text_secondary, text_primary, 0.26) |
| n11b_ruler | ~57% | `#919191` | `#97a3b6` | lerp(text_secondary, text_primary, 0.44) |
| **n12_text** | ~71% | `#b5b5b5` | `#c8d0dc` | = text_primary (anchor) |

Anchors are shown in **bold**. Non-anchor stops are interpolated between anchors.

---

## Parameter Categories

### Fixed/Semantic Colors (Never Change)

These are identical across all themes and should not be modified:

**16 Clip Colors:** Clip1-16 (see parameter-map.json for exact values)

**Functional Colors:**
- LearnMidi: `#4034ef`, LearnKey: `#ff6400`, LearnMacro: `#00da48`
- FreezeColor: `#4391e6`, AbletonColor: `#00ff00`
- VelocityColor: `#e95449`, VelocitySelectedOrHovered: `#5b8cff`
- MidiNoteMaxVelocity: `#e95449`

**Zone Colors:** KeyZone, VelocityZone, SelectorZone (background + crossfade ramp)

**Operator Synth:** Operator1-4

**VU Meters:** All 7 meter types (StandardVuMeter through OrangeVuMeter)

### Semi-Semantic Colors (Tone-Dependent Defaults)

These have sensible defaults that vary slightly between light/dark:

| Parameter | Dark Default | Light Default |
|-----------|-------------|--------------|
| ChosenRecord | `#ff5559` | `#ff595f` |
| ChosenPlay | `#00d38d` | `#00faa3` |
| ChosenAlert / Alert | `#e76942` | `#ff7d43` |
| ChosenPreListen | `#3c6ab6` | `#1a7df1` |
| Modulation | `#009aac` | `#008cad` |
| ScaleAwareness | `#b595fc` | `#be98ff` |
| AutomationColor | `#ff4d47` | `#ea3c3c` |

### Blend Factors (Tone-Dependent Numerics)

These numeric values control opacity and color blending. They differ between light and dark themes but are constant within each tone. See `parameter-map.json` → `blendFactors` for exact values.

---

## Contrast Requirements

Theme generation validates and automatically corrects contrast issues to ensure readability.

### Required Contrast Ratios

| Foreground | Background | Minimum Ratio | Purpose |
|------------|-----------|---------------|---------|
| text_primary | surface_base | 4.5:1 (WCAG AA) | Primary readability |
| text_primary | surface_highlight | 4.5:1 | Selected track text |
| text_primary | detail_bg | 4.5:1 | Clip editor text |
| text_primary | control_bg | 4.5:1 | Input field text |
| text_secondary | surface_base | 3.0:1 | Disabled text legibility |
| text_secondary | control_bg | 3.0:1 | Disabled text on inputs |
| text_secondary | surface_highlight | 3.0:1 | Disabled text on selected track |
| selection_fg | selection_bg | 4.5:1 | Selection text |
| accent_primary | surface_base | 3.0:1 | Toggle visibility |
| accent_primary | control_bg | 3.0:1 | Toggle on dark inputs |
| text_primary | accent_primary | 4.5:1 | Icons on active toggles |
| text_primary | accent_secondary | 4.5:1 | Icons on secondary accent |

### Auto-Adjustment

When a contrast pair fails validation, the theme engine automatically adjusts one of the colors:

| Pair Type | Adjustment Strategy |
|-----------|-------------------|
| Text on surfaces | Nudge **foreground** lightness (lighten on dark bg, darken on light bg) |
| Accents on surfaces | Nudge **accent** lightness to stand out from surface |
| Text on accents | Nudge **accent** lightness (not text, to preserve surface compatibility) |

The adjustment uses binary search to find the **minimum lightness change** that achieves the required contrast ratio. This preserves the original hue and saturation, maintaining the theme's color character while ensuring readability.

---

## Accuracy

When reproducing Ableton's Default Dark Neutral Medium theme by providing its exact 12 role values, the engine matches **208 out of 227 parameters exactly (91.6%)**. The 19 remaining differences are all within 1-3 hex digits — visually imperceptible.

For novel themes (like the Steel Blue test), the engine produces valid, coherent .ask files that load correctly in Ableton Live 12.

---

## File References

| File | Purpose |
|------|---------|
| `src/theme/types.ts` | TypeScript type definitions |
| `src/theme/parameter-map.json` | Complete parameter-to-role mapping (machine-readable) |
| `src/theme/derivation.ts` | Role resolution + neutral scale + parameter generation |
| `src/theme/color-utils.ts` | HSL conversion, contrast ratio, color manipulation |
| `src/theme/contrast.ts` | WCAG contrast validation |
| `src/theme/ask-generator.ts` | .ask XML file generation |
| `scripts/generate-test-theme.ts` | Test script for generating themes |

---

## Example: Steel Blue Dark Theme

**Input (5 values):**
```
tone: "dark"
surface_base: #2d3440
text_primary: #c8d0dc
accent_primary: #e8943a
accent_secondary: #3ab5c8
```

**Resolved (12 roles):**
```
surface_highlight: #3a4352
surface_border: #252a34
detail_bg: #333b49
control_bg: #1a1e25
text_secondary: #6c7f9d
selection_bg: #b0d7dd
selection_fg: #070707
```

**Output:** 294-line .ask file with 194 color parameters, 7 VU meters, and 33 blend factors.
All contrast checks pass.
