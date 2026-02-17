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
        <p>
          Made by <strong>Lonebody</strong>
        </p>
        <div className="footer-version">
          <span className="version-value">v{version}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
