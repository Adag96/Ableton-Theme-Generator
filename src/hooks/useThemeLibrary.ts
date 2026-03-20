import { useState, useEffect, useCallback } from 'react';
import type { ThemeLibrary, SavedTheme } from '../types/theme-library';
import type { SemanticColorRoles } from '../theme/types';
import { generateTheme } from '../theme/derivation';
import { generateAskXml } from '../theme/ask-generator';
import type { CommunityTheme } from '../lib/supabase';

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

    if (theme && window.electronAPI) {
      // Delete .ask file if theme is installed
      if (theme.isInstalled) {
        await window.electronAPI.deleteLibraryThemeFile(theme.filePath);
      }

      // Delete cached source image if it exists
      await window.electronAPI.deleteSourceImage(theme.id);

      // Delete cached preview image if it exists
      await window.electronAPI.deletePreviewImage(theme.id);
    }

    const updated = { ...library, themes: library.themes.filter(t => t.id !== id) };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);
  }, [library]);

  const updateTheme = useCallback(async (
    id: string,
    updates: Partial<Pick<SavedTheme, 'colors' | 'tone' | 'contrastLevel' | 'hueInjection' | 'previewImagePath' | 'roleLocations' | 'originalColors' | 'moodSliders'>>
  ): Promise<{ success: boolean; error?: string }> => {
    const theme = library.themes.find(t => t.id === id);
    if (!theme) return { success: false, error: 'Theme not found' };

    // Merge updates into theme
    const updatedTheme: SavedTheme = {
      ...theme,
      ...updates,
      colors: updates.colors ?? theme.colors,
    };

    // Regenerate and write .ask file if theme is installed
    if (updatedTheme.isInstalled) {
      const roles: SemanticColorRoles = {
        tone: updatedTheme.tone,
        surface_base: updatedTheme.colors.surface_base,
        text_primary: updatedTheme.colors.text_primary,
        accent_primary: updatedTheme.colors.accent_primary,
        accent_secondary: updatedTheme.colors.accent_secondary,
        contrastLevel: updatedTheme.contrastLevel,
        hueInjection: updatedTheme.hueInjection,
      };

      const themeData = generateTheme(roles);
      const xmlContent = generateAskXml(themeData);

      // Use update-theme-file (delete+recreate) for better file change detection
      const result = await window.electronAPI?.updateThemeFile(updatedTheme.filePath, xmlContent);
      if (!result?.success) {
        return { success: false, error: result?.error ?? 'Failed to write theme file' };
      }
    }

    // Update library
    const updated = {
      ...library,
      themes: library.themes.map(t => t.id === id ? updatedTheme : t),
    };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);

    return { success: true };
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
      hueInjection: theme.hueInjection,
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
   * Also handles migration and cleanup:
   * - Themes without isInstalled property get it set based on file existence
   * - Community-downloaded themes that are uninstalled get removed (can re-download)
   */
  const syncInstallState = useCallback(async () => {
    if (!window.electronAPI || library.themes.length === 0) return;

    let hasChanges = false;
    const themesToKeep: SavedTheme[] = [];
    const themesToRemove: SavedTheme[] = [];

    for (const theme of library.themes) {
      const fileExists = await window.electronAPI.checkFileExists(theme.filePath);
      let updatedTheme = theme;

      // Migration: if isInstalled is undefined, set based on file existence
      if (theme.isInstalled === undefined) {
        hasChanges = true;
        updatedTheme = { ...theme, isInstalled: fileExists };
      }
      // If marked as installed but file is missing, update state
      else if (theme.isInstalled && !fileExists) {
        hasChanges = true;
        updatedTheme = { ...theme, isInstalled: false };
      }

      // Cleanup: remove community-downloaded themes that are uninstalled
      // (user can re-download them anytime from the community gallery)
      if (updatedTheme.fromCommunity && !updatedTheme.isInstalled) {
        hasChanges = true;
        themesToRemove.push(updatedTheme);
      } else {
        themesToKeep.push(updatedTheme);
      }
    }

    if (hasChanges) {
      // Clean up cached source images for removed themes
      for (const theme of themesToRemove) {
        await window.electronAPI.deleteSourceImage(theme.id);
      }

      const updated = { ...library, themes: themesToKeep };
      setLibrary(updated);
      await window.electronAPI.saveThemeLibrary(updated);
    }
  }, [library]);

  /**
   * Download a community theme and add it to the local library.
   * If the theme already exists (by ID), just toggle its install state.
   */
  const addThemeFromCommunity = useCallback(async (
    communityTheme: CommunityTheme
  ): Promise<{ success: boolean; error?: string }> => {
    // Check if theme already exists in library (user submitted their own theme, or re-downloading)
    const existingTheme = library.themes.find(t => t.id === communityTheme.id);

    if (existingTheme) {
      // Theme already in library - just install it if not installed
      if (!existingTheme.isInstalled) {
        return installTheme(existingTheme.id);
      }
      return { success: true }; // Already installed
    }

    // Download the theme file
    const downloadResult = await window.electronAPI?.downloadCommunityTheme({
      url: communityTheme.ask_file_url,
      name: communityTheme.name,
    });

    if (!downloadResult?.success || !downloadResult.filePath) {
      return { success: false, error: downloadResult?.error ?? 'Download failed' };
    }

    // Map swatch_colors array to structured colors object
    // Order: [surface_base, text_primary, accent_primary, accent_secondary]
    const colors = {
      surface_base: communityTheme.swatch_colors[0] ?? '#1a1a1a',
      text_primary: communityTheme.swatch_colors[1] ?? '#ffffff',
      accent_primary: communityTheme.swatch_colors[2] ?? '#ff5500',
      accent_secondary: communityTheme.swatch_colors[3] ?? '#00aaff',
    };

    // Create SavedTheme entry
    const newTheme: SavedTheme = {
      id: communityTheme.id,
      name: communityTheme.name,
      createdAt: new Date().toISOString(),
      createdBy: communityTheme.user_id ?? undefined,
      filePath: downloadResult.filePath,
      tone: communityTheme.tone ?? 'dark',
      colors,
      isInstalled: true,
      fromCommunity: true,
      generationVersion: communityTheme.generation_version ?? 1,
    };

    // Add to library
    const updated = { ...library, themes: [...library.themes, newTheme] };
    setLibrary(updated);
    await window.electronAPI?.saveThemeLibrary(updated);

    return { success: true };
  }, [library, installTheme]);

  /**
   * Check if a theme (by ID) exists in the local library and is installed
   */
  const isThemeInstalled = useCallback((themeId: string): boolean => {
    const theme = library.themes.find(t => t.id === themeId);
    return theme?.isInstalled ?? false;
  }, [library.themes]);

  /**
   * Get a theme from the library by ID
   */
  const getThemeById = useCallback((themeId: string): SavedTheme | undefined => {
    return library.themes.find(t => t.id === themeId);
  }, [library.themes]);

  return {
    library,
    isLoading,
    addTheme,
    removeTheme,
    updateTheme,
    renameTheme,
    installTheme,
    uninstallTheme,
    syncInstallState,
    addThemeFromCommunity,
    isThemeInstalled,
    getThemeById,
  };
}
