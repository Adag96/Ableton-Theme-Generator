import React, { useState, useEffect, useRef } from 'react';
import type { SavedTheme } from '../types/theme-library';
import './ThemeDetailModal.css';

interface ThemeDetailModalProps {
  isOpen: boolean;
  theme: SavedTheme | null;
  onClose: () => void;
  onRename: (id: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  onDownload: (theme: SavedTheme) => Promise<void>;
  onDelete: (id: string) => void;
  onInstall: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUninstall: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const CONTRAST_LABELS: Record<string, string> = {
  low: 'Low',
  standard: 'Standard',
  high: 'High',
};

export const ThemeDetailModal: React.FC<ThemeDetailModalProps> = ({
  isOpen,
  theme,
  onClose,
  onRename,
  onDownload,
  onDelete,
  onInstall,
  onUninstall,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme) {
      setEditName(theme.name);
      setRenameError(null);
    }
    setIsEditing(false);
    setConfirmDelete(false);
  }, [theme]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (confirmDelete) {
        setConfirmDelete(false);
      } else if (isEditing) {
        setIsEditing(false);
        setEditName(theme?.name ?? '');
        setRenameError(null);
      } else {
        onClose();
      }
    }
  };

  const handleRenameSubmit = async () => {
    if (!theme || !editName.trim() || editName.trim() === theme.name) {
      setIsEditing(false);
      setEditName(theme?.name ?? '');
      return;
    }

    const result = await onRename(theme.id, editName.trim());
    if (result.success) {
      setIsEditing(false);
      setRenameError(null);
    } else {
      setRenameError(result.error ?? 'Rename failed');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setIsEditing(false);
      setEditName(theme?.name ?? '');
      setRenameError(null);
    }
  };

  const handleDownload = async () => {
    if (!theme || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownload(theme);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    if (!theme || isInstalling) return;
    setIsInstalling(true);
    try {
      await onInstall(theme.id);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstall = async () => {
    if (!theme || isInstalling) return;
    setIsInstalling(true);
    try {
      await onUninstall(theme.id);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = () => {
    if (!theme) return;
    onDelete(theme.id);
    onClose();
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(false);
  };

  if (!isOpen || !theme) return null;

  const roleLocations = theme.roleLocations ?? {};

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image preview with color markers */}
        <div className="modal-image-section">
          {theme.previewImage ? (
            <div className="modal-preview-container">
              <img
                src={theme.previewImage}
                alt={theme.name}
                className="modal-preview-image"
              />
              {/* Color markers */}
              {roleLocations.surface_base && (
                <div
                  className="color-marker"
                  style={{
                    left: `${roleLocations.surface_base.x * 100}%`,
                    top: `${roleLocations.surface_base.y * 100}%`,
                    backgroundColor: theme.colors.surface_base,
                  }}
                  title="Surface"
                />
              )}
              {roleLocations.text_primary && (
                <div
                  className="color-marker"
                  style={{
                    left: `${roleLocations.text_primary.x * 100}%`,
                    top: `${roleLocations.text_primary.y * 100}%`,
                    backgroundColor: theme.colors.text_primary,
                  }}
                  title="Text"
                />
              )}
              {roleLocations.accent_primary && (
                <div
                  className="color-marker"
                  style={{
                    left: `${roleLocations.accent_primary.x * 100}%`,
                    top: `${roleLocations.accent_primary.y * 100}%`,
                    backgroundColor: theme.colors.accent_primary,
                  }}
                  title="Accent 1"
                />
              )}
              {roleLocations.accent_secondary && (
                <div
                  className="color-marker"
                  style={{
                    left: `${roleLocations.accent_secondary.x * 100}%`,
                    top: `${roleLocations.accent_secondary.y * 100}%`,
                    backgroundColor: theme.colors.accent_secondary,
                  }}
                  title="Accent 2"
                />
              )}
            </div>
          ) : (
            <div className="modal-no-image">No preview available</div>
          )}
        </div>

        {/* Theme info */}
        <div className="modal-info-section">
          <div className="modal-name-row">
            {isEditing ? (
              <div className="modal-name-edit">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleRenameSubmit}
                  className="modal-name-input"
                />
                {renameError && <span className="modal-rename-error">{renameError}</span>}
              </div>
            ) : (
              <div
                className="modal-name-container"
                onClick={() => setIsEditing(true)}
                title="Click to rename"
              >
                <h3 className="modal-theme-name">{theme.name}</h3>
                <svg
                  className="modal-name-pencil"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </div>
            )}
          </div>

          <div className="modal-badges">
            <span className={`modal-badge modal-badge-tone-${theme.tone}`}>
              {theme.tone === 'dark' ? 'Dark' : 'Light'}
            </span>
            {theme.contrastLevel && (
              <span className="modal-badge modal-badge-contrast">
                {CONTRAST_LABELS[theme.contrastLevel] ?? theme.contrastLevel} Contrast
              </span>
            )}
            <span className={`modal-badge ${theme.isInstalled ? 'modal-badge-installed' : 'modal-badge-available'}`}>
              {theme.isInstalled ? 'Installed' : 'Not Installed'}
            </span>
          </div>

          <div className="modal-swatches">
            <div
              className="modal-swatch"
              style={{ backgroundColor: theme.colors.surface_base }}
              title="Surface"
            />
            <div
              className="modal-swatch"
              style={{ backgroundColor: theme.colors.text_primary }}
              title="Text"
            />
            <div
              className="modal-swatch"
              style={{ backgroundColor: theme.colors.accent_primary }}
              title="Accent 1"
            />
            <div
              className="modal-swatch"
              style={{ backgroundColor: theme.colors.accent_secondary }}
              title="Accent 2"
            />
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete ? (
          <div className="modal-confirm-delete">
            <p className="modal-confirm-text">
              {theme.isInstalled
                ? 'This will permanently remove the theme from your library and delete the .ask file from Ableton.'
                : 'This will permanently remove the theme from your library.'}
            </p>
            <div className="modal-confirm-actions">
              <button className="modal-action-button" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="modal-action-button modal-action-confirm-delete" onClick={handleDeleteConfirm}>
                Delete Theme
              </button>
            </div>
          </div>
        ) : (
          /* Actions */
          <div className="modal-actions">
            <button
              className="modal-action-button"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download to Downloads folder"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>

            {theme.isInstalled ? (
              <button
                className="modal-action-button modal-action-uninstall"
                onClick={handleUninstall}
                disabled={isInstalling}
                title="Remove from Ableton"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                {isInstalling ? 'Uninstalling...' : 'Uninstall'}
              </button>
            ) : (
              <button
                className="modal-action-button modal-action-install"
                onClick={handleInstall}
                disabled={isInstalling}
                title="Install to Ableton"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
            )}

            <button
              className="modal-action-button modal-action-delete"
              onClick={handleDeleteClick}
              title="Delete theme"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
