import React, { useState, useEffect, useRef } from 'react';
import type { SavedTheme } from '../types/theme-library';
import { ConfirmationDialog } from './ConfirmationDialog';
import { AuthModal } from './AuthModal';
import { SubmitThemeModal } from './SubmitThemeModal';
import { ImageMagnifier } from './ImageMagnifier';
import { Tooltip } from './Tooltip';
import { useAuth } from '../hooks/useAuth';
import { useModalOverlayClose } from '../hooks/useModalOverlayClose';
import './ThemeDetailModal.css';

// Hook to load preview image from file path
function usePreviewImage(theme: SavedTheme | null): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!theme) {
      setImageUrl(null);
      return;
    }

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
  }, [theme?.previewImage, theme?.previewImagePath, theme?.id]);

  return imageUrl;
}

interface ThemeDetailModalProps {
  isOpen: boolean;
  theme: SavedTheme | null;
  onClose: () => void;
  onRename: (id: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  onDownload: (theme: SavedTheme) => Promise<void>;
  onDelete: (id: string) => void;
  onInstall: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUninstall: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit: (theme: SavedTheme) => void;
  submissions?: { id: string; status: string }[];
  onSubmissionCreated?: (id: string, status: string) => void;
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
  onEdit,
  submissions,
  onSubmissionCreated,
}) => {
  const { user } = useAuth();
  const { handleOverlayClick, handleOverlayMouseDown, handleContentMouseDown } = useModalOverlayClose(onClose);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isUninstallHovering, setIsUninstallHovering] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewImageUrl = usePreviewImage(theme);

  useEffect(() => {
    if (theme) {
      setEditName(theme.name);
      setRenameError(null);
    }
    setIsEditing(false);
    setConfirmDelete(false);
    setShowAuthModal(false);
    setShowSubmitModal(false);
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
    if (!theme) return;
    const skipKey = theme.isInstalled ? 'deleteConfirm.skipInstalled' : 'deleteConfirm.skipAvailable';
    if (localStorage.getItem(skipKey) === 'true') {
      onDelete(theme.id);
      onClose();
      return;
    }
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = () => {
    if (!theme) return;
    if (dontShowAgain) {
      const skipKey = theme.isInstalled ? 'deleteConfirm.skipInstalled' : 'deleteConfirm.skipAvailable';
      localStorage.setItem(skipKey, 'true');
    }
    setConfirmDelete(false);
    setDontShowAgain(false);
    onDelete(theme.id);
    onClose();
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(false);
    setDontShowAgain(false);
  };

  const handleSubmitToGallery = () => {
    if (user) {
      setShowSubmitModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  if (!isOpen || !theme) return null;

  const roleLocations = theme.roleLocations ?? {};
  const submissionStatus = submissions?.find(s => s.id === theme.id)?.status;

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayMouseDown} onClick={handleOverlayClick} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="modal-content" onMouseDown={handleContentMouseDown}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image preview with color markers */}
        <div className="modal-image-section">
          {previewImageUrl ? (
            <ImageMagnifier
              src={previewImageUrl}
              alt={theme.name}
              className="modal-preview-container"
            >
              {roleLocations.surface_base && (
                <div
                  className="color-marker"
                  style={{
                    left: `${roleLocations.surface_base.x * 100}%`,
                    top: `${roleLocations.surface_base.y * 100}%`,
                    backgroundColor: theme.colors.surface_base,
                  }}
                  data-tooltip="Panels & backgrounds"
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
                  data-tooltip="Text & icons"
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
                  data-tooltip="Active toggles & progress"
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
                  data-tooltip="Range indicators"
                />
              )}
              {theme.hueInjection?.enabled && roleLocations.accent_tertiary && theme.colors.accent_tertiary && (
                <div
                  className="color-marker"
                  style={{
                    left: `${roleLocations.accent_tertiary.x * 100}%`,
                    top: `${roleLocations.accent_tertiary.y * 100}%`,
                    backgroundColor: theme.colors.accent_tertiary,
                  }}
                  data-tooltip="Accent 3"
                />
              )}
              {theme.hueInjection?.enabled && roleLocations.accent_quaternary && theme.colors.accent_quaternary && (
                <div
                  className="color-marker"
                  style={{
                    left: `${roleLocations.accent_quaternary.x * 100}%`,
                    top: `${roleLocations.accent_quaternary.y * 100}%`,
                    backgroundColor: theme.colors.accent_quaternary,
                  }}
                  data-tooltip="Accent 4"
                />
              )}
            </ImageMagnifier>
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
          </div>

          <div className="modal-swatches-row">
            <div className="modal-swatches">
              <Tooltip content="Panels & backgrounds">
                <div className="modal-swatch-item">
                  <div
                    className="modal-swatch"
                    style={{ backgroundColor: theme.colors.surface_base }}
                  />
                  <span className="modal-swatch-label">Surface</span>
                </div>
              </Tooltip>
              <Tooltip content="Text & icons">
                <div className="modal-swatch-item">
                  <div
                    className="modal-swatch"
                    style={{ backgroundColor: theme.colors.text_primary }}
                  />
                  <span className="modal-swatch-label">Text</span>
                </div>
              </Tooltip>
              <Tooltip content="Active toggles & progress">
                <div className="modal-swatch-item">
                  <div
                    className="modal-swatch"
                    style={{ backgroundColor: theme.colors.accent_primary }}
                  />
                  <span className="modal-swatch-label">Accent 1</span>
                </div>
              </Tooltip>
              <Tooltip content="Range indicators">
                <div className="modal-swatch-item">
                  <div
                    className="modal-swatch"
                    style={{ backgroundColor: theme.colors.accent_secondary }}
                  />
                  <span className="modal-swatch-label">Accent 2</span>
                </div>
              </Tooltip>
              {theme.hueInjection?.enabled && theme.colors.accent_tertiary && (
                <Tooltip content="Accent 3">
                  <div className="modal-swatch-item">
                    <div
                      className="modal-swatch"
                      style={{ backgroundColor: theme.colors.accent_tertiary }}
                    />
                    <span className="modal-swatch-label">Accent 3</span>
                  </div>
                </Tooltip>
              )}
              {theme.hueInjection?.enabled && theme.colors.accent_quaternary && (
                <Tooltip content="Accent 4">
                  <div className="modal-swatch-item">
                    <div
                      className="modal-swatch"
                      style={{ backgroundColor: theme.colors.accent_quaternary }}
                    />
                    <span className="modal-swatch-label">Accent 4</span>
                  </div>
                </Tooltip>
              )}
            </div>
            <button
              className="modal-edit-button"
              onClick={() => onEdit(theme)}
              title="Edit theme"
            >
              <svg
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
              Edit Theme
            </button>
          </div>
        </div>

        {/* Actions */}
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
            {isDownloading ? 'Downloading...' : 'Download .ask'}
          </button>

          {theme.isInstalled ? (
            <button
              className={`modal-action-button ${isUninstallHovering ? 'modal-action-uninstall' : 'modal-action-installed'}`}
              onClick={handleUninstall}
              onMouseEnter={() => setIsUninstallHovering(true)}
              onMouseLeave={() => setIsUninstallHovering(false)}
              disabled={isInstalling}
              title={isUninstallHovering ? 'Remove from Ableton' : 'Installed in Ableton'}
            >
              {isUninstallHovering ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isInstalling ? 'Uninstalling...' : (isUninstallHovering ? 'Uninstall' : 'Installed')}
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

          {submissionStatus ? (
            <button
              className={`modal-action-button modal-action-status modal-action-status-${submissionStatus}`}
              disabled
              title={`This theme has been ${submissionStatus === 'pending' ? 'submitted for review' : submissionStatus}`}
            >
              {submissionStatus === 'pending' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )}
              {submissionStatus === 'approved' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              )}
              {submissionStatus === 'rejected' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              {submissionStatus === 'pending' && 'Pending Review'}
              {submissionStatus === 'approved' && 'Featured'}
              {submissionStatus === 'rejected' && 'Rejected'}
            </button>
          ) : (
            <button
              className="modal-action-button modal-action-submit"
              onClick={handleSubmitToGallery}
              title="Submit this theme to the community gallery"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
              Share
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

        <ConfirmationDialog
          isOpen={confirmDelete}
          title="Delete Theme?"
          message={
            theme.isInstalled
              ? <>This will permanently remove the theme from your library <strong>and delete the .ask file from Ableton</strong>. This action cannot be undone.</>
              : 'This will permanently remove the theme from your library. This action cannot be undone.'
          }
          confirmLabel="Delete"
          variant="destructive"
          showDontShowAgain
          onDontShowAgainChange={setDontShowAgain}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>

      {/* Auth modal — shown before submit if not signed in */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            setShowSubmitModal(true);
          }}
        />
      )}

      {/* Submit modal */}
      {showSubmitModal && (
        <SubmitThemeModal
          theme={theme}
          onClose={() => setShowSubmitModal(false)}
          onSubmissionCreated={onSubmissionCreated}
        />
      )}
    </div>
  );
};
