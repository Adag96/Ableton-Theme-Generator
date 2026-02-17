import { useState, useEffect, useCallback } from 'react';
import type { ThemeLibrary, SavedTheme } from '../types/theme-library';

const defaultLibrary: ThemeLibrary = { version: 1, themes: [] };

export function useThemeLibrary() {
  const [library, setLibrary] = useState<ThemeLibrary>(defaultLibrary);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.electronAPI?.loadThemeLibrary().then((data) => {
      setLibrary(data || defaultLibrary);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const addTheme = useCallback(async (theme: SavedTheme) => {
    const updated = { ...library, themes: [...library.themes, theme] };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);
  }, [library]);

  const removeTheme = useCallback(async (id: string) => {
    const updated = { ...library, themes: library.themes.filter(t => t.id !== id) };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);
  }, [library]);

  return { library, isLoading, addTheme, removeTheme };
}
