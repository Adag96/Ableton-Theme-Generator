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

### 2026-02-18 | Workflow | Asana ticket lookup by custom field ID

**What happened**: User provided ticket ID "ABL-12" (stored in a custom field). I used `asana_typeahead_search` which only searches task names — returned nothing.

**Root cause**: Typeahead search is name-only. Custom field values require full-text search.

**Rule**: When looking up Asana tickets by a custom field ID (like "ABL-12"), use `asana_search_tasks` with the `text` parameter, not `asana_typeahead_search`. 
