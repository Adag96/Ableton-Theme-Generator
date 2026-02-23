# Distribution Plan

> **Asana ticket**: ABL-63
> **Date**: 2026-02-23

---

## First Release Checklist: v1.0.0

This is a step-by-step guide for shipping the very first public release. It assumes:
- The repo is already public on GitHub
- You have a release candidate build that works on macOS
- Nothing has been configured for distribution yet

---

### Phase 1: Pre-Flight Checks

**1.1 — Audit the repo for anything that shouldn't be public**

Before doing anything else, check that the public repo doesn't contain secrets or embarrassing artifacts.

- [ ] Search for hardcoded secrets: `git log -p | grep -i "supabase\|api_key\|secret\|password"` — if anything shows up, rotate those keys immediately (they're compromised regardless of what you do with git history)
- [ ] Confirm `.env` is in `.gitignore` and was never committed
- [ ] Skim recent commit messages for anything you wouldn't want visible
- [ ] Check that `Claude/` directory is in `.gitignore` (internal dev notes)

**1.2 — Verify the build works**

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` completes without errors
- [ ] Open the built app from `release/` and smoke test: launch, upload image, generate theme, export `.ask` file

---

### Phase 2: Prepare the Build Configuration

**2.1 — Create the `resources/` directory**

The build config already references `resources/icon.icns` but the directory doesn't exist yet.

- [ ] Create `resources/` at the project root
- [ ] Add `icon.icns` — macOS app icon (generate from a 1024x1024 PNG using `iconutil` or an online converter)
- [ ] Add `icon.ico` — Windows app icon (generate from the same source PNG; use an online ICO converter or `png2ico`)
- [ ] Add `icon.png` — 512x512+ source PNG (used as fallback by electron-builder)

**2.2 — Update `package.json` version**

Change the version from `0.0.1` to `1.0.0`:

```json
"version": "1.0.0",
```

**2.3 — Remove `"private": true`**

This flag prevents `npm publish` (which we don't need), but more importantly it signals the package is not distributable. Remove it:

```json
// Remove this line:
"private": true,
```

**2.4 — Add Windows build target**

Add a `win` block to the `"build"` section in `package.json`, alongside the existing `mac` block:

```json
"win": {
  "target": ["nsis", "zip"],
  "icon": "resources/icon.ico"
}
```

**2.5 — Add publish config**

Add to the `"build"` section in `package.json`:

```json
"publish": [{
  "provider": "github",
  "owner": "<your-github-username>",
  "repo": "<your-repo-name>"
}]
```

Replace the placeholders with your actual GitHub username and repo name. This tells `electron-updater` where to check for updates in future versions.

**2.6 — Add build scripts**

Add these to the `"scripts"` section in `package.json`:

```json
"build:mac": "vite build && electron-builder --mac",
"build:win": "vite build && electron-builder --win",
"build:all": "vite build && electron-builder --mac --win"
```

The existing `"build"` script can stay as-is or be updated to match `build:mac`.

> **Note**: You can cross-compile Windows builds from macOS. No Windows machine needed.

**2.7 — Build for all platforms**

- [ ] Run `npm run build:all`
- [ ] Verify the `release/` directory contains:
  - macOS: `Live 12 Theme Generator-1.0.0.dmg`, `Live 12 Theme Generator-1.0.0-mac.zip`, `latest-mac.yml`
  - Windows: `Live 12 Theme Generator Setup 1.0.0.exe`, `Live 12 Theme Generator-1.0.0-win.zip`, `latest.yml`

> The exact filenames may vary slightly based on electron-builder's naming conventions. The `.yml` files are auto-generated and required for the auto-updater to work in future versions.

---

### Phase 3: Implement the Auto-Updater (ABL-44)

The auto-updater **must ship in v1.0.0** so that every user who installs the app can be notified of future updates from day one. Without it, you'd have no way to reach v1.0.0 users when v1.1.0 comes out.

**3.1 — Install electron-updater**

```bash
npm install electron-updater
```

**3.2 — Add update checking to the main process**

Add to `electron/main.ts`:

```typescript
import { autoUpdater } from 'electron-updater';

// After mainWindow is created:
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-status', { status: 'available', version: info.version });
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update-status', { status: 'downloading', percent: progress.percent });
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-status', { status: 'ready', version: info.version });
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err.message);
});

