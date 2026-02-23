# Feature Overview

This document describes how each feature in the theme generator works from a technical perspective. It serves as a reference for understanding the behavior and decision logic behind the application.

---

## Table of Contents

### Theme Creation
1. [Image Import](#image-import)
2. [Random Theme Generation](#random-theme-generation)
3. [Tone Selection](#tone-selection)
4. [Contrast Level](#contrast-level)
5. [Surface Style (Variant Mode)](#surface-style-variant-mode)
6. [Color Extraction](#color-extraction)
7. [Post-Generation Color Editing](#post-generation-color-editing)
8. [Mood Sliders](#mood-sliders)
9. [Theme Generation Pipeline](#theme-generation-pipeline)

### Theme Management
10. [Theme Library](#theme-library)
11. [Theme Detail Modal](#theme-detail-modal)
12. [Install / Uninstall](#install--uninstall)

### Community
13. [Community Gallery](#community-gallery)
14. [Featured Themes Carousel](#featured-themes-carousel)
15. [Public Creator Profiles](#public-creator-profiles)

### User Account
16. [Authentication](#authentication)
17. [User Profile Management](#user-profile-management)
18. [Settings](#settings)

### Application
19. [Dark Mode](#dark-mode)
20. [Image Magnifier](#image-magnifier)

---

## Image Import

**Location:** `src/components/ImageImportView.tsx`

Users can import an image via drag-and-drop or file browser dialog. Supported formats: PNG, JPG, JPEG.

### Flow

1. User drops or selects an image file
2. Image is loaded as a data URL for preview display
3. User configures theme options (tone, contrast, surface style)
4. Color extraction runs automatically when tone is selected
5. User can refine palette via color editing and mood sliders
6. User reviews final palette and generates theme

---

## Random Theme Generation

**Location:** `src/theme/random-palette.ts`, `src/components/ImageImportView.tsx`

An alternative to image-based generation. Users click "I'm Feeling Lucky" on the initial import screen to generate a random harmonious palette without uploading an image.

### How It Works

1. A random base hue (0-360) is selected
2. A color harmony type is randomly chosen: complementary, analogous, triadic, or split-complementary
3. Hue offsets are calculated from the harmony type
4. Colors are assigned to semantic roles with calibrated lightness/saturation for the selected tone:
   - **Surface:** Base hue, low saturation (10-30%), tone-appropriate lightness
   - **Text:** Base hue, near-achromatic, high contrast against surface
   - **Accent 1:** Harmony hue with high saturation (55-85%)
   - **Accent 2:** Another harmony hue or offset from accent 1

### User Flow

- "I'm Feeling Lucky" appears below the drop zone on the initial screen
- Clicking generates a palette and transitions to the confirmation view
- "Re-roll" button regenerates a new random palette
- "Use Image Instead" returns to the image import screen
- Color editing and mood sliders work the same as with image-generated palettes

---

## Tone Selection

**Location:** `src/components/ImageImportView.tsx`, `src/extraction/palette-selection.ts`

The tone selection determines whether the generated theme will be a dark or light theme. This is a required step — extraction does not run until a tone is selected.

### How Tone Affects the Pipeline

The tone preference controls how the `surface_base` color is synthesized:

| Tone | Surface Lightness | Text Lightness Range |
|------|-------------------|---------------------|
| **Dark** | ~22% | 68-82% |
| **Light** | ~80% | 10-22% |

The surface color is **synthesized** from the image's dominant hue (saturation-weighted circular mean) rather than directly extracted from pixels. This decouples "what hue is the image" from "does the image have dark/light pixels" and produces consistent results regardless of image brightness.

---

## Contrast Level

**Location:** `src/components/ImageImportView.tsx`, `src/theme/types.ts`, `src/theme/derivation.ts`

Controls the lightness spread between surface colors in the generated theme.

### Options

| Level | Multiplier | Effect |
|-------|-----------|--------|
| **Low** | 1.0x | Subtle surface differentiation (Ableton default style) |
| **Medium** | 1.4x | Moderate contrast boost (default) |
| **High** | 1.8x | Noticeable contrast boost |
| **Max** | 2.2x | Maximum differentiation between surfaces |

The multiplier is applied to all lightness offsets during role resolution — the gap between `surface_base`, `surface_highlight`, `surface_border`, `detail_bg`, and `control_bg` scales proportionally.

---

## Surface Style (Variant Mode)

**Location:** `src/components/ImageImportView.tsx`, `src/extraction/palette-selection.ts`

Controls how saturated the synthesized surface color is. Only shown for image-based generation.

### Options

| Mode | Surface Saturation | Effect |
|------|-------------------|--------|
| **Transparent** | 20% (dark) / 25% (light) | Subtle hue tint — professional, clearly image-related |
| **Vibrant** | 55% | Bold, dramatically colored surfaces |

Changing the variant mode re-triggers color extraction since the surface color changes, which affects text contrast selection and the overall palette balance.

---

## Color Extraction

**Location:** `src/extraction/color-extraction.ts`, `src/extraction/palette-selection.ts`

Color extraction analyzes the imported image to identify key colors for theme generation.

### Extraction Pipeline

```
Image → Canvas Downscale → Quantization → Median Cut → Saturation Outlier Detection → Palette Selection
```

### Step 1: Canvas Downscaling

The image is drawn onto a canvas, scaled down to a maximum dimension of 400px. This improves performance without significantly affecting color accuracy. Transparent pixels (alpha < 128) are skipped.

### Step 2: Quantization

Pixels are quantized to 5 bits per channel (32 levels per channel = 32,768 possible colors). Each quantized color stores its first representative pixel's (x, y) position for location tracking.

### Step 3: Median Cut Clustering

The quantized color space is recursively split into 16 buckets by splitting along the channel with the largest range at each bucket's median. Each bucket is averaged to produce a representative color. Location is inherited from the most-populous color entry in each bucket.

### Step 4: Saturation Outlier Detection

Vibrant colors that median cut might miss (because they're rare but visually important) are rescued:

- Find colors with saturation >= 50% that aren't well-captured by existing buckets
- "Well-captured" = within 30 degrees hue and 20% saturation of any bucket average
- Add up to 3 outlier buckets, scored by `saturation * log(population)`
- Outliers must be >= 30 degrees apart from each other for hue diversity

### Step 5: Palette Selection

From the 16-19 extracted colors, semantic roles are assigned:

| Role | Selection Logic |
|------|-----------------|
| `surface_base` | **Synthesized** at the image's dominant hue (saturation-weighted circular mean), with calibrated lightness and saturation for the selected tone and variant mode |
| `text_primary` | First color with contrast ratio >= 4.5 (WCAG AA) against surface. Excludes colors too similar to surface (< 30 degrees hue, < 20% lightness). Fallback: white (dark) or #121212 (light) |
| `accent_primary` | Most saturated color (>= 35%). Scored by `saturation + harmony_bonus * 0.5` where harmony bonus peaks at 150 degrees from surface (split-complementary) |
| `accent_secondary` | Next saturated color with >= 60 degrees hue distance from primary. Scored by `hue_distance + harmony_bonus`. Fallback: synthetic color at complementary hue (180 degrees) |

### Output

The extraction produces a `PaletteSelectionResult` containing:
- The 5 semantic color roles (tone, surface_base, text_primary, accent_primary, accent_secondary)
- Location markers showing where each color was sampled on the image (undefined for synthesized/fallback colors)
- All extracted colors for debugging
- Debug info (contrast ratios, saturation values, hue distances)

---

## Post-Generation Color Editing

**Location:** `src/components/ImageImportView.tsx`, `src/components/ColorPickerPopover.tsx`

After color extraction (or random generation), users can click any of the 4 color swatches to open a color picker and swap that color.

### How It Works

1. Swatches become clickable after extraction completes
2. Clicking a swatch opens a `ColorPickerPopover` positioned above it, initialized to the current value
3. The picker uses `react-colorful` (HexColorPicker) with a manual hex input field
4. Changes apply immediately — the effective palette updates in real-time
5. Overridden swatches show a dashed border and accent dot indicator
6. "Reset Colors" link appears when any override is active
7. Color markers on the image are hidden for overridden roles (they no longer correspond to image positions)

### Architecture

Color overrides are stored as a `Partial<Record<ColorRole, string>>` in component state. The `effectivePalette` is computed via `useMemo`:
1. Start with base palette (from extraction or random generation)
2. Apply color overrides
3. Apply mood slider adjustments (if any)

The effective palette feeds into `onContinue()` which passes it to the derivation pipeline. No changes to the derivation engine are needed.

---

## Mood Sliders

**Location:** `src/components/ImageImportView.tsx`

Three sliders that shift the entire palette's mood. These operate on the resolved semantic colors before derivation.

### Sliders

| Slider | Range | Effect at ±100 |
|--------|-------|-----------------|
| **Warmth** | -100 to +100 | Shifts all hues ±20 degrees toward warm (orange) or cool (blue) |
| **Saturation** | -100 to +100 | Scales all saturations by ±50% of their current value |
| **Brightness** | -100 to +100 | Shifts all lightness values ±15 |

### How It Works

1. Sliders appear below the palette swatches after extraction completes
2. Adjustments apply to all 4 role colors simultaneously via HSL manipulation
3. Changes are instant — no debounce needed since it's pure math
4. "Reset" link appears when any slider is non-zero
5. Mood adjustments compose with color overrides: overrides apply first, then mood shifts layer on top

---

## Theme Generation Pipeline

**Location:** `src/theme/derivation.ts`, `src/theme/ask-generator.ts`

Converts 5 input colors into a complete Ableton Live 12 theme file (.ask).

### Pipeline

```
5 Input Colors → 12 Resolved Roles → 13-stop Neutral Scale → 236 Parameters → .ask XML
```

For complete details, see [Semantic Color Roles Specification.md](./Semantic%20Color%20Roles%20Specification.md).

### Steps

1. **Role Resolution** (`resolveRoles`): The 5 required colors + contrast level are expanded to 12 semantic roles. Derived roles include surface_highlight, surface_border, detail_bg, control_bg, text_secondary, selection_bg, and selection_fg.
2. **Contrast Adjustment** (`adjustForContrast`): Binary search adjusts lightness values to meet WCAG contrast thresholds while preserving color identity.
3. **Neutral Scale** (`buildNeutralScale`): A 13-stop lightness ramp (n0-n12) is built from three anchors (control_bg, surface_base, text_primary), preserving the surface hue tinting for tonal cohesion.
4. **Parameter Generation** (`generateParameters`): Each of the 236 .ask color parameters is mapped from roles, scale stops, or fixed semantic values.
5. **Blend Factors & VU Meters**: Tone-specific numeric factors (40+) and fixed VU meter gradients (7 types) are added.
6. **XML Generation** (`generateAskXml`): Everything is formatted into Ableton's .ask XML format with proper headers and canonical parameter ordering.

---

## Theme Library

**Location:** `src/hooks/useThemeLibrary.ts`, `src/components/MyThemesView.tsx`

Generated themes are saved to a local library for browsing and management.

### Storage

Theme .ask files are saved to the Ableton themes directory. Library metadata (name, creation date, preview image, colors, tone, contrast level, role locations) is stored separately in the application's user data directory.

### Features

- **Browse**: View all saved themes with visual previews, organized into "Installed" and "Available" sections
- **Filter by tone**: All, Dark, or Light (persists to localStorage)
- **Sort**: Recent, Oldest, A-Z, Z-A (persists to localStorage)
- **Rename**: Inline editing in the detail modal
- **Download**: Export a copy of the .ask file to the Downloads folder
- **Delete**: Remove theme from library with confirmation dialog
- **Share**: Submit to community gallery (requires authentication)

---

## Theme Detail Modal

**Location:** `src/components/ThemeDetailModal.tsx`

Full-screen overlay showing detailed information about a saved theme.

### Contents

- **Preview image** with color location markers and hover magnification (ImageMagnifier)
- **Theme name** (click to edit inline)
- **Badges**: Tone (Dark/Light), contrast level, install status
- **Color swatches**: Surface, Text, Accent 1, Accent 2
- **Actions**: Download, Install/Uninstall, Share, Delete

### Behaviors

- Name editing validates against empty strings and requires a change from the original
- Uninstall button changes on hover: checkmark icon + "Installed" becomes X icon + "Uninstall"
- Delete shows a confirmation dialog (different message if theme is currently installed)
- ESC key closes sub-dialogs first (delete confirm > edit mode > modal)

---

## Install / Uninstall

**Location:** `src/hooks/useCommunityInstallState.ts`, Electron main process

Themes can be installed to or uninstalled from Ableton's themes directory.

### Install

For locally generated themes, the .ask file is written directly to the Ableton themes directory at creation time. For community themes, clicking "Install" downloads the .ask file from Supabase Storage and writes it to the themes directory via Electron IPC.

### Uninstall

Deletes the .ask file from the Ableton themes directory. The library metadata is preserved so the theme can be re-installed later.

### Install State Tracking (Community Themes)

Community theme install state is tracked via `useCommunityInstallState`:
- Persists to disk via Electron IPC (`saveCommunityInstallState` / `loadCommunityInstallState`)
- State format: `{version: 1, themes: [{themeId, filePath, installedAt}]}`
- On app mount, syncs with filesystem — verifies files still exist and removes stale entries
- Methods: `isInstalled()`, `getFilePath()`, `markInstalled()`, `markUninstalled()`

---

## Community Gallery

**Location:** `src/components/CommunityView.tsx`, `src/lib/supabase.ts`, `src/hooks/useAuth.tsx`

The Community Gallery allows users to browse themes created by others, submit their own themes for review, and install community themes directly into Ableton.

### Backend: Supabase

All community data lives in [Supabase](https://supabase.com), a hosted Postgres database with built-in auth and file storage. The app uses three Supabase services:

| Service | Purpose |
|---------|---------|
| **Auth** | Email/password accounts. Sessions persist via localStorage in the renderer process. |
| **Database** | Two tables: `profiles` (user display names, bio, social links) and `community_themes` (theme metadata, status, file URLs). |
| **Storage** | Two public buckets: `theme-files` (uploaded `.ask` files) and `theme-previews` (Ableton screenshots added by the developer during review). |

The Supabase client runs entirely in the Electron renderer process. Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are injected by Vite at build time via `.env`.

### Database Schema

```
profiles
  id              uuid  (matches auth.users.id)
  display_name    text
  bio             text
  social_links    jsonb  { soundcloud, bandcamp, instagram, website }

community_themes
  id              uuid
  user_id         uuid  (references auth.users)
  name            text
  description     text
  status          enum  'pending' | 'approved' | 'rejected'
  ask_file_url    text  (Supabase Storage public URL)
  preview_image_url text (Ableton screenshot, added by admin)
  swatch_colors   jsonb (hex color array for fallback display)
  download_count  integer
  created_at      timestamptz
  approved_at     timestamptz
  rejection_reason text
```

### Row-Level Security

The database uses Postgres RLS policies so the anon key is safe to ship in the app:

- `profiles` — anyone can read; users can only insert/update their own row
- `community_themes` — anyone can read `approved` rows; authenticated users can insert; users can read their own `pending` and `rejected` rows

### Submit Flow

1. User clicks "Share" on a theme in the detail modal
2. If not signed in, `AuthModal` opens first; on success, `SubmitThemeModal` opens
3. User edits name and optional description, then submits
4. The app reads the `.ask` file from disk via Electron IPC (`readThemeFileAsText`)
5. The file is uploaded to Supabase Storage at `theme-files/{userId}/{themeId}.ask`
6. A `community_themes` row is inserted with `status: 'pending'`
7. A Supabase Database Webhook triggers the `notify-submission` Edge Function, which sends an email to the developer via Resend

### Approval Workflow (Manual)

No admin UI exists. The developer:

1. Receives an email notification on each submission
2. Opens the Supabase dashboard → Table Editor → `community_themes`
3. Downloads the `.ask` file, loads it in Ableton, takes a screenshot
4. Uploads the screenshot to `theme-previews/previews/{themeId}.png`
5. Updates the row: sets `status = 'approved'`, `preview_image_url`, and `approved_at`

The theme appears in the gallery immediately after approval.

### Gallery / Install Flow

1. `CommunityView` fetches all rows where `status = 'approved'` from Supabase on mount
2. Each card shows the Ableton screenshot (if present) or a 2x2 swatch grid fallback
3. Clicking "Install" calls `window.electronAPI.downloadCommunityTheme({ url, name })`
4. The main process fetches the `.ask` file via HTTP and writes it to the Ableton themes directory
5. The `increment_download_count` database function is called to update the count atomically

### Gallery Card States

| State | Preview shown |
|-------|--------------|
| `approved` with screenshot | Ableton screenshot |
| `approved` without screenshot | 2x2 color swatch grid |
| `pending` (My Submissions tab only) | 2x2 color swatch grid + "Under Review" badge |
| `rejected` (My Submissions tab only) | 2x2 color swatch grid + "Not Approved" badge |

---

## Featured Themes Carousel

**Location:** `src/components/LandingView.tsx`

The landing page displays a horizontally scrolling carousel of the most recently approved community themes.

### How It Works

- Fetches up to 15 approved themes from Supabase, sorted by `approved_at` descending
- Displays 4 themes at a time with navigation arrows
- Auto-rotates every 3 seconds; pauses on hover
- Each card shows the preview image (or swatch fallback), creator name (clickable link to profile), and download count
- Install/Uninstall button with hover state change
- Clicking a theme card opens the community theme detail modal

### Edge Cases

- If fewer than 4 themes exist, navigation arrows are hidden
- Loading state shows a spinner; empty state shows "Community themes coming soon"

---

## Public Creator Profiles

**Location:** `src/components/PublicProfileView.tsx`

View another user's profile and all their approved themes.

### Contents

- Avatar icon, display name, bio
- Social media links (clickable icons for each platform)
- Grid of all approved themes by this creator
- Install/uninstall buttons on each theme card
- Click any theme to open detail modal

### Data Fetching

- Profile: `SELECT * FROM profiles WHERE id = userId`
- Themes: `SELECT * FROM community_themes WHERE user_id = userId AND status = 'approved' ORDER BY approved_at DESC`

---

## Authentication

**Location:** `src/hooks/useAuth.tsx`, `src/components/AuthModal.tsx`

Email/password authentication via Supabase Auth.

### Flow

1. User clicks "Sign In" in the Community view or "Share" on a theme card
2. `AuthModal` opens — toggles between sign-in and sign-up modes
3. On sign-up: Supabase creates the auth user, then the app inserts a `profiles` row with the user's display name
4. Session is stored automatically by the Supabase JS client and restored on next app launch
5. Password reset is handled by Supabase via email

---

## User Profile Management

**Location:** `src/components/UserProfileView.tsx`

Authenticated users can edit their public profile.

### Fields

- **Display Name** (required, max 50 characters)
- **Bio** (optional, max 200 characters with live counter)
- **Social Links** (up to 4, dynamically add/remove)

### Behaviors

- Social link URLs auto-prefix `https://` if no protocol is specified
- Available platforms are filtered to exclude already-added ones
- Save button is disabled if no changes detected, bio exceeds limit, or save is in progress
- Success message appears for 3 seconds after saving
- Change detection compares current form state against the loaded profile
- Sign Out button at the bottom of the view

---

## Settings

**Location:** `src/components/SettingsView.tsx`

Application settings and Ableton integration management.

### Account Section

- Current email display with inline change form
- Email preferences modal
- Email validation and confirmation flow (Supabase sends confirmation to the new address)

### Ableton Themes Directory

- Auto-detects Ableton Live 12 installation path on mount
- Displays detected path (clickable — opens in Finder)
- Lists all installed .ask theme files with count
- Delete button for app-generated themes (identified by `createdByApp` flag)
- Error state if Ableton is not found, with hint to check installation

---

## Dark Mode

**Location:** `src/hooks/useAppTheme.tsx`

App-wide light/dark theme toggle.

### Behavior

1. On first load, respects the system preference via `window.matchMedia('(prefers-color-scheme: dark)')`
2. User can manually toggle between light and dark (stored in localStorage as `app-theme-mode`)
3. Once a manual preference is set, system preference changes are ignored
4. Theme is applied via a `data-theme` attribute on the document root

---

## Image Magnifier

**Location:** `src/components/ImageMagnifier.tsx`

Hover-activated magnification loupe for previewing theme detail images.

### How It Works

- Hovering over a preview image reveals a circular loupe (160px diameter, 2x magnification by default)
- The loupe follows the cursor and shows the magnified section underneath
- Accounts for `object-fit: contain` by calculating the actual rendered image bounds (not the element bounding rect)
- Rendered via a portal to `document.body` to avoid overflow clipping from parent containers
- Supports wrapping children (e.g., color markers) that render on top of the image

### Used In

- Theme detail modal (`ThemeDetailModal.tsx`)
- Community theme detail modal (`CommunityThemeDetailModal.tsx`)

---

## File Reference

| Feature | Key Files |
|---------|-----------|
| Image Import | `src/components/ImageImportView.tsx`, `src/components/ImageImportView.css` |
| Random Generation | `src/theme/random-palette.ts` |
| Color Editing | `src/components/ColorPickerPopover.tsx`, `src/components/ColorPickerPopover.css` |
| Color Extraction | `src/extraction/color-extraction.ts`, `src/extraction/palette-selection.ts` |
| Theme Generation | `src/theme/derivation.ts`, `src/theme/ask-generator.ts`, `src/theme/color-utils.ts` |
| Type Definitions | `src/theme/types.ts`, `src/extraction/types.ts` |
| Extraction Hook | `src/hooks/useColorExtraction.ts` |
| Theme Library | `src/hooks/useThemeLibrary.ts`, `src/components/MyThemesView.tsx` |
| Theme Detail | `src/components/ThemeDetailModal.tsx` |
| Install State | `src/hooks/useCommunityInstallState.ts` |
| Community Gallery | `src/components/CommunityView.tsx`, `src/components/CommunityThemeCard.tsx`, `src/components/CommunityThemeDetailModal.tsx` |
| Featured Carousel | `src/components/LandingView.tsx` |
| Public Profiles | `src/components/PublicProfileView.tsx` |
| Auth | `src/hooks/useAuth.tsx`, `src/components/AuthModal.tsx`, `src/lib/supabase.ts` |
| User Profile | `src/components/UserProfileView.tsx` |
| Settings | `src/components/SettingsView.tsx` |
| Dark Mode | `src/hooks/useAppTheme.tsx` |
| Image Magnifier | `src/components/ImageMagnifier.tsx` |
| Submit Theme | `src/components/SubmitThemeModal.tsx` |
| Backend | `supabase/migrations/001_community.sql`, `supabase/functions/notify-submission/index.ts` |
