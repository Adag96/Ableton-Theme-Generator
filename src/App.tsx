import { useState, useEffect } from 'react';
import { LandingView } from './components/LandingView';
import { SettingsView } from './components/SettingsView';
import { ImageImportView } from './components/ImageImportView';
import type { ImageFileResult } from './electron';
import './App.css';

function App() {
  const [version, setVersion] = useState('0.0.1');
  const [buildNumber, setBuildNumber] = useState('1');
  const [currentView, setCurrentView] = useState<'landing' | 'settings' | 'import'>('landing');
  const [importedImage, setImportedImage] = useState<ImageFileResult | null>(null);

  useEffect(() => {
    // Get version and build number from Electron API if available
    const loadVersionInfo = async () => {
      if (window.electronAPI) {
        try {
          const ver = await window.electronAPI.getVersion();
          const build = await window.electronAPI.getBuildNumber();
          setVersion(ver);
          setBuildNumber(build);
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
            onBack={handleBackToLanding}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Made by <strong>Lonebody</strong>
        </p>
        <div className="footer-version">
          <div className="version-info">
            <span className="version-label">Version:</span>
            <span className="version-value">{version}</span>
          </div>
          <div className="version-info">
            <span className="version-label">Build:</span>
            <span className="version-value">#{buildNumber}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
