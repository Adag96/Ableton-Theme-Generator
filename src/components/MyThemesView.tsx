import React from 'react';
import type { SavedTheme } from '../types/theme-library';
import { ThemeCard } from './ThemeCard';
import './MyThemesView.css';

interface MyThemesViewProps {
  themes: SavedTheme[];
  onBack: () => void;
  onDeleteTheme: (id: string) => void;
}

export const MyThemesView: React.FC<MyThemesViewProps> = ({
  themes,
  onBack,
  onDeleteTheme,
}) => {
  return (
    <div className="my-themes-view">
      <button className="my-themes-back-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <h2 className="my-themes-title">My Themes</h2>

      {themes.length === 0 ? (
        <div className="my-themes-empty">
          <div className="my-themes-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="my-themes-empty-text">No themes saved yet</p>
          <p className="my-themes-empty-hint">Generate a theme from an image to get started</p>
        </div>
      ) : (
        <div className="my-themes-grid">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onDelete={() => onDeleteTheme(theme.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
