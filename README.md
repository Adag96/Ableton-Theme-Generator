# Live 12 Theme Generator

A desktop application for generating custom Ableton Live 12 themes from images.

## Tech Stack

- **Electron** - Desktop application framework
- **Vite** - Fast build tool and dev server
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the application in development mode:

```bash
npm run dev
```

This will:
1. Start the Vite dev server on http://localhost:5173
2. Launch the Electron application
3. Open dev tools automatically
4. Auto-increment the build number

### Build for Production

Build the application for distribution:

```bash
npm run build
```

This creates a distributable app in the `release` folder.

### Other Commands

- `npm run build:renderer` - Build only the React frontend
- `npm run build:electron` - Build only the Electron main process
- `npm run clean` - Remove all build artifacts
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
├── electron/          # Electron main process code
│   ├── main.ts       # Main process entry point
│   └── preload.ts    # Preload script for IPC
├── src/              # React application code
│   ├── components/   # React components
│   ├── styles/       # Global styles
│   ├── App.tsx       # Main app component
│   └── main.tsx      # React entry point
├── dist/             # Built React app (generated)
├── dist-electron/    # Built Electron app (generated)
├── release/          # Distribution builds (generated)
└── .build-number     # Auto-incremented build tracking
```

## Version & Build Tracking

- **Version**: Manually managed in package.json (starts at 0.0.1)
- **Build Number**: Auto-incremented in dev mode, tracked in `.build-number`

## Design System

The app uses the same sleek dark theme design system as Ableton Hero:

- Dark background (#0a0a0a)
- Accent color (#00d4aa - teal/green)
- Smooth animations and transitions
- Modern, minimal interface

## Current Status

UI shell is complete with:
- Header with app title
- Three large landing buttons (Import Image, Browse Saved Themes, Settings)
- Footer with version and build number tracking
- No functionality implemented yet - just the container/shell

## Next Steps

See [Development Roadmap](Documentation/Development%20Roadmap.md) for planned features.
