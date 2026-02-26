# ABL-75: Unified Theme Identity System

## Implementation Checklist

- [x] Fix submission: Change `crypto.randomUUID()` to `theme.id` in SubmitThemeModal.tsx
- [x] Add `fromCommunity?: boolean` field to SavedTheme type
- [x] Delete `src/types/community-install-state.ts`
- [x] Delete `src/hooks/useCommunityInstallState.ts`
- [x] Remove community-install-state IPC handlers from `electron/main.ts`
- [x] Remove community-install-state API from `electron/preload.ts`
- [x] Update `src/electron.d.ts` to remove community install state types
- [x] Add `addThemeFromCommunity()` function to `useThemeLibrary` hook
- [x] Refactor `CommunityView.tsx` to use `useThemeLibrary`
- [x] Refactor `LandingView.tsx` to use `useThemeLibrary`
- [x] Refactor `PublicProfileView.tsx` to use `useThemeLibrary`
- [ ] Clean existing community_themes data from Supabase (manual step)
- [ ] Test end-to-end

---

## Notes

The core insight: use local theme ID as the Supabase record ID. This makes the theme library the single source of truth for install state.

## Summary of Changes

### Files Deleted
- `src/types/community-install-state.ts`
- `src/hooks/useCommunityInstallState.ts`

### Files Modified
| File | Change |
|------|--------|
| `src/components/SubmitThemeModal.tsx` | Use `theme.id` instead of `crypto.randomUUID()` |
| `src/types/theme-library.ts` | Added `fromCommunity?: boolean` to SavedTheme |
| `src/hooks/useThemeLibrary.ts` | Added `addThemeFromCommunity()`, `isThemeInstalled()`, `getThemeById()` |
| `src/components/CommunityView.tsx` | Use useThemeLibrary instead of useCommunityInstallState |
| `src/components/LandingView.tsx` | Use useThemeLibrary instead of useCommunityInstallState |
| `src/components/PublicProfileView.tsx` | Use useThemeLibrary instead of useCommunityInstallState |
| `electron/main.ts` | Removed community install state IPC handlers, cleaned unused imports |
| `electron/preload.ts` | Removed community install state API |
| `src/electron.d.ts` | Removed community install state types |
