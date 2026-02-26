import React, { useState } from 'react';
import type { CommunityTheme } from '../lib/supabase';
import { ConfirmationDialog } from './ConfirmationDialog';

interface CommunityThemeCardProps {
  theme: CommunityTheme;
  onDownload: (theme: CommunityTheme) => Promise<void>;
  onClick?: (theme: CommunityTheme) => void;
  onCreatorClick?: (userId: string) => void;
  onDelete?: () => void;
  onUninstall?: (theme: CommunityTheme) => Promise<void>;
  showStatus?: boolean;
  isInstalled?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Not Approved',
};

export const CommunityThemeCard: React.FC<CommunityThemeCardProps> = ({
  theme,
  onDownload,
  onClick,
  onCreatorClick,
  onDelete,
  onUninstall,
  showStatus = false,
  isInstalled = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUninstallHovering, setIsUninstallHovering] = useState(false);

  const creatorName = theme.profiles?.display_name ?? 'Unknown';
  const swatchColors = theme.swatch_colors ?? [];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
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

  const handleUninstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUninstalling || !onUninstall) return;
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

  const handleCardClick = () => {
    onClick?.(theme);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (theme.status === 'pending') {
      setShowDeleteConfirm(true);
    } else {
      // Rejected: delete immediately, no confirmation
      onDelete?.();
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="community-card" onClick={handleCardClick}>
      <div className="community-card-preview">
        {theme.source_image_url ? (
          <img
            src={theme.source_image_url}
            alt={theme.name}
            className="community-card-image"
          />
        ) : (
          <div className="community-card-swatches">
            {swatchColors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="community-card-swatch"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="community-card-info">
        <div className="community-card-header">
          <h4 className="community-card-name">{theme.name}</h4>
          <span className="community-card-creator">
            by{' '}
            {theme.user_id && onCreatorClick ? (
              <button
                className="community-card-creator-link"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatorClick(theme.user_id!);
                }}
              >
                {creatorName}
              </button>
            ) : (
              creatorName
            )}
          </span>
        </div>

        <div className="community-card-swatches-row">
          {swatchColors.slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="community-card-swatch-item"
              style={{ backgroundColor: color }}
              title={['Surface', 'Text', 'Accent 1', 'Accent 2'][i]}
            />
          ))}
        </div>

        {showStatus && (
          <span className={`community-card-status community-card-status-${theme.status}`}>
            {STATUS_LABELS[theme.status] ?? theme.status}
          </span>
        )}

        {theme.status === 'approved' && (
          <span className="community-card-downloads">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {theme.download_count} installs
          </span>
        )}
      </div>

      {theme.status === 'approved' && (
        <div className="community-card-footer">
          <span className={`community-card-tone community-card-tone-${theme.tone}`}>
            {theme.tone === 'dark' ? 'Dark' : 'Light'}
          </span>
          {downloadError && <span className="community-card-error">{downloadError}</span>}
          {isInstalled ? (
            <button
              className={`community-card-install ${isUninstallHovering ? 'community-card-uninstall' : 'community-card-installed'}`}
              onClick={handleUninstall}
              onMouseEnter={() => setIsUninstallHovering(true)}
              onMouseLeave={() => setIsUninstallHovering(false)}
              disabled={isUninstalling}
            >
              {isUninstalling ? 'Removing...' : (
                <span className="community-card-button-content">
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
              className="community-card-install"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      )}

      {onDelete && theme.status !== 'approved' && (
        <button className="community-card-delete" onClick={handleDeleteClick} title="Remove submission">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Remove Submission?"
        message="If you remove this submission, it will no longer be reviewed by our team. Do you wish to continue?"
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};
