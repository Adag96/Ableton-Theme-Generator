import React, { useState } from 'react';
import type { SavedTheme } from '../types/theme-library';
import { ConfirmationDialog } from './ConfirmationDialog';
import './ThemeCard.css';

interface ThemeCardProps {
  theme: SavedTheme;
  onDelete: () => void;
  onClick: () => void;
  onInstall: () => Promise<{ success: boolean; error?: string }>;
  onUninstall: () => Promise<{ success: boolean; error?: string }>;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  onDelete,
  onClick,
  onInstall,
  onUninstall,
}) => {
  const [isWorking, setIsWorking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWorking) return;
    setIsWorking(true);
    try {
      await onInstall();
    } finally {
      setIsWorking(false);
    }
  };

  const handleUninstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWorking) return;
    setIsWorking(true);
    try {
      await onUninstall();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="theme-card" onClick={onClick} style={{ cursor: 'pointer' }}>
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

        <div className="theme-card-footer">
          <span className={`theme-card-tone theme-card-tone-${theme.tone}`}>
            {theme.tone === 'dark' ? 'Dark' : 'Light'}
          </span>

          {theme.isInstalled ? (
            <button
              className="theme-card-action theme-card-action-uninstall"
              onClick={handleUninstallClick}
              disabled={isWorking}
              title="Uninstall from Ableton"
            >
              {isWorking ? '...' : 'Uninstall'}
            </button>
          ) : (
            <button
              className="theme-card-action theme-card-action-install"
              onClick={handleInstallClick}
              disabled={isWorking}
              title="Install to Ableton"
            >
              {isWorking ? '...' : 'Install'}
            </button>
          )}
        </div>
      </div>

      <button className="theme-card-delete" onClick={handleDeleteClick} title="Delete theme">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Theme?"
        message={
          theme.isInstalled
            ? 'This will permanently remove the theme from your library and delete the .ask file from Ableton. This action cannot be undone.'
            : 'This will permanently remove the theme from your library. This action cannot be undone.'
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};
