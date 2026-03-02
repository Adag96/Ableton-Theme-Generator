import React, { useState, useEffect } from 'react';
import type { CommunityTheme } from '../lib/supabase';
import { ImageMagnifier } from './ImageMagnifier';
import './CommunityThemeDetailModal.css';

interface CommunityThemeDetailModalProps {
  isOpen: boolean;
  theme: CommunityTheme | null;
  onClose: () => void;
  onDownload: (theme: CommunityTheme) => Promise<void>;
  onUninstall?: (theme: CommunityTheme) => Promise<void>;
  onCreatorClick?: (userId: string) => void;
  showStatus?: boolean;
  isInstalled?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Not Approved',
};

export const CommunityThemeDetailModal: React.FC<CommunityThemeDetailModalProps> = ({
  isOpen,
  theme,
  onClose,
  onDownload,
  onUninstall,
  onCreatorClick,
  showStatus = false,
  isInstalled = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isUninstallHovering, setIsUninstallHovering] = useState(false);

  useEffect(() => {
    setDownloadError(null);
  }, [theme]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
      e.preventDefault();
      onPrevious();
    } else if (e.key === 'ArrowRight' && hasNext && onNext) {
      e.preventDefault();
      onNext();
    }
  };

  const handleDownload = async () => {
    if (!theme || isDownloading) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      await onDownload(theme);
    } catch {
      setDownloadError('Install failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUninstall = async () => {
    if (!theme || isUninstalling || !onUninstall) return;
    setDownloadError(null);
    setIsUninstalling(true);
    try {
      await onUninstall(theme);
    } catch {
      setDownloadError('Uninstall failed');
    } finally {
      setIsUninstalling(false);
    }
  };

  if (!isOpen || !theme) return null;

  const creatorName = theme.profiles?.display_name ?? 'Unknown';
  const swatchColors = theme.swatch_colors ?? [];

  return (
    <div
      className="community-modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Navigation Arrows */}
      {hasPrevious && onPrevious && (
        <button
          className="community-modal-nav community-modal-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          aria-label="Previous theme"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {hasNext && onNext && (
        <button
          className="community-modal-nav community-modal-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next theme"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <div className="community-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="community-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Ableton Preview Image */}
        <div className="community-modal-image-section">
          {theme.preview_image_url ? (
            <ImageMagnifier
              src={theme.preview_image_url}
              alt={`${theme.name} - Ableton Preview`}
              className="community-modal-preview-container"
            />
          ) : (
            <div className="community-modal-no-preview">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>Ableton preview coming soon</p>
            </div>
          )}
        </div>

        {/* Theme Info */}
        <div className="community-modal-info-section">
          <h3 className="community-modal-name">{theme.name}</h3>
          <p className="community-modal-creator">
            by{' '}
            {theme.user_id && onCreatorClick ? (
              <button
                className="community-modal-creator-link"
                onClick={() => {
                  onCreatorClick(theme.user_id!);
                  onClose();
                }}
              >
                {creatorName}
              </button>
            ) : (
              creatorName
            )}
          </p>

          {theme.description && (
            <p className="community-modal-description">{theme.description}</p>
          )}

          <div className="community-modal-meta">
            {showStatus && (
              <span className={`community-modal-status community-modal-status-${theme.status}`}>
                {STATUS_LABELS[theme.status] ?? theme.status}
              </span>
            )}

            {theme.status === 'approved' && (
              <span className="community-modal-downloads">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {theme.download_count} installs
              </span>
            )}
          </div>

          {/* Color Swatches */}
          <div className="community-modal-swatches">
            {swatchColors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="community-modal-swatch"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        {theme.status === 'approved' && (
          <div className="community-modal-actions">
            {downloadError && (
              <span className="community-modal-error">{downloadError}</span>
            )}
            {isInstalled ? (
              <button
                className={`community-modal-install ${isUninstallHovering ? 'community-modal-uninstall' : 'community-modal-installed'}`}
                onClick={handleUninstall}
                onMouseEnter={() => setIsUninstallHovering(true)}
                onMouseLeave={() => setIsUninstallHovering(false)}
                disabled={isUninstalling}
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
                {isUninstalling ? 'Removing...' : (isUninstallHovering ? 'Uninstall Theme' : 'Installed')}
              </button>
            ) : (
              <button
                className="community-modal-install"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isDownloading ? 'Installing...' : 'Install Theme'}
              </button>
            )}
          </div>
        )}

        {theme.status === 'rejected' && theme.rejection_reason && (
          <div className="community-modal-rejection">
            <strong>Reason:</strong> {theme.rejection_reason}
          </div>
        )}
      </div>
    </div>
  );
};
