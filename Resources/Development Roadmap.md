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
- [ ] Document all ~275 parameters and what they control in Live 12
- [ ] Group parameters by UI region (browser, arrangement, mixer, devices, etc.)
- [ ] Note which parameters typically share colors in default themes

### 1.2 Analyze Default Themes
- [ ] Extract color data from 5-10 default Ableton themes
- [ ] Count unique colors per theme
- [ ] Identify the "core palette" structure (backgrounds, accents, text, clips, etc.)
- [ ] Document color relationships (e.g., "secondary background is always X% lighter than primary")

### 1.3 Define Color Roles
- [ ] Create semantic color roles as an intermediate layer between extracted colors and parameters
- [ ] Example roles: `primary_bg`, `secondary_bg`, `accent_1`, `accent_2`, `text_primary`, `text_secondary`, `clip_color_1`, etc.
- [ ] Map each of the 275 parameters to a color role

### 1.4 Validation
- [ ] Manually build one theme file using the mapping logic
- [ ] Test in Live 12 to validate all parameters are correctly assigned
- [ ] Document any edge cases or constraints (contrast requirements, etc.)

**Deliverable:** Complete specification document defining required color roles and parameter mappings

---

## Phase 2: Core Engine (Python Backend)

### 2.1 Color Extraction Module
- [ ] Implement dominant color extraction using k-means clustering
- [ ] Input: Image file (jpg, png, etc.)
- [ ] Output: Ranked list of N colors matching required palette size
- [ ] Include logic to ensure sufficient contrast and variety in extracted colors

**Dependencies:** `scikit-learn` or `colorthief`, `Pillow`

### 2.2 Palette Generation Module
- [ ] Assign extracted colors to semantic color roles
- [ ] Generate color variations (lighter/darker versions) for related parameters
- [ ] Create 3-5 variant palettes by shifting role assignments
- [ ] Implement contrast validation and auto-adjustment if needed

### 2.3 Theme File Generator
- [ ] Apply color mappings to all parameters
- [ ] Generate valid .ask file structure
- [ ] Validate output against known working themes

### 2.4 CLI Tool
- [ ] Create command-line interface for testing and development
- [ ] Usage: `python theme_gen.py input.jpg --variants 4 --output ./themes/`
- [ ] Generates multiple .ask files from a single image

**Deliverable:** Working Python package that converts images to .ask theme files

---

## Phase 3: Desktop Application (Electron)

### 3.1 Project Setup
- [ ] Initialize Electron project with electron-forge or electron-builder
- [ ] Set up React or Vue for the renderer process (recommended: React + Vite)
- [ ] Configure Python backend integration (child_process spawn or package Python with PyInstaller)
- [ ] Set up IPC (Inter-Process Communication) between Electron main process and Python backend

**Tech Stack:**
- Electron (app shell, file system access, native dialogs)
- React + Vite (UI framework)
- Tailwind CSS (styling)
- Python backend (color extraction and theme generation)

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
│                  Electron Main Process              │
│  - File system access                               │
│  - Native dialogs                                   │
│  - Python process management                        │
└─────────────────────┬───────────────────────────────┘
                      │ IPC
┌─────────────────────▼───────────────────────────────┐
│               Electron Renderer (React)             │
│  - Drag-drop UI                                     │
│  - Swatch display                                   │
│  - User preferences                                 │
└─────────────────────┬───────────────────────────────┘
                      │ IPC → spawn
┌─────────────────────▼───────────────────────────────┐
│                  Python Backend                     │
│  - Color extraction (scikit-learn/colorthief)       │
│  - Palette generation                               │
│  - .ask file generation                             │
└─────────────────────────────────────────────────────┘
```

### Python-Electron Integration Options

**Option A: Spawn Python Process**
- Bundle Python script with the app
- Call via child_process.spawn()
- Communicate via stdout/stdin or temp files
- Requires users to have Python installed OR bundle Python runtime

**Option B: Package Python as Executable**
- Use PyInstaller to create standalone executable
- Bundle .exe/.app with Electron app
- No Python dependency for end users
- Larger app size but cleaner distribution

**Recommended:** Option B for distribution simplicity

---

## File Structure (Proposed)

```
ableton-theme-generator/
├── electron/
│   ├── main/
│   │   ├── index.ts
│   │   └── python-bridge.ts
│   ├── preload/
│   │   └── index.ts
│   └── renderer/
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── App.tsx
│       └── index.html
├── python/
│   ├── theme_generator/
│   │   ├── __init__.py
│   │   ├── color_extraction.py
│   │   ├── palette_generation.py
│   │   ├── theme_builder.py
│   │   └── mappings/
│   │       └── parameters.json
│   ├── cli.py
│   └── requirements.txt
├── docs/
│   ├── parameter-mapping.md
│   └── color-roles.md
├── package.json
├── ROADMAP.md
└── README.md
```

---

## Key Decisions to Make

1. **Number of color roles:** How many semantic colors does a theme need? (Estimate: 10-16)

2. **Variant generation strategy:** How do we create meaningfully different variants from the same image?

3. **Palette size flexibility:** Should users be able to request more/fewer colors extracted?

4. **Contrast handling:** Auto-adjust colors that don't meet contrast requirements, or warn the user?

---

## Success Metrics

- App downloads
- Email signups (if applicable)
- YouTube video views/engagement
- User feedback quality
- Community sharing (users posting themes they've created)
