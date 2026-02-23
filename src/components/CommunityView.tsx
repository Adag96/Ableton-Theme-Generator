import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type CommunityTheme } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useCommunityInstallState } from '../hooks/useCommunityInstallState';
import { CommunityThemeCard } from './CommunityThemeCard';
import { CommunityThemeDetailModal } from './CommunityThemeDetailModal';
import './CommunityView.css';

type Tab = 'gallery' | 'submissions';

interface CommunityViewProps {
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onBack, onViewProfile }) => {
  const { user } = useAuth();
  const { isInstalled, markInstalled, markUninstalled, getFilePath, syncWithFilesystem } = useCommunityInstallState();
  const [tab, setTab] = useState<Tab>('gallery');
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [mySubmissions, setMySubmissions] = useState<CommunityTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<CommunityTheme | null>(null);

  const fetchGallery = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('community_themes')
      .select('*, profiles(display_name)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });
    setThemes(data ?? []);
    setIsLoading(false);
  }, []);

  const fetchMySubmissions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('community_themes')
      .select('*, profiles(display_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMySubmissions(data ?? []);
  }, [user]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Sync install state with filesystem once on mount
  useEffect(() => {
    syncWithFilesystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchMySubmissions();
    } else {
      setMySubmissions([]);
      if (tab === 'submissions') setTab('gallery');
    }
  }, [user, fetchMySubmissions, tab]);

  const handleDownload = async (theme: CommunityTheme) => {
    // Prevent duplicate downloads - if already installed, skip
    if (isInstalled(theme.id)) {
      return;
    }

    const result = await window.electronAPI.downloadCommunityTheme({
      url: theme.ask_file_url,
      name: theme.name,
    });

    if (result.success && result.filePath) {
      // Track installation state
      await markInstalled(theme.id, result.filePath);
      // Increment download count in DB (fire-and-forget)
      await supabase.rpc('increment_download_count', { theme_id: theme.id });
      // Optimistically update the count in state
      setThemes((prev) =>
        prev.map((t) =>
          t.id === theme.id ? { ...t, download_count: t.download_count + 1 } : t
        )
      );
    } else {
      throw new Error(result.error ?? 'Install failed');
    }
  };

  const handleUninstall = async (theme: CommunityTheme) => {
    const filePath = getFilePath(theme.id);
    if (!filePath) return;

    const result = await window.electronAPI.deleteLibraryThemeFile(filePath);
    if (result.success) {
      await markUninstalled(theme.id);
    } else {
      throw new Error(result.error ?? 'Uninstall failed');
    }
  };

  const handleDeleteSubmission = async (themeId: string) => {
    const { error } = await supabase
      .from('community_themes')
      .delete()
      .eq('id', themeId);

    if (error) {
      console.error('Failed to delete submission:', error);
      return;
    }

    // Remove from local state
    setMySubmissions((prev) => prev.filter((t) => t.id !== themeId));
  };

  // Split submissions into approved and non-approved sections
  const approvedSubmissions = mySubmissions.filter((t) => t.status === 'approved');
  const nonApprovedSubmissions = mySubmissions.filter((t) => t.status !== 'approved');

  return (
    <div className="community-view">
      <div className="community-header">
        <button className="community-back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <h2 className="community-title">Community Gallery</h2>

        {/* Spacer for layout balance */}
        <div className="community-header-spacer" />
      </div>

      {user && (
        <div className="community-tabs">
          <button
            className={`community-tab ${tab === 'gallery' ? 'community-tab-active' : ''}`}
            onClick={() => setTab('gallery')}
          >
            Gallery
          </button>
          <button
            className={`community-tab ${tab === 'submissions' ? 'community-tab-active' : ''}`}
            onClick={() => setTab('submissions')}
          >
            My Submissions
          </button>
        </div>
      )}

      <div className="community-content">
        {isLoading ? (
          <div className="community-loading">
            <div className="community-loading-spinner" />
            Loading themes…
          </div>
        ) : tab === 'gallery' ? (
          // Gallery view
          themes.length === 0 ? (
            <div className="community-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
              </svg>
              <p>No themes in the gallery yet. Be the first to submit!</p>
            </div>
          ) : (
            <div className="community-grid">
              {themes.map((theme) => (
                <CommunityThemeCard
                  key={theme.id}
                  theme={theme}
                  onDownload={handleDownload}
                  onUninstall={handleUninstall}
                  onClick={setSelectedTheme}
                  onCreatorClick={onViewProfile}
                  isInstalled={isInstalled(theme.id)}
                />
              ))}
            </div>
          )
        ) : (
          // My Submissions view - sectioned
          mySubmissions.length === 0 ? (
            <div className="community-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
              </svg>
              <p>You haven't submitted any themes yet.</p>
            </div>
          ) : (
            <div className="my-submissions-sections">
              {approvedSubmissions.length > 0 && (
                <div className="my-submissions-section">
                  <h3 className="my-submissions-section-header">Approved</h3>
                  <div className="community-grid">
                    {approvedSubmissions.map((theme) => (
                      <CommunityThemeCard
                        key={theme.id}
                        theme={theme}
                        onDownload={handleDownload}
                        onUninstall={handleUninstall}
                        onClick={setSelectedTheme}
                        onCreatorClick={onViewProfile}
                        isInstalled={isInstalled(theme.id)}
                        showStatus
                      />
                    ))}
                  </div>
                </div>
              )}

              {nonApprovedSubmissions.length > 0 && (
                <div className="my-submissions-section">
                  <h3 className="my-submissions-section-header">Not Approved</h3>
                  <div className="community-grid">
                    {nonApprovedSubmissions.map((theme) => (
                      <CommunityThemeCard
                        key={theme.id}
                        theme={theme}
                        onDownload={handleDownload}
                        onClick={setSelectedTheme}
                        onCreatorClick={onViewProfile}
                        onDelete={() => handleDeleteSubmission(theme.id)}
                        showStatus
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      <CommunityThemeDetailModal
        isOpen={selectedTheme !== null}
        theme={selectedTheme}
        onClose={() => setSelectedTheme(null)}
        onDownload={handleDownload}
        onUninstall={handleUninstall}
        onCreatorClick={onViewProfile}
        showStatus={tab === 'submissions'}
        isInstalled={selectedTheme ? isInstalled(selectedTheme.id) : false}
      />
    </div>
  );
};
