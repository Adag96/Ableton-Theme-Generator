import { useState, useEffect, useCallback } from 'react';
import type { CommunityInstallState, InstalledCommunityTheme } from '../types/community-install-state';

const defaultState: CommunityInstallState = { version: 1, themes: [] };

export function useCommunityInstallState() {
  const [state, setState] = useState<CommunityInstallState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.electronAPI?.loadCommunityInstallState().then((data) => {
      setState(data || defaultState);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const isInstalled = useCallback((themeId: string): boolean => {
    return state.themes.some((t) => t.themeId === themeId);
  }, [state.themes]);

  const getFilePath = useCallback((themeId: string): string | null => {
    const entry = state.themes.find((t) => t.themeId === themeId);
    return entry?.filePath ?? null;
  }, [state.themes]);

  const markInstalled = useCallback(async (themeId: string, filePath: string) => {
    // Avoid duplicates
    if (state.themes.some((t) => t.themeId === themeId)) {
      return;
    }

    const newEntry: InstalledCommunityTheme = {
      themeId,
      filePath,
      installedAt: new Date().toISOString(),
    };

    const updated: CommunityInstallState = {
      ...state,
      themes: [...state.themes, newEntry],
    };

    setState(updated);
    await window.electronAPI?.saveCommunityInstallState(updated);
  }, [state]);

  const markUninstalled = useCallback(async (themeId: string) => {
    const updated: CommunityInstallState = {
      ...state,
      themes: state.themes.filter((t) => t.themeId !== themeId),
    };

    setState(updated);
    await window.electronAPI?.saveCommunityInstallState(updated);
  }, [state]);

  /**
   * Verify installed files still exist on disk. Remove stale entries.
   */
  const syncWithFilesystem = useCallback(async () => {
    if (!window.electronAPI || state.themes.length === 0) return;

    let hasChanges = false;
    const validThemes: InstalledCommunityTheme[] = [];

    for (const entry of state.themes) {
      const exists = await window.electronAPI.checkFileExists(entry.filePath);
      if (exists) {
        validThemes.push(entry);
      } else {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      const updated: CommunityInstallState = { ...state, themes: validThemes };
      setState(updated);
      await window.electronAPI.saveCommunityInstallState(updated);
    }
  }, [state]);

  return {
    isLoading,
    isInstalled,
    getFilePath,
    markInstalled,
    markUninstalled,
    syncWithFilesystem,
  };
}
