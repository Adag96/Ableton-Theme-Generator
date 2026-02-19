import React, { useState } from 'react';
import type { CommunityTheme } from '../lib/supabase';

interface CommunityThemeCardProps {
  theme: CommunityTheme;
  onDownload: (theme: CommunityTheme) => Promise<void>;
  showStatus?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Not Approved',
};

export const CommunityThemeCard: React.FC<CommunityThemeCardProps> = ({
  theme,
  onDownload,
  showStatus = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const creatorName = theme.profiles?.display_name ?? 'Unknown';
  const swatchColors = theme.swatch_colors ?? [];

  const handleDownload = async () => {
    if (isDownloading) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      await onDownload(theme);
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 3000);
    } catch {
      setDownloadError('Install failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="community-card">
      <div className="community-card-preview">
        {theme.preview_image_url ? (
          <img
            src={theme.preview_image_url}
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
        <h4 className="community-card-name">{theme.name}</h4>
        <p className="community-card-creator">by {creatorName}</p>

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
          {downloadError && <span className="community-card-error">{downloadError}</span>}
          <button
            className={`community-card-install ${downloadDone ? 'community-card-install-done' : ''}`}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Installing...' : downloadDone ? 'Installed!' : 'Install'}
          </button>
        </div>
      )}
    </div>
  );
};
