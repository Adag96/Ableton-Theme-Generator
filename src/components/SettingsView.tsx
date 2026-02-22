import { useState, useEffect } from 'react';
import type { ThemesDirectoryResult, ThemeFileInfo } from '../electron';
import { useAuth } from '../hooks/useAuth';
import { EmailPreferencesModal } from './EmailPreferencesModal';
import './SettingsView.css';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [themesDir, setThemesDir] = useState<ThemesDirectoryResult | null>(null);
  const [themeFiles, setThemeFiles] = useState<ThemeFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailPrefs, setShowEmailPrefs] = useState(false);

  const loadThemeFiles = async (dirPath: string) => {
    const files = await window.electronAPI.listThemeFiles(dirPath);
    setThemeFiles(files);
  };

  useEffect(() => {
    const detect = async () => {
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.detectThemesDirectory();
          setThemesDir(result);

          if (result.found && result.path) {
            await loadThemeFiles(result.path);
          }
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

  const handleDeleteTheme = async (fileName: string) => {
    if (!themesDir?.path) return;

    const filePath = `${themesDir.path}/${fileName}`;
    const result = await window.electronAPI.deleteThemeFile(filePath);

    if (result.success) {
      await loadThemeFiles(themesDir.path);
    } else {
      console.error('Failed to delete theme:', result.error);
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

      {user && (
        <div className="settings-section">
          <h3 className="settings-section-title">Account</h3>
          <div className="settings-account-actions">
            <button
              className="settings-email-prefs-button"
              onClick={() => setShowEmailPrefs(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email Preferences
            </button>
          </div>
        </div>
      )}

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

            {themeFiles.length > 0 && (
              <div className="settings-theme-list">
                <p className="settings-theme-list-label">
                  Installed Themes ({themeFiles.length})
                </p>
                <ul className="settings-theme-list-items">
                  {themeFiles.map((file) => (
                    <li key={file.name} className="settings-theme-list-item">
                      <span className="settings-theme-name">
                        {file.name.replace(/\.ask$/i, '')}
                      </span>
                      {file.createdByApp && (
                        <button
                          className="settings-theme-remove"
                          onClick={() => handleDeleteTheme(file.name)}
                          title="Remove theme"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

      {showEmailPrefs && profile && (
        <EmailPreferencesModal
          profile={profile}
          onClose={() => setShowEmailPrefs(false)}
          onUpdate={refreshProfile}
        />
      )}
    </div>
  );
};
