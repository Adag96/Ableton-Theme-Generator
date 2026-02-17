import { useState, useEffect } from 'react';
import { LandingView } from './components/LandingView';
import { SettingsView } from './components/SettingsView';
import { ImageImportView } from './components/ImageImportView';
import type { ImageFileResult } from './electron';
import type { PaletteSelectionResult } from './extraction';
import { generateTheme } from './theme/derivation';
import { generateAskXml } from './theme/ask-generator';
import './App.css';

function App() {
  const [version, setVersion] = useState('0.0.1');
  const [currentView, setCurrentView] = useState<'landing' | 'settings' | 'import'>('landing');
  const [importedImage, setImportedImage] = useState<ImageFileResult | null>(null);
  // Will be used when theme generation view is implemented
  const [, setExtractedPalette] = useState<PaletteSelectionResult | null>(null);

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
    console.log('Browse saved themes clicked');
    // Functionality to be implemented
  };

  const handleSettings = () => {
    setCurrentView('settings');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setImportedImage(null);
    setExtractedPalette(null);
  };

  const handlePaletteReady = async (palette: PaletteSelectionResult) => {
    setExtractedPalette(palette);
    console.log('Palette extracted:', palette.roles);

    // Generate theme from extracted palette
    const themeData = generateTheme(palette.roles);
    const xmlContent = generateAskXml(themeData);

    // Derive filename from imported image
    const baseFileName = importedImage?.fileName
      ? importedImage.fileName.replace(/\.[^/.]+$/, '') // Remove extension
      : 'Generated Theme';
    const defaultFileName = `${baseFileName}.ask`;

    // Save the theme file
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveThemeFile(xmlContent, defaultFileName);
        if (result.success) {
          console.log('Theme saved to:', result.filePath);
          // Return to landing after successful save
          handleBackToLanding();
        } else if (result.error) {
          console.error('Failed to save theme:', result.error);
        }
        // If user cancelled, stay on the current view
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
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
        ) : (
          <ImageImportView
            image={importedImage}
            onImageLoaded={handleImageLoaded}
            onContinue={handlePaletteReady}
            onBack={handleBackToLanding}
          />
        )}
      </main>

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
