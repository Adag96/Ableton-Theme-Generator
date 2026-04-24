# Claude Lessons — Ableton Theme Generator

Patterns learned from mistakes, corrections, and hard-won debugging.
Read this at session start. Follow these rules to avoid repeating past issues.

## Entry Format
Each lesson follows this structure:
- **Date**: When it was learned
- **Category**: See categories below
- **What happened**: Brief description of the problem
- **Root cause**: Why it happened
- **Rule**: A concrete, followable instruction to prevent recurrence

## Categories
| Category | Use when the issue involves... |
|----------|-------------------------------|
| `Electron` | Main process, IPC, preload scripts, native APIs |
| `React` | Components, hooks, state management, rendering |
| `Theme-Format` | .ask file structure, Ableton theme parameters, color mapping |
| `Color` | Color extraction, palette generation, contrast calculations |
| `Build` | Vite, TypeScript compilation, electron-builder, packaging |
| `File-IO` | Reading/writing files, paths, file dialogs, permissions |
| `UI/UX` | Styling, layout, user interactions, CSS |
| `Workflow` | Development process, testing, debugging approaches |

---

## Lessons

### 2026-02-19 | Workflow | Test theme output location

**What happened**: Generated A/B comparison themes to a project-local directory (`test-themes/`), then had to manually copy them to Ableton's themes folder for user testing.

**Root cause**: Scripts defaulted to outputting within the project directory rather than where the user actually needs them.

**Rule**: When generating test .ask theme files for evaluation in Ableton Live, always output directly to the Ableton themes directory: `/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Themes/`. This eliminates the extra step of copying files.

### 2026-03-20 | Color | Hue injection parameter overrides must account for neutral scale baseline

**What happened**: WaveformColor hue injection used absolute saturation values (max 15%) that were lower than what the neutral scale already provided from the surface hue (~28%). Also used hardcoded low lightness (9% dark) where saturation is imperceptible. Additionally, the entire override block was behind a hue distance gate (30°+) that blocked injection when accent and surface shared similar hues — even though the saturation/lightness boost was still valuable.

**Root cause**: Three compounding issues: (1) saturation values assumed a neutral gray baseline, but the neutral scale already tints with surface hue; (2) HSL saturation is invisible at very low lightness; (3) the hue distance gate was too broad — it blocked effects whose value comes from saturation, not hue shift.

**Rule**: When overriding parameters that derive from the neutral scale, check what the baseline already provides — don't assume neutral gray. Separate hue-shift effects (need hue distance gate) from saturation/lightness effects (should always apply). At HSL lightness below ~15%, saturation is imperceptible regardless of value.

### 2026-02-23 | UI/UX | object-fit: contain breaks mouse position calculations

**What happened**: Implementing an image magnifier loupe. Mouse tracking worked in the center but "stuck" at left/right/top edges. Multiple fix attempts failed (tolerance, fresh rects, portal rendering).

**Root cause**: When an `<img>` has `object-fit: contain`, the element's bounding rect includes letterboxed/padded areas where the image isn't actually rendered. `getBoundingClientRect()` returns the full element box, not the visible image content bounds.

**Rule**: When doing precise mouse-to-image-content calculations with `object-fit: contain`, you must manually calculate the actual rendered image bounds using the image's natural dimensions and the container's dimensions. The element's bounding rect alone is insufficient.

---

### 2026-03-20 | Process | CRITICAL: Duplicate Work Log headers (repeated violation)
**What happened**: Created duplicate date headers in Work Log TWICE on the same day instead of appending to the existing one.

**Root cause**: Not checking the Work Log for an existing same-day header before writing. This has happened multiple times despite being documented as a lesson AND in the /wrap skill.

**Rule**: BEFORE writing ANY entry to Work Log: (1) Read the file, (2) Check if a `## 2026-X-XX` header already exists for today's date (ignore the time portion), (3) If yes, update that header's timestamp and append bullets to its list, (4) If no, create a new header. NEVER create a new `##` header if one already exists for the same date. This is non-negotiable.

### 2026-03-23 | UI/UX | Modal image clipping — fix the container, not the image

**What happened**: Preview image in ThemeDetailModal appeared too small at small window sizes. Attempted to fix by changing the image's `max-height` from `min(400px, 38vh)` to `min(400px, 100%)` — this made images blurry and poorly positioned. Then tried bumping to `50vh` — this made the image overflow the modal's `overflow: hidden` boundary, clipping the top of the image.

**Root cause**: The image's `max-height: 38vh` was fine for the image itself. The actual constraint was the modal container: `max-height: 75vh` with `overflow: hidden`. At small windows, the modal didn't have enough room for image + info + actions, and hidden overflow silently clipped the image. Two failed attempts changed the wrong thing (the image sizing) instead of the right thing (the modal container).

**Rule**: When content is clipped or undersized inside a modal, check the modal container's `max-height` and `overflow` first before touching child element sizing. Increase the container's `max-height` and use `overflow-y: auto` (scrollable) instead of `overflow: hidden` (clipping). Only change child sizing if the container is already giving enough room.
