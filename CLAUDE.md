# Ableton Live 12 Theme Generator

## System Map — Read First

Before substantive work in this repo, read **`~/.claude/System Map.md`** — it documents Adam's cross-project information architecture (repo vs vault placement rules, folder conventions, cross-reference patterns, audit process). Ableton Theme Generator participates in that system as a Tier 1 product repo; its corresponding Tier 2 docs (Product Brief, Development Roadmap, Distribution Plan, research artifacts) live in the Development vault under `PRODUCTS/APPLICATIONS/ABLETON THEME GENERATOR/`.

## Overview

Desktop application that generates custom Ableton Live 12 themes from images. Users upload an image, the app extracts colors, generates theme variants, and exports `.ask` theme files. Also includes a community gallery for browsing, sharing, and installing themes made by others.

For product-level context (vision, features, target users, current scope), see the **Product Brief in the Development vault** (path below).

## Tech Stack

- **Electron** — desktop app shell
- **Vite + React + TypeScript** — UI
- **Supabase** — auth, Postgres database, file storage (community gallery)
- **Resend** — email notifications for theme submissions

Theme generation logic runs in TypeScript inside the Electron renderer — no Python, no external services in the generation path.

## Documentation Index (in this repo)

Implementation reference that ships with the code:

| Document | Path | Purpose |
|----------|------|---------|
| Feature Overview | `Documentation/Feature Overview.md` | Technical reference for every feature (file paths, pipeline steps, component behavior) |
| Semantic Color Roles Specification | `Documentation/Semantic Color Roles Specification.md` | The color model the engine implements — derivation rules, contrast, generation versioning |
| Parameter Control Mapping | `Documentation/Parameter Control Mapping.md` | Lookup: each `.ask` parameter → which UI controls it affects in Ableton |
| Image-to-Theme Generation Research | `Documentation/Image-to-Theme Generation Research.md` | Active research + implementation log for the Color Variety work |
| Backend Setup Guide | `Documentation/Backend Setup Guide.md` | Step-by-step Supabase configuration for the Community Gallery |
| Work Log | `Documentation/Work Log.md` | Chronological session journal (read-only — see Prohibited Changes below) |
| Claude Lessons | `Claude/Claude-Lessons.md` | Patterns learned from corrections (project-specific only) |
| Todo | `Claude/todo.md` | In-flight task tracking for the current session |

## External Documentation (outside this repo)

Product-level planning, execution state, and decision logs live in the Development Obsidian vault:

- **Location:** `~/Developer/Obsidian-Notes/Development/PRODUCTS/APPLICATIONS/ABLETON THEME GENERATOR/`
- **Includes:**
  - **Product Brief** — vision, three pillars (access / create / share), current scope, what's shipped, what's in progress
  - **Development Roadmap** — phase-based execution plan (has a stale-status header — verify before relying on checkboxes)
  - **Distribution Plan** — active v1.0.0 release playbook
  - **Ableton Theme Convention** — archived research that informed the Semantic Color Roles spec
  - **Windows Testing Checklist** — pre-release verification checklist
  - Other product-related notes (Factory Themes, Video Script)

Check the vault for product scope, current plans, or decision context before assuming anything isn't captured somewhere.

## When to Reference What

- **Starting a new feature or session:** Check the Work Log for recent context, and the Product Brief in the Development vault for product-level scope.
- **Touching the color/theme engine:** Read Semantic Color Roles Specification first. For the current Color Variety work, also read Image-to-Theme Generation Research.
- **Touching parameter mapping or hue injection:** Reference Parameter Control Mapping for what each parameter controls in Ableton's UI.
- **Understanding a feature end-to-end:** Feature Overview has the file paths and component behavior.
- **Backend/Supabase work:** Backend Setup Guide for setup; Feature Overview's Community section for feature behavior.

## Key Paths

| Resource | Location |
|----------|----------|
| React Components | `src/components/` |
| Electron Main Process | `electron/` |
| Theme Engine | `src/theme/` |
| Color Extraction | `src/extraction/` |
| Hooks | `src/hooks/` |
| Styles | `src/styles/` |
| Supabase Migrations | `supabase/migrations/` |
| Supabase Edge Functions | `supabase/functions/` |
| **Ableton Themes Dir (runtime target)** | `/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Themes/` |

## Commands

- `npm run dev` — run in development mode
- `npm run build` — build for production
- `npm run lint` — run ESLint
- `npm run type-check` — TypeScript type checking

## Conventions

The goal of this project is to build a productizable desktop application that can be sold. Be concise in your answers. The user is not interested in learning, just in building a stable product.

**Always:**
- Default to planning mode for solving complex technical issues that require multiple steps.
- When the user corrects you or you learn a non-obvious fix, evaluate whether the lesson is project-specific or reusable knowledge (see Self-Improvement Loop rule in the user's global `~/.claude/CLAUDE.md`):
  - **Project-specific** (unique to this product's code, architecture, or decisions) → append to `Claude/Claude-Lessons.md`
  - **Reusable knowledge** (general React, Electron, CSS, TypeScript, or workflow patterns that would apply to any project) → propose adding to `~/Developer/Audio-Dev-Knowledge/` and ask permission before writing.
  - **When in doubt, ask** — don't default to the project lessons file just because it's lower-friction.

**Prohibited Changes:**
- Do NOT update `Documentation/Work Log.md` without explicit permission.
