import React from 'react';
import type { SavedTheme } from '../types/theme-library';
import './ThemeCard.css';

interface ThemeCardProps {
  theme: SavedTheme;
  onDelete: () => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, onDelete }) => {
  return (
    <div className="theme-card">
      {theme.previewImage && (
        <div className="theme-card-preview">
          <img src={theme.previewImage} alt={theme.name} />
        </div>
      )}

      <div className="theme-card-content">
        <h4 className="theme-card-name">{theme.name}</h4>

        <div className="theme-card-swatches">
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.surface_base }}
            title="Surface"
          />
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.text_primary }}
            title="Text"
          />
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.accent_primary }}
            title="Accent 1"
          />
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.accent_secondary }}
            title="Accent 2"
          />
        </div>

        <span className={`theme-card-tone theme-card-tone-${theme.tone}`}>
          {theme.tone === 'dark' ? 'Dark' : 'Light'}
        </span>
      </div>

      <button className="theme-card-delete" onClick={onDelete} title="Delete theme">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  );
};