// Check on launch (short delay to not block startup)
app.whenReady().then(() => {
  setTimeout(() => autoUpdater.checkForUpdates(), 3000);
});
```

Add an IPC handler for triggering install:

```typescript
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});
```

**3.3 — Expose IPC in preload**

Expose the update channel through whatever preload/contextBridge pattern the app already uses.

**3.4 — Build a notification component in the renderer**

A toast or banner with these states:

| State | What to show | User action |
|-------|-------------|-------------|
| Downloading | "Downloading update v1.1.0..." | Dismiss |
| Ready | "Update ready. Restart to apply." | "Restart" or "Later" |

If the user clicks "Later", the update installs silently on next quit.

**3.5 — Verify**

- [ ] App launches without errors (the updater will find no updates and do nothing — that's correct)
- [ ] No console errors related to electron-updater
- [ ] Rebuild: `npm run build:all` and confirm artifacts still generate correctly

> This code is inert until a v1.1.0+ release exists on GitHub Releases. It's safe to ship in v1.0.0.

---

### Phase 4: Write the README

Replace the repo's README with a user-facing document. This is the first thing anyone sees when they visit the repo.

**What to include:**

- [ ] App name and one-line description
- [ ] 1-2 screenshots or a GIF showing the app in action
- [ ] Download section with links to the latest release (use `https://github.com/<owner>/<repo>/releases/latest`)
- [ ] Installation instructions for macOS (including the unsigned app workaround — see below)
- [ ] Installation instructions for Windows (including the SmartScreen workaround — see below)
- [ ] Brief feature list
- [ ] Credit/links (your YouTube, newsletter, etc.)

**Unsigned app instructions to include in the README:**

For macOS:
> 1. Download the `.dmg` file from the latest release
> 2. Open the `.dmg` and drag the app to your Applications folder
> 3. **Important — first launch only**: Right-click the app, select "Open", then click "Open" in the dialog. macOS requires this for apps from independent developers. After the first time, it opens normally.

For Windows:
> 1. Download the `.exe` installer from the latest release
> 2. Run the installer. If Windows SmartScreen appears, click "More info" then "Run anyway"
> 3. Follow the installer prompts

---

### Phase 5: Commit, Tag, and Push

- [ ] Stage all changes: the `resources/` directory, updated `package.json`, and new `README.md`
- [ ] Commit: `git commit -m "Prepare v1.0.0 release"`
- [ ] Tag: `git tag v1.0.0`
- [ ] Push: `git push && git push --tags`

---

### Phase 6: Create the GitHub Release

**5.1 — Go to GitHub Releases**

Navigate to your repo on GitHub → "Releases" (right sidebar) → "Draft a new release"

**5.2 — Fill in the release form**

| Field | Value |
|-------|-------|
| **Tag** | Choose existing tag `v1.0.0` |
| **Release title** | `v1.0.0` |
| **Description** | See template below |

**Release description template:**

```markdown
## Live 12 Theme Generator v1.0.0

Generate custom Ableton Live 12 themes from any image.

### Downloads

| Platform | File |
|----------|------|
| macOS | `Live 12 Theme Generator-1.0.0.dmg` |
| Windows | `Live 12 Theme Generator Setup 1.0.0.exe` |

### Installation

**macOS**: Open the `.dmg`, drag to Applications. On first launch, right-click the app → Open → click "Open" in the dialog.

**Windows**: Run the `.exe` installer. If SmartScreen appears, click "More info" → "Run anyway".

### What's included
- [List your key features here]
- [e.g., Upload any image to generate a theme]
- [e.g., Multiple theme variants per image]
- [e.g., Direct export to Ableton's Themes folder]
```

**5.3 — Upload the build artifacts**

Drag and drop these files from your `release/` directory into the release assets area:

- [ ] `Live 12 Theme Generator-1.0.0.dmg` — macOS installer
- [ ] `Live 12 Theme Generator-1.0.0-mac.zip` — macOS zip (needed for auto-updater)
- [ ] `latest-mac.yml` — macOS update manifest (needed for auto-updater)
- [ ] `Live 12 Theme Generator Setup 1.0.0.exe` — Windows installer
- [ ] `Live 12 Theme Generator-1.0.0-win.zip` — Windows zip
- [ ] `latest.yml` — Windows update manifest (needed for auto-updater)

