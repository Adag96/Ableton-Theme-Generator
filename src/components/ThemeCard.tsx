import React, { useState, useEffect } from 'react';
import type { SavedTheme } from '../types/theme-library';
import { ConfirmationDialog } from './ConfirmationDialog';
import './ThemeCard.css';

// Hook to load preview image from file path
function usePreviewImage(theme: SavedTheme): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Legacy: if previewImage (base64) exists, use it directly
    if (theme.previewImage) {
      setImageUrl(theme.previewImage);
      return;
    }

    // New: load from file path
    if (theme.previewImagePath && window.electronAPI) {
      window.electronAPI.getPreviewImageDataUrl(theme.previewImagePath)
        .then(dataUrl => setImageUrl(dataUrl))
        .catch(() => setImageUrl(null));
    } else {
      setImageUrl(null);
    }
  }, [theme.previewImage, theme.previewImagePath]);

  return imageUrl;
}

interface ThemeCardProps {
  theme: SavedTheme;
  onDelete: () => void;
  onClick: () => void;
  onInstall: () => Promise<{ success: boolean; error?: string }>;
  onUninstall: () => Promise<{ success: boolean; error?: string }>;
  onEdit: (theme: SavedTheme) => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  onDelete,
  onClick,
  onInstall,
  onUninstall,
  onEdit,
}) => {
  const [isWorking, setIsWorking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUninstallHovering, setIsUninstallHovering] = useState(false);
  const previewImageUrl = usePreviewImage(theme);

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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(theme);
  };

  return (
    <div className="theme-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {previewImageUrl && (
        <div className="theme-card-preview">
          <img src={previewImageUrl} alt={theme.name} />
        </div>
      )}

      <div className="theme-card-content">
        <button className="theme-card-edit" onClick={handleEditClick} title="Edit theme">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <h4 className="theme-card-name">{theme.name}</h4>

        <div className="theme-card-swatches">
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.surface_base }}
          />
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.text_primary }}
          />
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.accent_primary }}
          />
          <div
            className="theme-swatch"
            style={{ backgroundColor: theme.colors.accent_secondary }}
          />
          {theme.hueInjection?.enabled && theme.colors.accent_tertiary && (
            <div
              className="theme-swatch"
              style={{ backgroundColor: theme.colors.accent_tertiary }}
              title="Accent 3"
            />
          )}
          {theme.hueInjection?.enabled && theme.colors.accent_quaternary && (
            <div
              className="theme-swatch"
              style={{ backgroundColor: theme.colors.accent_quaternary }}
              title="Accent 4"
            />
          )}
        </div>

        <div className="theme-card-footer">
          <span className={`theme-card-tone theme-card-tone-${theme.tone}`}>
            {theme.tone === 'dark' ? 'Dark' : 'Light'}
          </span>

          {theme.isInstalled ? (
            <button
              className={`theme-card-action ${isUninstallHovering ? 'theme-card-action-uninstall' : 'theme-card-action-installed'}`}
              onClick={handleUninstallClick}
              onMouseEnter={() => setIsUninstallHovering(true)}
              onMouseLeave={() => setIsUninstallHovering(false)}
              disabled={isWorking}
              title={isUninstallHovering ? 'Uninstall from Ableton' : 'Installed in Ableton'}
            >
              {isWorking ? '...' : (
                <span className="theme-card-action-content">
                  {isUninstallHovering ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      Uninstall
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Installed
                    </>
                  )}
                </span>
              )}
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
