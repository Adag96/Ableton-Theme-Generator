import React, { useState } from 'react';
import type { CommunityTheme } from '../../lib/supabase';

interface AdminThemeCardProps {
  theme: CommunityTheme;
  onTestTheme?: (theme: CommunityTheme) => Promise<{ success: boolean; error?: string }>;
  onReview?: (theme: CommunityTheme) => void;
  onDelete?: () => void;
  isTestInstalled?: boolean;
  isApproved?: boolean;
}

export const AdminThemeCard: React.FC<AdminThemeCardProps> = ({
  theme,
  onTestTheme,
  onReview,
  onDelete,
  isTestInstalled = false,
  isApproved = false,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const creatorName = theme.profiles?.display_name ?? 'Unknown';
  const creatorEmail = theme.user_id ? `User ID: ${theme.user_id.slice(0, 8)}...` : '';
  const swatchColors = theme.swatch_colors ?? [];
  const submittedDate = new Date(theme.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleTestClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInstalling || !onTestTheme) return;
    setTestError(null);
    setIsInstalling(true);

    const result = await onTestTheme(theme);
    if (!result.success) {
      setTestError(result.error ?? 'Test install failed');
    }
    setIsInstalling(false);
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReview?.(theme);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div className="admin-card">
      <div className="admin-card-preview">
        {theme.source_image_url ? (
          <img
            src={theme.source_image_url}
            alt={theme.name}
            className="admin-card-image"
          />
        ) : (
          <div className="admin-card-swatches-grid">
            {swatchColors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="admin-card-swatch-block"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="admin-card-content">
        <div className="admin-card-header">
          <h4 className="admin-card-name">{theme.name}</h4>
          <span className="admin-card-date">{submittedDate}</span>
        </div>

        <div className="admin-card-meta">
          <span className="admin-card-creator">by {creatorName}</span>
          {creatorEmail && <span className="admin-card-user-id">{creatorEmail}</span>}
        </div>

        <div className="admin-card-swatches-row">
          {swatchColors.slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="admin-card-swatch-item"
              style={{ backgroundColor: color }}
              title={['Surface', 'Text', 'Accent 1', 'Accent 2'][i]}
            />
          ))}
        </div>

        {theme.description && (
          <p className="admin-card-description">{theme.description}</p>
        )}

        {theme.tone && (
          <span className={`admin-card-tone admin-card-tone-${theme.tone}`}>
            {theme.tone === 'dark' ? 'Dark' : 'Light'}
          </span>
        )}

        {testError && <p className="admin-card-error">{testError}</p>}

        <div className="admin-card-actions">
          {isApproved ? (
            <button
              className="admin-card-delete"
              onClick={handleDeleteClick}
            >
              Delete
            </button>
          ) : (
            <>
              <button
                className={`admin-card-test ${isTestInstalled ? 'admin-card-test-installed' : ''}`}
                onClick={handleTestClick}
                disabled={isInstalling || isTestInstalled}
              >
                {isInstalling ? 'Installing...' : isTestInstalled ? 'Test Installed' : 'Test Theme'}
              </button>
              <button
                className="admin-card-review"
                onClick={handleReviewClick}
              >
                Review
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
