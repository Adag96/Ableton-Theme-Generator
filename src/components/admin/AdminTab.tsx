import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type CommunityTheme } from '../../lib/supabase';
import { AdminThemeCard } from './AdminThemeCard';
import { AdminReviewModal } from './AdminReviewModal';
import { ConfirmationDialog } from '../ConfirmationDialog';
import './admin.css';

export const AdminTab: React.FC = () => {
  const [pendingThemes, setPendingThemes] = useState<CommunityTheme[]>([]);
  const [approvedThemes, setApprovedThemes] = useState<CommunityTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingTheme, setReviewingTheme] = useState<CommunityTheme | null>(null);
  const [installedReviewPath, setInstalledReviewPath] = useState<string | null>(null);
  const [deletingTheme, setDeletingTheme] = useState<CommunityTheme | null>(null);

  const fetchThemes = useCallback(async () => {
    setIsLoading(true);

    // Fetch pending themes
    const { data: pending, error: pendingError } = await supabase
      .from('community_themes')
      .select('*, profiles(display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }); // Oldest first (FIFO queue)

    if (pendingError) {
      console.error('Failed to fetch pending themes:', pendingError);
    }
    setPendingThemes(pending ?? []);

    // Fetch approved themes
    const { data: approved, error: approvedError } = await supabase
      .from('community_themes')
      .select('*, profiles(display_name)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false }); // Most recent first

    if (approvedError) {
      console.error('Failed to fetch approved themes:', approvedError);
    }
    setApprovedThemes(approved ?? []);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleTestTheme = async (theme: CommunityTheme) => {
    const result = await window.electronAPI.installReviewTheme({
      themeName: theme.name,
      askFileUrl: theme.ask_file_url,
    });

    if (result.success && result.filePath) {
      setInstalledReviewPath(result.filePath);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleReview = (theme: CommunityTheme) => {
    setReviewingTheme(theme);
  };

  const handleCloseReview = () => {
    setReviewingTheme(null);
  };

  const handleReviewComplete = async () => {
    // Clean up test file if installed
    if (installedReviewPath) {
      await window.electronAPI.cleanupReviewTheme({ filePath: installedReviewPath });
      setInstalledReviewPath(null);
    }
    setReviewingTheme(null);
    // Refresh list
    fetchThemes();
  };

  const handleDeleteTheme = async () => {
    if (!deletingTheme) return;

    const { error } = await supabase
      .from('community_themes')
      .delete()
      .eq('id', deletingTheme.id);

    if (error) {
      console.error('Failed to delete theme:', error);
    } else {
      // Refresh list
      fetchThemes();
    }
    setDeletingTheme(null);
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        Loading themes...
      </div>
    );
  }

  return (
    <div className="admin-tab">
      {/* Pending Themes Section */}
      <div className="admin-section">
        <h3 className="admin-section-title">Pending Review ({pendingThemes.length})</h3>
        {pendingThemes.length === 0 ? (
          <div className="admin-section-empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>No themes pending review</span>
          </div>
        ) : (
          <div className="admin-grid">
            {pendingThemes.map((theme) => (
              <AdminThemeCard
                key={theme.id}
                theme={theme}
                onTestTheme={handleTestTheme}
                onReview={handleReview}
                isTestInstalled={installedReviewPath?.includes(theme.name.replace(/[/\\:*?"<>|]/g, '_')) ?? false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approved Themes Section */}
      <div className="admin-section">
        <h3 className="admin-section-title">Approved ({approvedThemes.length})</h3>
        {approvedThemes.length === 0 ? (
          <div className="admin-section-empty">
            <span>No approved themes yet</span>
          </div>
        ) : (
          <div className="admin-grid">
            {approvedThemes.map((theme) => (
              <AdminThemeCard
                key={theme.id}
                theme={theme}
                onDelete={() => setDeletingTheme(theme)}
                isApproved
              />
            ))}
          </div>
        )}
      </div>

      {reviewingTheme && (
        <AdminReviewModal
          theme={reviewingTheme}
          onClose={handleCloseReview}
          onComplete={handleReviewComplete}
          installedReviewPath={installedReviewPath}
        />
      )}

      <ConfirmationDialog
        isOpen={deletingTheme !== null}
        title="Delete Theme?"
        message={`Are you sure you want to delete "${deletingTheme?.name}"? This will remove it from the gallery permanently.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteTheme}
        onCancel={() => setDeletingTheme(null)}
      />
    </div>
  );
};