> Upload ALL of these, not just the installers. The `.yml` files and `.zip` files are required for the auto-updater to function in future releases.

**5.4 — Publish**

- [ ] Click "Publish release"

---

### Phase 7: Verify

- [ ] Visit the release page in an incognito browser window
- [ ] Click the `.dmg` download link — confirm it downloads
- [ ] Click the `.exe` download link — confirm it downloads
- [ ] Verify the README download link (`/releases/latest`) resolves to this release
- [ ] Install from the downloaded `.dmg` on your own machine (delete the dev version first) and confirm it works
- [ ] If you have access to a Windows machine or VM, test the `.exe` installer

---

## Reference: Unsigned App Workarounds

### macOS — Gatekeeper warning

The app is not code-signed, so macOS will block it on first launch. The workaround:

1. Right-click (or Control-click) the app in Finder
2. Select "Open" from the context menu
3. Click "Open" in the dialog

This only needs to be done once. Alternatively: `xattr -cr "/Applications/Live 12 Theme Generator.app"`

### Windows — SmartScreen warning

The app is not code-signed, so Windows SmartScreen will show a warning. The workaround:

1. Click "More info" on the SmartScreen dialog
2. Click "Run anyway"

### Why unsigned?

macOS code signing requires an Apple Developer account ($99/year). Windows code signing certificates cost $200-400/year. For a free app in the audience-growth phase, the cost isn't justified. This can be revisited when the user base grows.

---

## Reference: What to Do for Future Releases (v1.1.0+)

Once v1.0.0 is out, subsequent releases follow a shorter process:

1. Bump version in `package.json` (e.g., `1.0.0` → `1.1.0`)
2. Commit and tag: `git commit -m "Bump to v1.1.0"` → `git tag v1.1.0` → push
3. Build: `npm run build:all`
4. Create GitHub Release from the new tag
5. Upload all artifacts (same files as above, with new version numbers)
6. Write release notes describing what changed
7. Publish

If the auto-updater has been implemented (see below), existing users will be notified automatically.

---

## Reference: How the Auto-Updater Works

The auto-updater is implemented in Phase 3 and ships with v1.0.0. Here's how the pieces connect:

1. The `publish` config in `package.json` (Phase 2.5) serves double duty:
   - **At build time**: electron-builder generates `.yml` manifests pointing to your GitHub repo
   - **At runtime**: electron-updater reads it to know where to check for updates
2. On app launch, `electron-updater` fetches `latest-mac.yml` / `latest.yml` from your GitHub Releases
3. If a newer version exists, it downloads the `.zip` (not the `.dmg`/`.exe`) in the background
4. The notification component shows "Update ready. Restart to apply."
5. User clicks Restart, or the update installs silently on next quit

This is why the `.yml` files and `.zip` files must be uploaded to every release — the updater needs them.

---

## Reference: Future Considerations

| Item | When to do it | Why |
|------|--------------|-----|
| **GitHub Actions CI/CD** | When manual builds become tedious | Auto-build on tag push, upload to draft release |
| **macOS code signing** | When Gatekeeper complaints grow | $99/year Apple Developer account |
| **Windows code signing** | When SmartScreen complaints grow | $200-400/year certificate |
| **Landing page** | When ready for broader distribution | Branded download page on lonebodymusic.com |
| **Linux support** | If there's demand | Add `linux` target to electron-builder config |

---

## Reference: Monetization Path

Nothing in this distribution plan locks you into free-only. If/when you decide to charge:

- **License key model (perpetual purchase)**: Sell keys through a storefront like Gumroad or Lemonsqueezy. Add a license activation screen to the app that validates the key via the storefront's API. Distribution stays the same — anyone can download from GitHub Releases, but the app requires a valid key to unlock.
- **Subscription model (Patreon, etc.)**: Similar, but the app periodically checks subscription status against Patreon's API or your Supabase backend. Lapsed subscriptions revert to a free tier.
- **Free + premium tier**: Keep the theme generator free (audience growth), gate new features like the Project Analyzer behind the license check. One binary, features unlocked by payment status.

When you monetize, you'd likely want to **make the source repo private** and point the `publish` config at a separate public releases-only repo. This is a small config change, not a rearchitecture. You'd also want to invest in code signing at that point — paying users shouldn't have to fight OS security warnings.
