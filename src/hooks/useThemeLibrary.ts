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

  const renameTheme = useCallback(async (id: string, newName: string): Promise<{ success: boolean; error?: string }> => {
    const theme = library.themes.find(t => t.id === id);
    if (!theme) return { success: false, error: 'Theme not found' };

    // Get the directory and construct new path
    const lastSlash = theme.filePath.lastIndexOf('/');
    const backSlash = theme.filePath.lastIndexOf('\\');
    const separatorIndex = Math.max(lastSlash, backSlash);
    const dir = separatorIndex >= 0 ? theme.filePath.substring(0, separatorIndex) : '';
    const separator = lastSlash > backSlash ? '/' : '\\';
    const newPath = `${dir}${separator}${newName}.ask`;

    // Rename file on disk
    const result = await window.electronAPI?.renameThemeFile(theme.filePath, newPath);
    if (!result?.success) {
      return { success: false, error: result?.error ?? 'Failed to rename file' };
    }

    // Update library
    const updated = {
      ...library,
      themes: library.themes.map(t =>
        t.id === id ? { ...t, name: newName, filePath: newPath } : t
      ),
    };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);

    return { success: true };
  }, [library]);

  return { library, isLoading, addTheme, removeTheme, renameTheme };
}
