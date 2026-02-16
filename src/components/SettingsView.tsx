import { useState, useEffect } from 'react';
import type { ThemesDirectoryResult } from '../electron';
import './SettingsView.css';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [themesDir, setThemesDir] = useState<ThemesDirectoryResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.detectThemesDirectory();
          setThemesDir(result);
        } catch (error) {
          console.error('Error detecting themes directory:', error);
          setThemesDir({ found: false, path: null, edition: null });
        }
      }
      setLoading(false);
    };
    detect();
  }, []);

  const handleOpenPath = async () => {
    if (themesDir?.path) {
      await window.electronAPI.openPathInExplorer(themesDir.path);
    }
  };

  return (
    <div className="settings-view">
      <button className="settings-back-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <h2 className="settings-title">Settings</h2>

      <div className="settings-section">
        <h3 className="settings-section-title">Ableton Themes Directory</h3>

        {loading ? (
          <p className="settings-status">Detecting Ableton installation...</p>
        ) : themesDir?.found ? (
          <div className="settings-path-container">
            <p className="settings-status settings-status-success">
              Ableton Live 12 {themesDir.edition} detected
            </p>
            <button className="settings-path" onClick={handleOpenPath} title="Open in Finder">
              {themesDir.path}
            </button>
          </div>
        ) : (
          <div className="settings-path-container">
            <p className="settings-status settings-status-error">
              Ableton Live 12 not found
            </p>
            <p className="settings-hint">
              Install Ableton Live 12 or check that it is in the default location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
