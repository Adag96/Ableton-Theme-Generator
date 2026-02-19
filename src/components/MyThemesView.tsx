import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { SavedTheme } from '../types/theme-library';
import { ThemeCard } from './ThemeCard';
import { ThemeDetailModal } from './ThemeDetailModal';
import './MyThemesView.css';

type ToneFilter = 'all' | 'dark' | 'light';
type SortOption = 'recent' | 'oldest' | 'a-z' | 'z-a';

const STORAGE_KEY = 'myThemes.preferences';

const SORT_LABELS: Record<SortOption, string> = {
  'recent': 'Recent',
  'oldest': 'Oldest',
  'a-z': 'A-Z',
  'z-a': 'Z-A',
};

interface MyThemesViewProps {
  themes: SavedTheme[];
  onBack: () => void;
  onDeleteTheme: (id: string) => void;
  onRenameTheme: (id: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  onInstallTheme: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUninstallTheme: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const MyThemesView: React.FC<MyThemesViewProps> = ({
  themes,
  onBack,
  onDeleteTheme,
  onRenameTheme,
  onInstallTheme,
  onUninstallTheme,
}) => {
  const [filter, setFilter] = useState<ToneFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { filter: savedFilter, sortBy: savedSort } = JSON.parse(saved);
        if (savedFilter) setFilter(savedFilter);
        if (savedSort) setSortBy(savedSort);
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ filter, sortBy }));
  }, [filter, sortBy]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Filter and split themes into installed/available
  const { installedThemes, availableThemes } = useMemo(() => {
    // Sort function
    const sortThemes = (themesToSort: SavedTheme[]) => {
      switch (sortBy) {
        case 'recent':
          return [...themesToSort].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        case 'oldest':
          return [...themesToSort].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'a-z':
          return [...themesToSort].sort((a, b) =>
            a.name.localeCompare(b.name));
        case 'z-a':
          return [...themesToSort].sort((a, b) =>
            b.name.localeCompare(a.name));
        default:
          return themesToSort;
      }
    };

    let filtered = themes;

    // Filter by tone
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.tone === filter);
    }

    // Split into installed and available
    const installed = sortThemes(filtered.filter(t => t.isInstalled));
    const available = sortThemes(filtered.filter(t => !t.isInstalled));

    return { installedThemes: installed, availableThemes: available };
  }, [themes, filter, sortBy]);

  // Contextual empty state message
  const emptyMessage = useMemo(() => {
    if (themes.length === 0) {
      return { text: 'No themes saved yet', hint: 'Generate a theme from an image to get started' };
    }
    if (installedThemes.length === 0 && availableThemes.length === 0) {
      if (filter === 'dark') {
        return { text: 'No dark themes yet', hint: 'Generate a dark theme to see it here' };
      }
      if (filter === 'light') {
        return { text: 'No light themes yet', hint: 'Generate a light theme to see it here' };
      }
    }
    return null;
  }, [themes.length, filter, installedThemes.length, availableThemes.length]);

  const hasThemes = themes.length > 0;

  // Derive selectedTheme from ID
  const selectedTheme = selectedThemeId ? themes.find(t => t.id === selectedThemeId) ?? null : null;

  const handleDownload = async (theme: SavedTheme) => {
    const fileName = `${theme.name}.ask`;
    const result = await window.electronAPI?.copyThemeToDownloads(theme.filePath, fileName);
    if (!result?.success) {
      console.error('Download failed:', result?.error);
    }
  };

  return (
    <div className="my-themes-view">
      <div className="my-themes-header">
        <button className="my-themes-back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div className="my-themes-toolbar">
          <h2 className="my-themes-title">My Themes</h2>

          {hasThemes && (
            <div className="my-themes-controls">
              {/* Filter Toggle */}
              <div className="my-themes-filter-toggle">
                <button
                  className={`filter-toggle-option ${filter === 'all' ? 'filter-toggle-option-active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-toggle-option ${filter === 'dark' ? 'filter-toggle-option-active' : ''}`}
                  onClick={() => setFilter('dark')}
                >
                  Dark
                </button>
                <button
                  className={`filter-toggle-option ${filter === 'light' ? 'filter-toggle-option-active' : ''}`}
                  onClick={() => setFilter('light')}
                >
                  Light
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="my-themes-sort-dropdown" ref={dropdownRef}>
                <button
                  className="my-themes-sort-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>Sort: {SORT_LABELS[sortBy]}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`sort-dropdown-chevron ${dropdownOpen ? 'sort-dropdown-chevron-open' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="my-themes-sort-menu">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                      <button
                        key={option}
                        className={`my-themes-sort-option ${sortBy === option ? 'my-themes-sort-option-active' : ''}`}
                        onClick={() => {
                          setSortBy(option);
                          setDropdownOpen(false);
                        }}
                      >
                        {SORT_LABELS[option]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="my-themes-grid-container">
        {emptyMessage ? (
          <div className="my-themes-empty">
            <div className="my-themes-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="my-themes-empty-text">{emptyMessage.text}</p>
            <p className="my-themes-empty-hint">{emptyMessage.hint}</p>
          </div>
        ) : (
          <>
            {/* Installed Themes Section */}
            {installedThemes.length > 0 && (
              <div className="my-themes-section">
                <h3 className="my-themes-section-header">
                  Installed Themes ({installedThemes.length})
                </h3>
                <div className="my-themes-grid">
                  {installedThemes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      onDelete={() => onDeleteTheme(theme.id)}
                      onClick={() => setSelectedThemeId(theme.id)}
                      onInstall={() => onInstallTheme(theme.id)}
                      onUninstall={() => onUninstallTheme(theme.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available Themes Section */}
            {availableThemes.length > 0 && (
              <div className="my-themes-section">
                <h3 className="my-themes-section-header">
                  Available Themes ({availableThemes.length})
                </h3>
                <div className="my-themes-grid">
                  {availableThemes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      onDelete={() => onDeleteTheme(theme.id)}
                      onClick={() => setSelectedThemeId(theme.id)}
                      onInstall={() => onInstallTheme(theme.id)}
                      onUninstall={() => onUninstallTheme(theme.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ThemeDetailModal
        isOpen={selectedThemeId !== null}
        theme={selectedTheme}
        onClose={() => setSelectedThemeId(null)}
        onRename={onRenameTheme}
        onDownload={handleDownload}
        onDelete={onDeleteTheme}
        onInstall={onInstallTheme}
        onUninstall={onUninstallTheme}
      />
    </div>
  );
};
