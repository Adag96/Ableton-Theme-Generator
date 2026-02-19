import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type CommunityTheme } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { CommunityThemeCard } from './CommunityThemeCard';
import { AuthModal } from './AuthModal';
import './CommunityView.css';

type Tab = 'gallery' | 'submissions';

interface CommunityViewProps {
  onBack: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onBack }) => {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('gallery');
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [mySubmissions, setMySubmissions] = useState<CommunityTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  useEffect(() => {
    if (user) {
      fetchMySubmissions();
    } else {
      setMySubmissions([]);
      if (tab === 'submissions') setTab('gallery');
    }
  }, [user, fetchMySubmissions, tab]);

  const handleDownload = async (theme: CommunityTheme) => {
    const result = await window.electronAPI.downloadCommunityTheme({
      url: theme.ask_file_url,
      name: theme.name,
    });

    if (result.success) {
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

  const displayedThemes = tab === 'gallery' ? themes : mySubmissions;

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

        <div className="community-auth-area">
          {user ? (
            <div className="community-user-info">
              <span className="community-username">{profile?.display_name ?? user.email}</span>
              <button className="community-sign-out" onClick={signOut}>
                Sign Out
              </button>
            </div>
          ) : (
            <button className="community-sign-in-button" onClick={() => setShowAuthModal(true)}>
              Sign In
            </button>
          )}
        </div>
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
        ) : displayedThemes.length === 0 ? (
          <div className="community-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
            <p>
              {tab === 'gallery'
                ? 'No themes in the gallery yet. Be the first to submit!'
                : "You haven't submitted any themes yet."}
            </p>
          </div>
        ) : (
          <div className="community-grid">
            {displayedThemes.map((theme) => (
              <CommunityThemeCard
                key={theme.id}
                theme={theme}
                onDownload={handleDownload}
                showStatus={tab === 'submissions'}
              />
            ))}
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};
