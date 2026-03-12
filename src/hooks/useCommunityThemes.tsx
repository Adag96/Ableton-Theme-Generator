import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase, type CommunityTheme } from '../lib/supabase';

// Revalidate if data is older than 30 seconds
const STALE_THRESHOLD_MS = 30_000;

interface CommunityThemesContextType {
  themes: CommunityTheme[];
  isLoading: boolean;        // True only on initial load (no cached data)
  isRevalidating: boolean;   // True during background refresh
  lastFetchedAt: number | null;
  revalidate: () => Promise<void>;
  updateThemeInCache: (id: string, partial: Partial<CommunityTheme>) => void;
}

const CommunityThemesContext = createContext<CommunityThemesContextType | null>(null);

export function CommunityThemesProvider({ children }: { children: React.ReactNode }) {
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const isFetching = useRef(false);

  const fetchThemes = useCallback(async (isBackground: boolean) => {
    // Prevent concurrent fetches
    if (isFetching.current) return;
    isFetching.current = true;

    if (isBackground) {
      setIsRevalidating(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { data } = await supabase
        .from('community_themes')
        .select('*, profiles(display_name)')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      setThemes(data ?? []);
      setLastFetchedAt(Date.now());
    } finally {
      isFetching.current = false;
      setIsLoading(false);
      setIsRevalidating(false);
    }
  }, []);

  const revalidate = useCallback(async () => {
    const hasCache = themes.length > 0;
    await fetchThemes(hasCache);
  }, [fetchThemes, themes.length]);

  // Initial fetch on mount
  useEffect(() => {
    if (lastFetchedAt === null && !isFetching.current) {
      fetchThemes(false);
    }
  }, [fetchThemes, lastFetchedAt]);

  // Optimistic update for download count changes, etc.
  const updateThemeInCache = useCallback((id: string, partial: Partial<CommunityTheme>) => {
    setThemes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...partial } : t))
    );
  }, []);

  return (
    <CommunityThemesContext.Provider
      value={{
        themes,
        isLoading,
        isRevalidating,
        lastFetchedAt,
        revalidate,
        updateThemeInCache,
      }}
    >
      {children}
    </CommunityThemesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommunityThemes(): CommunityThemesContextType {
  const ctx = useContext(CommunityThemesContext);
  if (!ctx) throw new Error('useCommunityThemes must be used within CommunityThemesProvider');

  const hasRevalidatedOnMount = useRef(false);

  // Revalidate on mount if data is potentially stale
  useEffect(() => {
    if (hasRevalidatedOnMount.current) return;
    if (ctx.isLoading || ctx.isRevalidating) return;

    // Must have completed initial fetch (lastFetchedAt is set)
    if (ctx.lastFetchedAt === null) return;

    hasRevalidatedOnMount.current = true;

    // Check if data might be stale
    const timeSinceLastFetch = Date.now() - ctx.lastFetchedAt;

    if (timeSinceLastFetch > STALE_THRESHOLD_MS) {
      ctx.revalidate();
    }
  }, [ctx]);

  return ctx;
}
