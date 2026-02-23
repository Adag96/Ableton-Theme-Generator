# ImageMagnifier Implementation Handoff

## Feature: ABL-61 - Image Magnifier/Loupe for Theme Previews

### Status: Partially Complete - Bug Remaining

---

## What Was Implemented

A reusable `ImageMagnifier` component that shows a 2x magnified loupe on hover over preview images.

### Files Created/Modified

| File | Status |
|------|--------|
| `src/components/ImageMagnifier.tsx` | Created |
| `src/components/ImageMagnifier.css` | Created |
| `src/components/ThemeDetailModal.tsx` | Modified - uses ImageMagnifier |
| `src/components/CommunityThemeDetailModal.tsx` | Modified - uses ImageMagnifier |
| `src/components/CommunityThemeDetailModal.css` | Modified - added container class |

### Current Implementation

```typescript
// ImageMagnifier.tsx - Key approach:
// 1. Renders loupe via React Portal to document.body (escapes modal overflow)
// 2. Uses position: fixed with viewport coordinates
// 3. Gets fresh image bounding rect on every mouse move
// 4. Calculates background-position to show magnified portion
```

---

## What Works

1. **Loupe appears on hover** - Shows 2x magnified view
2. **Portal rendering** - Loupe escapes modal overflow, can extend beyond modal bounds
3. **Background fill** - Grey background (`rgba(120, 120, 130, 0.9)`) fills areas beyond image edges
4. **ThemeDetailModal** - Color markers remain visible (passed as children)
5. **Basic magnification math** - Correct zoom level and background positioning

---

## What Doesn't Work

### BUG: Magnification "Sticks" on Edges (CommunityThemeDetailModal)

**Reproduction:**
1. Open a community theme detail modal
2. Hover over the Ableton preview image
3. Move cursor close to the LEFT, RIGHT, or TOP edge
4. While near that edge, move cursor perpendicular (e.g., at right edge, drag up/down)
5. **Result:** The magnified preview stays frozen/stuck showing the same area
6. **Expected:** Magnified preview should update as cursor moves

**Key observation:** The BOTTOM edge does NOT have this issue - only left, right, and top.

**Hypotheses tested (all failed to fix):**
- Added tolerance to bounds checking
- Used position: fixed instead of absolute
- Switched to Portal rendering
- Getting fresh bounding rect on every mouse move
- Simplified from manual bounds calculation to direct `getBoundingClientRect()`

---

## Technical Context

### CommunityThemeDetailModal Structure

```tsx
// Lines 93-111 in CommunityThemeDetailModal.tsx
<div className="community-modal-image-section">
  {theme.preview_image_url ? (
    <ImageMagnifier
      src={theme.preview_image_url}
      alt={`${theme.name} - Ableton Preview`}
      className="community-modal-preview-container"
    />
  ) : (
    // no preview fallback
  )}
</div>
```

### Relevant CSS

```css
/* CommunityThemeDetailModal.css */
.community-modal-image-section {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.community-modal-preview-container {
  max-width: 100%;
  max-height: 100%;
}

/* ImageMagnifier.css */
.image-magnifier-image {
  display: block;
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}
```

### Current Bounds Detection Logic

```typescript
const handleMouseMove = useCallback(
  (e: React.MouseEvent<HTMLDivElement>) => {
    const img = imageRef.current;
    if (!img) return;

    // Get fresh bounding rect on every move
    const rect = img.getBoundingClientRect();

    // Check if mouse is over the image
    const isOverImage =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (isOverImage) {
      setCursorPos({ clientX: e.clientX, clientY: e.clientY });
      setImageRect(rect);
      setIsHovering(true);
    } else {
      setIsHovering(false);
    }
  },
  []
);
```

---

## Debugging Suggestions

1. **Add console logging** to see if `isOverImage` is intermittently false at edges
2. **Check if `getBoundingClientRect()` returns different values** at edges vs center
3. **Investigate `object-fit: contain`** - the image element's bounding box may be larger than the visible image content, causing edge detection issues
4. **Compare ThemeDetailModal vs CommunityThemeDetailModal** - does the bug occur in both? User only reported it in community modal
5. **Check for CSS differences** between the two modals that might affect image rendering
6. **Test with a simple div instead of image** to isolate if it's image-specific

### Potential Root Cause

The `object-fit: contain` on the image means the `<img>` element's bounding rect includes the letterboxed areas (transparent padding). When the cursor is at the visual edge of the image content but still within the `<img>` element's box, the calculations may be off.

The original implementation tried to account for this with manual bounds calculation, but that had issues too. A proper fix might need to:
1. Calculate actual visible image bounds within the element (accounting for object-fit)
2. Or use a canvas to detect actual image pixels vs transparent areas

---

## Requirements Recap (from original plan)

- **Scope**: Both ThemeDetailModal and CommunityThemeDetailModal
- **Interaction**: Loupe appears ON the image at cursor position
- **Activation**: On hover only
- **Zoom level**: 2x magnification
- **Loupe size**: ~160px
- **Shape**: Rounded rectangle
- **Edge behavior**: User should be able to magnify entire image including edges
- **Color markers**: Remain visible in ThemeDetailModal (not magnified)
