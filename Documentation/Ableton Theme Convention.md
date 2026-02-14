# Ableton Live 12 Theme Color Convention

This document analyzes the color structure of Ableton Live 12 default themes to understand how many colors are needed for theme generation.

---

## Analysis Summary

| Metric | Light Theme | Dark Theme |
|--------|-------------|------------|
| Total color parameters | 236 | 236 |
| Unique colors used | 113 | 112 |
| Colors shared between themes | 60 | 60 |

### Key Finding: ~110 Unique Colors, ~10 "Main" Color Families

While themes contain 236 color parameters, they only use around 110-115 unique color values. Many parameters share the same color. More importantly, these unique colors cluster into approximately **10 main color families**:

| Color Family | Light Theme Shades | Dark Theme Shades |
|--------------|-------------------|-------------------|
| Gray | 29 | 28 |
| Blue | 18 | 17 |
| Black | 12 | 14 |
| Red | 11 | 13 |
| Cyan | 9 | 10 |
| Orange | 9 | 9 |
| Yellow | 9 | 8 |
| Green | 8 | 8 |
| White | 5 | 2 |
| Purple | 2 | 2 |

---

## Color Reuse Patterns

Many colors are assigned to multiple parameters. The most reused colors are:

### Default Light Neutral Medium - Top 10 Shared Colors

| Color | Parameters Using It | Purpose |
|-------|---------------------|---------|
| `#6e6e6e` | 13 | Mid-gray for borders, disabled states |
| `#121212` | 10 | Near-black for text, foreground |
| `#ffa519` | 10 | Orange VuMeter accent |
| `#ffb901` | 9 | Primary accent (yellow-orange) |
| `#242424` | 8 | Dark elements, knobs |
| `#4f4f4f` | 8 | Dark gray for controls |
| `#a5a5a5` | 8 | Main surface background |
| `#cfcfcf` | 8 | Light control backgrounds |
| `#bcbcbc` | 7 | Surface highlights |
| `#3d3d3d` | 7 | Dark accents, rulers |

### Default Dark Neutral Medium - Top 10 Shared Colors

| Color | Parameters Using It | Purpose |
|-------|---------------------|---------|
| `#757575` | 11 | Mid-gray for disabled, borders |
| `#ffa519` | 10 | Orange VuMeter accent |
| `#464646` | 9 | Surface highlights, controls |
| `#ffad56` | 9 | Primary accent (orange) |
| `#363636` | 8 | Main surface background |
| `#b5b5b5` | 7 | Light text/foreground |
| `#242424` | 6 | Dark borders, elements |
| `#2a2a2a` | 6 | Desktop background, borders |
| `#5d5d5d` | 6 | Control backgrounds |
| `#03c3d5` | 6 | Secondary accent (cyan) |

---

## Colors Identical Across Light & Dark Themes

60 colors are exactly the same in both themes. These fall into categories:

### 1. Clip Colors (16 colors) - Always Identical
```
#8b7936, #999565, #b8ce93, #afb95b, #52ba46, #81d24c,
#6baace, #4881aa, #954eb2, #ff5f80, #dc4848, #d66b18,
#e0aa2a, #ffec75, #e7e6e6, #a0a0a0
```

### 2. VuMeter Colors - Mostly Identical
Standard meter gradient, headphones meter, sends meter, etc.

### 3. Functional/Semantic Colors - Identical
- Learn MIDI: `#4034ef`
- Learn Key: `#ff6400`
- Learn Macro: `#00da48`
- Freeze: `#4391e6`
- Ableton Logo: `#00ff00`

### 4. Zone Colors (Sampler) - Identical
- Key Zone: `#acf6b4`, `#28bd56`
- Velocity Zone: `#f5a7a3`, `#e95449`
- Selector Zone: `#bed6f4`, `#2d66d2`

### 5. Operator Synth Colors - Identical
```
#e0d825, #29d6cd, #6571f6, #f3751b
```

---

## Inferred Color Role Structure

Based on this analysis, a theme can be defined with approximately **6-8 core design decisions**:

### 1. Surface Colors (Backgrounds)
- Primary background (`SurfaceBackground`)
- Highlighted/selected background (`SurfaceHighlight`)
- Detail view background (`DetailViewBackground`)
- Desktop/border color (`Desktop`)

### 2. Control Colors
- Control background (`ControlBackground`)
- Control foreground/text (`ControlForeground`)
- Disabled states (derived from above)

