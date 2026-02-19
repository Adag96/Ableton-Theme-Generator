import React from 'react';
import './LandingView.css';

interface LandingViewProps {
  onImportImage: () => void;
  onBrowseThemes: () => void;
  onCommunity: () => void;
  onSettings: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onImportImage,
  onBrowseThemes,
  onCommunity,
  onSettings,
}) => {
  return (
    <div className="landing-view">
      <div className="landing-buttons">
        <button className="landing-button" onClick={onImportImage}>
          <div className="landing-button-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <h3>Import Image</h3>
          <p>Upload an image to generate custom Ableton Live 12 themes</p>
        </button>

        <button className="landing-button" onClick={onBrowseThemes}>
          <div className="landing-button-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>My Themes</h3>
          <p>View and manage your generated theme library</p>
        </button>

        <button className="landing-button" onClick={onCommunity}>
          <div className="landing-button-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>Community</h3>
          <p>Browse and install themes created by the community</p>
        </button>

        <button className="landing-button" onClick={onSettings}>
          <div className="landing-button-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m6.22-13.22l-4.24 4.24m-2.84 2.84l-4.24 4.24M23 12h-6m-6 0H1m18.22 6.22l-4.24-4.24m-2.84-2.84l-4.24-4.24"/>
            </svg>
          </div>
          <h3>Settings</h3>
          <p>Configure theme generation preferences and Ableton directory</p>
        </button>
      </div>
    </div>
  );
};
