import { useState, useEffect, useCallback } from 'react';
import type { ThemeLibrary, SavedTheme } from '../types/theme-library';
import type { SemanticColorRoles } from '../theme/types';
import { generateTheme } from '../theme/derivation';
import { generateAskXml } from '../theme/ask-generator';

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
    const theme = library.themes.find(t => t.id === id);

    // Delete .ask file if theme is installed
    if (theme?.isInstalled && window.electronAPI) {
      await window.electronAPI.deleteLibraryThemeFile(theme.filePath);
    }

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

    // Only rename file on disk if installed
    if (theme.isInstalled) {
      const result = await window.electronAPI?.renameThemeFile(theme.filePath, newPath);
      if (!result?.success) {
        return { success: false, error: result?.error ?? 'Failed to rename file' };
      }
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

  /**
   * Regenerate .ask file and set isInstalled: true
   */
  const installTheme = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const theme = library.themes.find(t => t.id === id);
    if (!theme) return { success: false, error: 'Theme not found' };

    // Reconstruct SemanticColorRoles from saved data
    const roles: SemanticColorRoles = {
      tone: theme.tone,
      surface_base: theme.colors.surface_base,
      text_primary: theme.colors.text_primary,
      accent_primary: theme.colors.accent_primary,
      accent_secondary: theme.colors.accent_secondary,
      contrastLevel: theme.contrastLevel,
    };

    // Generate theme data and XML
    const themeData = generateTheme(roles);
    const xmlContent = generateAskXml(themeData);

    // Write file to disk
    const result = await window.electronAPI?.writeThemeFile(theme.filePath, xmlContent);
    if (!result?.success) {
      return { success: false, error: result?.error ?? 'Failed to write theme file' };
    }

    // Update library
    const updated = {
      ...library,
      themes: library.themes.map(t =>
        t.id === id ? { ...t, isInstalled: true } : t
      ),
    };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);

    return { success: true };
  }, [library]);

  /**
   * Delete .ask file and set isInstalled: false
   */
  const uninstallTheme = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const theme = library.themes.find(t => t.id === id);
    if (!theme) return { success: false, error: 'Theme not found' };

    // Delete file from disk
    const result = await window.electronAPI?.deleteLibraryThemeFile(theme.filePath);
    if (!result?.success) {
      return { success: false, error: result?.error ?? 'Failed to delete theme file' };
    }

    // Update library
    const updated = {
      ...library,
      themes: library.themes.map(t =>
        t.id === id ? { ...t, isInstalled: false } : t
      ),
    };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);

    return { success: true };
  }, [library]);

  /**
   * Sync install state: check if installed files exist, update state if missing.
   * Also handles migration: themes without isInstalled property get it set based on file existence.
   */
  const syncInstallState = useCallback(async () => {
    if (!window.electronAPI || library.themes.length === 0) return;

    let hasChanges = false;
    const updatedThemes = await Promise.all(
      library.themes.map(async (theme) => {
        const fileExists = await window.electronAPI!.checkFileExists(theme.filePath);

        // Migration: if isInstalled is undefined, set based on file existence
        if (theme.isInstalled === undefined) {
          hasChanges = true;
          return { ...theme, isInstalled: fileExists };
        }

        // If marked as installed but file is missing, update state
        if (theme.isInstalled && !fileExists) {
          hasChanges = true;
          return { ...theme, isInstalled: false };
        }

        return theme;
      })
    );

    if (hasChanges) {
      const updated = { ...library, themes: updatedThemes };
      setLibrary(updated);
      await window.electronAPI.saveThemeLibrary(updated);
    }
  }, [library]);

  return {
    library,
    isLoading,
    addTheme,
    removeTheme,
    renameTheme,
    installTheme,
    uninstallTheme,
    syncInstallState,
  };
}