### 3. Primary Accent
- Chosen/active state (`ChosenDefault`) - e.g., yellow-orange `#ffb901` or orange `#ffad56`
- Used for: active toggles, progress bars, retro displays

### 4. Secondary Accent
- Alternative highlight (`ChosenAlternative`) - e.g., cyan `#00eeff` or `#03c3d5`
- Used for: range indicators, alternative displays

### 5. Semantic Colors (Often Fixed)
- Record: Red (`ChosenRecord`)
- Play: Green (`ChosenPlay`)
- Pre-listen: Blue (`ChosenPreListen`)
- Alert: Orange (`ChosenAlert`, `Alert`)

### 6. Clip Colors (16 Fixed Colors)
These appear to be consistent across themes and should likely remain unchanged.

### 7. VuMeter Gradients
Standard gradient from green → yellow → red for level meters.

---

## Implications for Theme Generator

### Minimum Viable Palette
To generate a coherent theme, we likely need:

1. **3-5 neutral colors** (background shades from dark to light)
2. **1-2 accent colors** (primary + secondary)
3. **Preserve 16 clip colors** (don't modify)
4. **Preserve semantic colors** (record=red, play=green, etc.)
5. **Derive remaining colors** algorithmically (lighter/darker variants)

### Color Derivation Strategy
Many of the 110+ unique colors are:
- **Lightness variations**: Same hue, different brightness
- **Alpha variations**: Same color with transparency
- **Saturation variations**: Same hue, different intensity

The generator should:
1. Extract 5-8 dominant colors from an image
2. Assign them to semantic roles (background, highlight, accent, etc.)
3. Derive the full 236 parameters by:
   - Generating lighter/darker variants
   - Adding appropriate alpha values
   - Maintaining contrast ratios

### Contrast Considerations
- Light theme: Dark text (`#121212`) on light backgrounds (`#a5a5a5`)
- Dark theme: Light text (`#b5b5b5`) on dark backgrounds (`#363636`)
- The generator must ensure text remains readable

---

## Detailed Color Breakdown

### Default Light Neutral Medium

#### Black Family (12 shades)
| Color | HSL | Notes |
|-------|-----|-------|
| `#000000` | H:0° S:0% L:0% | Pure black (text, borders) |
| `#121212` | H:0° S:0% L:7% | Primary foreground text |
| `#242424` | H:0° S:0% L:14% | Knobs, dark elements |
| Various with alpha | - | Shadows, overlays |

#### Gray Family (29 shades)
Range from L:24% (`#3d3d3d`) to L:81% (`#cfcfcf`)

Key grays:
- `#a5a5a5` (L:65%) - Main surface background
- `#bcbcbc` (L:74%) - Surface highlight
- `#cfcfcf` (L:81%) - Control backgrounds
- `#6e6e6e` (L:43%) - Borders, disabled states

#### Accent Colors
- Primary: `#ffb901` (Yellow-orange, H:43°)
- Secondary: `#00eeff` (Cyan, H:184°)

### Default Dark Neutral Medium

#### Black Family (14 shades)
Range from L:0% to L:14%

Key blacks:
- `#070707` (L:3%) - Primary foreground text background
- `#111111` (L:7%) - Knobs
- `#181818` (L:9%) - Display backgrounds
- `#1e1e1e` (L:12%) - Control backgrounds

#### Gray Family (28 shades)
Range from L:16% (`#2a2a2a`) to L:75% (`#bfbfbf`)

Key grays:
- `#363636` (L:21%) - Main surface background
- `#464646` (L:27%) - Surface highlight
- `#757575` (L:46%) - Disabled, borders
- `#b5b5b5` (L:71%) - Primary foreground text

#### Accent Colors
- Primary: `#ffad56` (Orange, H:31°)
- Secondary: `#03c3d5` (Cyan, H:185°)

---

## Next Steps

1. **Define semantic color roles** - Create an intermediate mapping layer
2. **Map parameters to roles** - Assign each of the 236 parameters to a role
3. **Build derivation functions** - Create algorithms to generate variations
4. **Test with manual theme** - Validate the mapping with a hand-crafted theme

---

## Appendix: Analysis Methodology

Analysis performed on:
- `Default Light Neutral Medium.ask`
- `Default Dark Neutral Medium.ask`

Colors were:
1. Extracted from all XML Value attributes containing hex colors
2. Grouped by HSL color family
3. Compared across themes to find shared values

Tool: Custom Python script using `colorsys` for HSL conversion.
