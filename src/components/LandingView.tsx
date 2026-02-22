import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type CommunityTheme } from '../lib/supabase';
import { CommunityThemeCard } from './CommunityThemeCard';
import { CommunityThemeDetailModal } from './CommunityThemeDetailModal';
import './LandingView.css';

interface LandingViewProps {
  onImportImage: () => void;
  onBrowseThemes: () => void;
  onCommunity: () => void;
  onSettings: () => void;
}

const CAROUSEL_VISIBLE_COUNT = 4;
const CAROUSEL_INTERVAL_MS = 3000;

export const LandingView: React.FC<LandingViewProps> = ({
  onImportImage,
  onBrowseThemes,
  onCommunity,
  onSettings,
}) => {
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<CommunityTheme | null>(null);

  const fetchFeaturedThemes = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('community_themes')
      .select('*, profiles(display_name)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(15);
    setThemes(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFeaturedThemes();
  }, [fetchFeaturedThemes]);

  // Auto-cycle carousel
  useEffect(() => {
    if (isPaused || themes.length <= CAROUSEL_VISIBLE_COUNT) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % themes.length);
    }, CAROUSEL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused, themes.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + themes.length) % themes.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % themes.length);
  };

  const getVisibleThemes = (): CommunityTheme[] => {
    if (themes.length === 0) return [];
    if (themes.length <= CAROUSEL_VISIBLE_COUNT) return themes;

    const visible: CommunityTheme[] = [];
    for (let i = 0; i < CAROUSEL_VISIBLE_COUNT; i++) {
      visible.push(themes[(currentIndex + i) % themes.length]);
    }
    return visible;
  };

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

  const showArrows = themes.length > CAROUSEL_VISIBLE_COUNT;

  return (
    <div className="landing-view">
      {/* Carousel Section */}
      <section className="landing-carousel-section">
        <div className="landing-carousel-header">
          <h2>Featured Themes</h2>
          <button className="landing-browse-button" onClick={onCommunity}>
            Browse Themes
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="landing-carousel-loading">
            <div className="landing-carousel-spinner" />
            Loading themes...
          </div>
        ) : themes.length === 0 ? (
          <div className="landing-carousel-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
            <p>Community themes coming soon!</p>
          </div>
        ) : (
          <div
            className="landing-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {showArrows && (
              <button
                className="carousel-arrow carousel-arrow-left"
                onClick={handlePrev}
                aria-label="Previous themes"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div className="carousel-track">
              {getVisibleThemes().map((theme) => (
                <CommunityThemeCard
                  key={theme.id}
                  theme={theme}
                  onDownload={handleDownload}
                  onClick={setSelectedTheme}
                />
              ))}
            </div>
            {showArrows && (
              <button
                className="carousel-arrow carousel-arrow-right"
                onClick={handleNext}
                aria-label="Next themes"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 3-Column Button Row */}
      <div className="landing-buttons">
        <button className="landing-button" onClick={onImportImage}>
          <div className="landing-button-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <h3>Create Theme</h3>
          <p>Import an image to generate custom Ableton Live 12 themes</p>
        </button>

        <button className="landing-button" onClick={onBrowseThemes}>
          <div className="landing-button-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>My Themes</h3>
          <p>View and manage your generated theme library</p>
        </button>

        <button className="landing-button" onClick={onSettings}>
          <div className="landing-button-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h3>Settings</h3>
          <p>Configure theme generation preferences and Ableton directory</p>
        </button>
      </div>

      <CommunityThemeDetailModal
        isOpen={selectedTheme !== null}
        theme={selectedTheme}
        onClose={() => setSelectedTheme(null)}
        onDownload={handleDownload}
      />
    </div>
  );
};
