# Ableton Live 12 Theme Generator

## Overview
Desktop application that generates custom Ableton Live 12 themes from images. Users upload an image, the app extracts colors, generates theme variants, and exports .ask theme files.

## Tech Stack
- **Electron** - Desktop app framework
- **Vite** - Build tool and dev server
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Supabase** - Backend: auth, Postgres database, file storage (community gallery)

## Quick Reference

| Resource | Location |
|----------|----------|
| Claude Lessons | `Claude/Claude-Lessons.md` |
| Claude Todo | `Claude/todo.md` |
| Documentation | `Documentation/` |
| Product Brief | `Documentation/Product Brief.md` |
| Development Roadmap | `Documentation/Development Roadmap.md` |
| Feature Overview | `Documentation/Feature Overview.md` |
| Backend Setup Guide | `Documentation/Backend Setup Guide.md` |
| Semantic Color Roles | `Documentation/Semantic Color Roles Specification.md` |
| Theme Convention | `Documentation/Ableton Theme Convention.md` |
| Work Log | `Documentation/Work Log.md` |
| Parameter Mapping | `parameter_control_mapping.md` |
| React Components | `src/components/` |
| Electron Main Process | `electron/` |
| Styles | `src/styles/` |
| **Ableton Themes Dir** | `/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Themes/` |

## Commands
- `npm run dev` - Run in development mode
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## INSTRUCTIONS
The goal of this project is to build a productizable desktop application that can be sold. Be concise in your answers. The user is not interested in learning, just in building a stable product.

**Always:**
- Default to planning mode for solving complex technical issues that require multiple steps
- Update 'Claude-Lessons.md' file with important corrections or learnings from the user that should not be repeated

**Never:**
- Update the 'Work Log.md' file without consent
