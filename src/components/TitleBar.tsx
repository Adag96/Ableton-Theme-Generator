import { useState, useEffect } from 'react';
import { useAppTheme } from '../hooks/useAppTheme';
import './TitleBar.css';

interface TitleBarProps {
  title?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'Live 12 Theme Generator'
}) => {
  const [platform, setPlatform] = useState<'darwin' | 'win32' | 'linux'>('darwin');
  const [isMaximized, setIsMaximized] = useState(false);
  const { mode, toggleMode } = useAppTheme();

  useEffect(() => {
    const init = async () => {
      if (window.electronAPI) {
        const p = await window.electronAPI.getPlatform();
        setPlatform(p);
        const max = await window.electronAPI.windowIsMaximized();
        setIsMaximized(max);
      }
    };
    init();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI?.windowMaximize();
    const max = await window.electronAPI?.windowIsMaximized();
    setIsMaximized(max ?? false);
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  const isMac = platform === 'darwin';

  return (
    <div className={`titlebar ${isMac ? 'titlebar-mac' : 'titlebar-win'}`}>
      {/* macOS: Traffic lights are native, just need drag region */}
      {isMac && <div className="titlebar-drag-region-mac" />}

      <div className="titlebar-title">
        <span className="titlebar-title-text">{title}</span>
      </div>

      {/* Theme toggle - positioned on right side */}
      <div className="titlebar-actions">
        <button
          className="titlebar-theme-toggle"
          onClick={toggleMode}
          aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        >
          {mode === 'light' ? (
            // Moon icon for switching to dark
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            // Sun icon for switching to light
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>
      </div>

      {/* Windows/Linux: Custom window controls */}
      {!isMac && (
        <div className="titlebar-controls">
          <button
            className="titlebar-btn titlebar-btn-minimize"
            onClick={handleMinimize}
            aria-label="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1">
              <rect width="10" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            className="titlebar-btn titlebar-btn-maximize"
            onClick={handleMaximize}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M2 0v2H0v8h8V8h2V0H2zm6 8H1V3h7v5zM9 7V1H3v1h5v5h1z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect
                  x="0.5" y="0.5"
                  width="9" height="9"
                  fill="none"
                  stroke="currentColor"
                />
              </svg>
            )}
          </button>
          <button
            className="titlebar-btn titlebar-btn-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M1 0L0 1l4 4-4 4 1 1 4-4 4 4 1-1-4-4 4-4-1-1-4 4-4-4z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
