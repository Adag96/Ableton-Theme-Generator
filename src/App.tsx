import { useState, useEffect } from 'react';
import { LandingView } from './components/LandingView';
import { SettingsView } from './components/SettingsView';
import { ImageImportView } from './components/ImageImportView';
import { MyThemesView } from './components/MyThemesView';
import { ThemeNameDialog } from './components/ThemeNameDialog';
import type { ImageFileResult } from './electron';
import type { PaletteSelectionResult } from './extraction';
import type { SavedTheme } from './types/theme-library';
import { useThemeLibrary } from './hooks/useThemeLibrary';
import { generateTheme } from './theme/derivation';
import { generateAskXml } from './theme/ask-generator';
import './App.css';

interface PendingTheme {
  palette: PaletteSelectionResult;
  xmlContent: string;
  previewImage?: string;
}

function App() {
  const [version, setVersion] = useState('0.0.1');
  const [currentView, setCurrentView] = useState<'landing' | 'settings' | 'import' | 'my-themes'>('landing');
  const [importedImage, setImportedImage] = useState<ImageFileResult | null>(null);
  const [pendingTheme, setPendingTheme] = useState<PendingTheme | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const { library, addTheme, removeTheme } = useThemeLibrary();

  useEffect(() => {
    // Get version and build number from Electron API if available
    const loadVersionInfo = async () => {
      if (window.electronAPI) {
        try {
          const ver = await window.electronAPI.getVersion();
          setVersion(ver);
        } catch (error) {
          console.error('Error loading version info:', error);
        }
      }
    };

    loadVersionInfo();
  }, []);

  const handleImportImage = () => {
    setCurrentView('import');
  };

  const handleImageLoaded = (image: ImageFileResult) => {
    setImportedImage(image);
  };

  const handleBrowseThemes = () => {
    setCurrentView('my-themes');
  };

  const handleSettings = () => {
    setCurrentView('settings');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setImportedImage(null);
    setPendingTheme(null);
    setShowNameDialog(false);
  };

  const handlePaletteReady = async (palette: PaletteSelectionResult) => {
    // Generate theme from extracted palette
    const themeData = generateTheme(palette.roles);
    const xmlContent = generateAskXml(themeData);

    // Get preview image for the theme card
    let previewImage: string | undefined;
    if (importedImage?.filePath && window.electronAPI) {
      previewImage = (await window.electronAPI.readImageAsDataUrl(importedImage.filePath)) ?? undefined;
    }

    // Store pending theme and show name dialog
    setPendingTheme({ palette, xmlContent, previewImage });
    setShowNameDialog(true);
  };

  const handleThemeNameConfirm = async (name: string) => {
    if (!pendingTheme) return;

    const defaultFileName = `${name}.ask`;

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveThemeFile(pendingTheme.xmlContent, defaultFileName);
        if (result.success && result.filePath) {
          // Create saved theme entry
          const savedTheme: SavedTheme = {
            id: crypto.randomUUID(),
            name,
            createdAt: new Date().toISOString(),
            filePath: result.filePath,
            tone: pendingTheme.palette.roles.tone,
            colors: {
              surface_base: pendingTheme.palette.roles.surface_base,
              text_primary: pendingTheme.palette.roles.text_primary,
              accent_primary: pendingTheme.palette.roles.accent_primary,
              accent_secondary: pendingTheme.palette.roles.accent_secondary,
            },
            contrastLevel: pendingTheme.palette.roles.contrastLevel,
            previewImage: pendingTheme.previewImage,
          };

          await addTheme(savedTheme);
          setShowNameDialog(false);
          setPendingTheme(null);
          setImportedImage(null);
          setCurrentView('my-themes');
        } else if (result.error) {
          console.error('Failed to save theme:', result.error);
        }
        // If user cancelled save dialog, keep name dialog open
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  const handleNameDialogCancel = () => {
    setShowNameDialog(false);
    setPendingTheme(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Live 12 Theme Generator</h1>
          <p className="app-subtitle">Create Custom Ableton Live 12 Themes</p>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'landing' ? (
          <LandingView
            onImportImage={handleImportImage}
            onBrowseThemes={handleBrowseThemes}
            onSettings={handleSettings}
          />
        ) : currentView === 'settings' ? (
          <SettingsView onBack={handleBackToLanding} />
        ) : currentView === 'my-themes' ? (
          <MyThemesView
            themes={library.themes}
            onBack={handleBackToLanding}
            onDeleteTheme={removeTheme}
          />
        ) : (
          <ImageImportView
            image={importedImage}
            onImageLoaded={handleImageLoaded}
            onContinue={handlePaletteReady}
            onBack={handleBackToLanding}
          />
        )}
      </main>

      <ThemeNameDialog
        isOpen={showNameDialog}
        defaultName={importedImage?.fileName?.replace(/\.[^/.]+$/, '') ?? ''}
        onConfirm={handleThemeNameConfirm}
        onCancel={handleNameDialogCancel}
      />

      <footer className="app-footer">
        <p className="footer-credit">
          Made by <strong>Lonebody</strong>
          <span className="footer-socials">
            <a
              href="https://www.instagram.com/lonebody/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="Instagram"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/channel/UCkiy7tsIo_gbFIbscSxXBHw?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="YouTube"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </span>
        </p>
        <div className="footer-version">
          <span className="version-value">v{version}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
