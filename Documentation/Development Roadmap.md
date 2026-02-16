# Ableton Live 12 Theme Generator - Development Roadmap

## Project Overview

A desktop application that generates Ableton Live 12 themes from user-uploaded images. The app extracts dominant colors from images and creates multiple theme variants as downloadable .ask files.

### Core Value Proposition
- Upload any image (album art, photos, etc.)
- Receive 3-5 theme variants based on extracted colors
- Preview color swatches for each variant
- Download .ask files ready to install in Live 12

---

## Phase 1: Research & Documentation

### 1.1 Complete Parameter Mapping
- [x] Document all ~236 color parameters and what they control in Live 12
- [x] Group parameters by UI region (browser, arrangement, mixer, devices, etc.)
- [x] Note which parameters typically share colors in default themes

### 1.2 Analyze Default Themes
- [x] Extract color data from 6 default Ableton themes (neutral, warm, cool, creative)
- [x] Count unique colors per theme (~110-115 unique per theme)
- [x] Identify the "core palette" structure (backgrounds, accents, text, clips, etc.)
- [x] Document color relationships — 15-stop neutral lightness ramp with HSL interpolation

### 1.3 Define Color Roles
- [x] Create 12 semantic color roles as intermediate layer (5 required, 7 derived)
- [x] Define 15-stop neutral scale derivation system
- [x] Map all 236 parameters to a color role or derivation rule (`src/theme/parameter-map.json`)

### 1.4 Validation
- [x] Built test theme ("Steel Blue Dark") using the mapping engine
- [x] Tested in Live 12 — theme loads and renders correctly
- [x] Documented contrast requirements (8 WCAG-based pairs) in `src/theme/contrast.ts`
- [ ] Extended testing with more usage to identify edge-case parameter issues

**Deliverable:** Complete specification document (`Documentation/Semantic Color Roles Specification.md`) and working engine (`src/theme/`)

---

## Phase 2: Core Engine (TypeScript — runs in Electron)

> Architecture decision: The engine is implemented in TypeScript rather than Python, eliminating the need for Python bundling/integration and simplifying distribution.

### 2.1 Color Extraction Module
- [ ] Implement dominant color extraction (k-means clustering or similar)
- [ ] Input: Image file (jpg, png, etc.)
- [ ] Output: 5 colors mapped to required roles (tone, surface_base, text_primary, accent_primary, accent_secondary)
- [ ] Include logic to ensure sufficient contrast and variety in extracted colors

### 2.2 Palette Generation Module
- [x] Resolve 5 input colors into 12 semantic color roles (`src/theme/derivation.ts` → `resolveRoles()`)
- [x] Generate 15-stop neutral scale with lighter/darker variations (`buildNeutralScale()`)
- [ ] Create 3-5 variant palettes by shifting role assignments
- [x] Implement contrast validation (`src/theme/contrast.ts`)

### 2.3 Theme File Generator
- [x] Apply color mappings to all 236 parameters (`generateParameters()`)
- [x] Generate valid .ask file structure (`src/theme/ask-generator.ts`)
- [x] Validated output: 91.6% exact match against default Ableton theme

### 2.4 CLI/Script Tool
- [x] Test script for development (`scripts/generate-test-theme.ts`)
- [ ] Integrate generation into Electron app via IPC

**Deliverable:** Working TypeScript engine that converts 5 colors to .ask theme files

---

## Phase 3: Desktop Application (Electron)

### 3.1 Project Setup
- [x] Initialize Electron project with Vite
- [x] Set up React + TypeScript for the renderer process
- [x] Set up IPC between Electron main process and renderer
- [x] Ableton Live 12 Themes directory auto-detection (Mac + Windows)

**Tech Stack:**
- Electron (app shell, file system access, native dialogs)
- React + Vite (UI framework)
- TypeScript (theme engine runs natively — no Python dependency)

### 3.2 Core UI Components
- [ ] Drag-and-drop zone for image upload
- [ ] Image preview display
- [ ] Variant cards showing color swatch rows
- [ ] Labels for key swatches (Background, Accent, Clips, etc.)
- [ ] Download button for each variant
- [ ] Loading states and progress indicators

### 3.3 User Features
- [ ] Favorites/library system (save themes locally)
- [ ] Settings panel (default output directory, number of variants)
- [ ] Theme naming before download
- [ ] Batch processing (multiple images at once) - optional

### 3.4 Polish
- [ ] App icon and branding
- [ ] Menu bar integration
- [ ] Keyboard shortcuts
- [ ] Error handling and user feedback
- [ ] About/help section with usage instructions

### 3.5 Packaging & Distribution
- [ ] Configure electron-builder for Mac (.dmg) and Windows (.exe)
- [ ] Code signing (optional but recommended for Mac)
- [ ] Auto-updater setup (electron-updater)
- [ ] Create installer assets and screenshots

**Deliverable:** Downloadable desktop application for Mac and Windows

---

## Phase 4: Launch & Distribution

### 4.1 Pre-Launch
- [ ] Generate demo themes to validate quality
- [ ] Create landing page with email capture and download links
- [ ] Record YouTube video walkthrough
- [ ] Prepare social media assets

### 4.2 Launch
- [ ] Post to Ableton subreddit (r/ableton)
- [ ] Share in Ableton Facebook groups
- [ ] Post on Ableton official forum
- [ ] Publish YouTube video
- [ ] Submit to relevant music production blogs/newsletters

### 4.3 Post-Launch
- [ ] Monitor feedback and bug reports
- [ ] Iterate on color extraction quality
- [ ] Consider feature additions based on user requests

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Electron Main Process               │
│  - File system access, native dialogs                │
│  - Ableton Themes directory detection                │
│  - .ask file writing                                 │
└─────────────────────┬───────────────────────────────┘
                      │ IPC
┌─────────────────────▼───────────────────────────────┐
│               Electron Renderer (React)              │
│  - Image upload UI                                   │
│  - Color extraction (canvas-based)                   │
│  - Theme engine (src/theme/*)                        │
│  - Swatch preview                                    │
└─────────────────────────────────────────────────────┘
```

No Python dependency — the entire engine runs in TypeScript/JavaScript within the Electron renderer process.

---

## Key Decisions (Resolved)

1. **Number of color roles:** 12 semantic roles, only 5 required as input. See `Documentation/Semantic Color Roles Specification.md`.

2. **Variant generation strategy:** TBD — rotate which extracted colors fill which roles.

3. **Palette size flexibility:** Fixed at 5 required inputs (tone + 4 colors). Derived roles provide the flexibility.

4. **Contrast handling:** Auto-validate with WCAG ratios. 8 foreground/background pairs checked. See `src/theme/contrast.ts`.

---

## Success Metrics

- App downloads
- Email signups (if applicable)
- YouTube video views/engagement
- User feedback quality
- Community sharing (users posting themes they've created)
