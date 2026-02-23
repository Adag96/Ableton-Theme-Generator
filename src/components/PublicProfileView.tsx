import React, { useEffect, useState, useCallback } from 'react';
import { supabase, type Profile, type CommunityTheme } from '../lib/supabase';
import { SOCIAL_PLATFORMS, SOCIAL_ICONS } from '../lib/social-platforms';
import { useCommunityInstallState } from '../hooks/useCommunityInstallState';
import { CommunityThemeCard } from './CommunityThemeCard';
import { CommunityThemeDetailModal } from './CommunityThemeDetailModal';
import './PublicProfileView.css';

interface PublicProfileViewProps {
  userId: string;
  onBack: () => void;
  onThemeClick: (theme: CommunityTheme) => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  userId,
  onBack,
  onThemeClick,
}) => {
  const { isInstalled, markInstalled, markUninstalled, getFilePath, syncWithFilesystem } = useCommunityInstallState();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<CommunityTheme | null>(null);

  const fetchProfileAndThemes = useCallback(async () => {
    setIsLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setProfile(profileData);

    // Fetch approved themes by this user
    const { data: themesData } = await supabase
      .from('community_themes')
      .select('*, profiles(display_name)')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    setThemes(themesData ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfileAndThemes();
  }, [fetchProfileAndThemes]);

  // Sync install state with filesystem once on mount
  useEffect(() => {
    syncWithFilesystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async (theme: CommunityTheme) => {
    // Prevent duplicate downloads
    if (isInstalled(theme.id)) {
      return;
    }

    const result = await window.electronAPI.downloadCommunityTheme({
      url: theme.ask_file_url,
      name: theme.name,
    });

    if (result.success && result.filePath) {
      await markInstalled(theme.id, result.filePath);
      await supabase.rpc('increment_download_count', { theme_id: theme.id });
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

  const handleOpenUrl = (url: string) => {
    window.electronAPI?.openExternal(url);
  };

  const socialLinks = profile?.social_links ?? {};
  const activeSocialLinks = SOCIAL_PLATFORMS.filter((p) => socialLinks[p.key]);

  if (isLoading) {
    return (
      <div className="public-profile-view">
        <button className="public-profile-back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div className="public-profile-loading">
          <div className="public-profile-spinner" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="public-profile-view">
        <button className="public-profile-back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div className="public-profile-not-found">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profile-view">
      <button className="public-profile-back-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <div className="public-profile-header">
        <div className="public-profile-avatar">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h2 className="public-profile-name">{profile.display_name}</h2>

        {profile.bio && (
          <p className="public-profile-bio">{profile.bio}</p>
        )}

        {activeSocialLinks.length > 0 && (
          <div className="public-profile-social-links">
            {activeSocialLinks.map((platform) => (
              <button
                key={platform.key}
                className="public-profile-social-link"
                onClick={() => handleOpenUrl(socialLinks[platform.key]!)}
                title={platform.label}
              >
                {SOCIAL_ICONS[platform.key]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="public-profile-themes-section">
        <h3 className="public-profile-themes-title">
          Themes by {profile.display_name}
        </h3>

        {themes.length === 0 ? (
          <div className="public-profile-themes-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
            <p>No published themes yet</p>
          </div>
        ) : (
          <div className="public-profile-themes-grid">
            {themes.map((theme) => (
              <CommunityThemeCard
                key={theme.id}
                theme={theme}
                onDownload={handleDownload}
                onUninstall={handleUninstall}
                onClick={(t) => {
                  setSelectedTheme(t);
                  onThemeClick(t);
                }}
                isInstalled={isInstalled(theme.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CommunityThemeDetailModal
        isOpen={selectedTheme !== null}
        theme={selectedTheme}
        onClose={() => setSelectedTheme(null)}
        onDownload={handleDownload}
        onUninstall={handleUninstall}
        isInstalled={selectedTheme ? isInstalled(selectedTheme.id) : false}
      />
    </div>
  );
};
