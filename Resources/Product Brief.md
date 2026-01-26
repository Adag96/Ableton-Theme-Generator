# Product Brief: Ableton Live 12 Theme Generator

## Executive Summary

A desktop application that enables Ableton Live 12 users to generate custom themes from any image. Users upload an image, the app extracts a harmonious color palette, and outputs ready-to-use .ask theme files compatible with Ableton Live 12.

---

## Problem Statement

Ableton Live 12 introduced changes to theme file structure, making previous theme creation tools (built for Live 11 and earlier) obsolete. The existing competitor solution has significant usability issues:

- Inaccurate visual preview that doesn't represent how themes actually look in Live 12
- Misleading thumbnail previews in the theme gallery
- Limited library of quality themes

There is no simple, reliable tool for users to generate custom Live 12 themes from images they love—album artwork, photographs, brand colors, etc.

---

## Solution

A lightweight desktop application focused on one thing: **converting images into Ableton Live 12 themes**.

Rather than attempting to build a complex visual theme editor (which requires recreating Ableton's entire UI), this tool takes a streamlined approach:

1. User uploads an image
2. App extracts dominant colors and generates multiple theme variants
3. User previews color swatches for each variant
4. User downloads their preferred variant(s) as .ask files

---

## Target Users

### Primary: Theme Browsers
- Want a quick way to get a nice-looking theme
- Don't want to manually adjust dozens of color parameters
- Value simplicity and speed over granular control

### Secondary: Theme Creators
- Want to rapidly prototype themes from reference images
- May use this as a starting point before manual refinement
- Appreciate the image-to-palette workflow

---

## Core Features

### 1. Image Input
- Drag-and-drop image upload
- Click-to-browse file picker
- Supported formats: JPG, PNG, WebP, GIF

### 2. Color Extraction
- Extract dominant colors from uploaded image using k-means clustering
- Identify optimal number of colors needed for a complete theme
- Ensure extracted palette has sufficient contrast and variety

### 3. Theme Variant Generation
- Generate 3-5 theme variants from each image
- Each variant assigns extracted colors to theme roles differently
- Variants provide meaningful variety (not just slight shifts)

### 4. Swatch Preview
- Display each variant as a horizontal row of color swatches
- Label key swatches with their role (Background, Accent, Clips, Text, etc.)
- Allow users to visually compare variants at a glance

### 5. Theme Export
- Export any variant as a valid .ask file
- User can name the theme before export
- Default save location configurable in settings

### 6. Local Library
- Save favorite themes to a local library within the app
- Browse and re-download previously generated themes
- Delete themes from library

### 7. Ableton Theme Directory Integration
- Auto-detect Ableton Live 12's default theme directory on first launch
- Save themes directly to the theme directory for immediate use in Live
- User can customize theme directory path in settings if using non-standard location
- Default paths:
  - macOS: `~/Library/Application Support/Ableton/Live 12/Themes/`
  - Windows: `C:\Users\[Username]\AppData\Roaming\Ableton\Live 12\Themes\`

---

## Out of Scope (v1.0)

The following features are explicitly **not** included in the initial release:

- Interactive visual editor showing Ableton Live 12 UI
- Real-time preview of theme applied to Ableton interface
- Manual color adjustment/tweaking
- Cloud sync or online theme sharing
- Community gallery or user uploads
- Theme import/editing (only generation from images)
- Mobile version

These may be considered for future versions based on user feedback.

---

## Acceptance Criteria

### Image Input
- [ ] User can drag and drop an image file onto the application window
- [ ] User can click to open a file browser and select an image
- [ ] App accepts JPG, PNG, WebP, and GIF formats
- [ ] App displays error message for unsupported file types
- [ ] Uploaded image is displayed in the app after selection

### Color Extraction
- [ ] App extracts dominant colors from the image within 3 seconds
- [ ] Extracted colors have sufficient contrast for theme usability
- [ ] Number of extracted colors matches requirements defined in parameter mapping

### Theme Generation
- [ ] App generates 3-5 distinct theme variants from each image
- [ ] Each variant produces a valid .ask file that loads without error in Live 12
- [ ] Generated themes correctly apply colors to all mapped parameters
- [ ] Variants are visually distinct from each other

### Swatch Preview
- [ ] Each variant displays as a row of color swatches
- [ ] Key color roles are labeled (e.g., Background, Accent, Text)
- [ ] Swatches are large enough to evaluate colors accurately
- [ ] All variants are visible simultaneously for comparison

### Theme Export
- [ ] User can download any variant as an .ask file
- [ ] User can specify a custom name for the theme
- [ ] Downloaded file is placed in user-specified directory
- [ ] App confirms successful download to user

### Local Library
- [ ] User can save a generated theme to their local library
- [ ] Library persists between app sessions
- [ ] User can browse saved themes in library view
- [ ] User can re-download themes from library
- [ ] User can delete themes from library

### Ableton Theme Directory Integration
- [ ] App auto-detects Ableton Live 12 theme directory on first launch
- [ ] App displays detected directory path to user
- [ ] User can save themes directly to Ableton theme directory with one click
- [ ] Themes saved to directory appear immediately in Live 12 preferences (after refresh)
- [ ] User can modify theme directory path in settings
- [ ] App validates that selected directory exists before saving
- [ ] App handles case where Ableton is not installed (prompts user to set path manually)
- [ ] Custom directory setting persists between app sessions

### General UX
- [ ] App launches within 5 seconds
- [ ] App window is resizable with reasonable minimum dimensions
- [ ] App provides clear feedback during processing (loading states)
- [ ] App handles errors gracefully with user-friendly messages
- [ ] App works offline (no internet connection required)

### Platform Support
- [ ] App runs on macOS (Intel and Apple Silicon)
- [ ] App runs on Windows 10/11
- [ ] App is distributed as a single installer file per platform

---

## Technical Constraints

### Parameter Mapping
- Ableton Live 12 themes contain approximately 275 color parameters
- Each parameter must be mapped to a semantic color role
- Color roles must be documented and validated against default Ableton themes

### Color Extraction
- Must extract enough colors to populate all color roles
- Must handle images with limited color variety (e.g., black and white photos)
- Must ensure text colors have sufficient contrast against backgrounds

### File Format
- Output must be valid .ask file format compatible with Live 12
- Must match structure of default Ableton themes exactly

---

## Success Metrics

### Quantitative
- Number of app downloads
- Number of email signups (if email capture implemented)
- YouTube video views and engagement

### Qualitative
- User feedback on theme quality
- User feedback on ease of use
- Community sharing of generated themes

---

## Monetization Strategy

Primary approach for v1.0: **Free distribution with growth focus**

- Free download to maximize adoption
- Email capture for future product updates
- YouTube video tutorial driving channel growth
- Optional "Buy Me a Coffee" or donation link

Future consideration: Premium features in v2.0 (manual color editing, batch processing, etc.)

---

## Open Questions

1. **Exact number of color roles needed?** Pending completion of parameter mapping analysis.

2. **Variant generation logic?** How exactly should colors be shifted between variants to create meaningful differences?

3. **Handling low-contrast images?** Should the app auto-adjust colors, warn the user, or both?

4. **Theme naming convention?** Should app suggest names based on image filename, or always require user input?

---

## References

- Ableton Live 12 default theme files (source of truth for .ask structure)
- Parameter mapping documentation (in progress)
- Competitor analysis: [existing Live 12 theme creator site]
