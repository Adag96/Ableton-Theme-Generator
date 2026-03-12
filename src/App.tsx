import { useState, useEffect, useMemo } from 'react';
import { LandingView } from './components/LandingView';
import { SettingsView } from './components/SettingsView';
import { ImageImportView } from './components/ImageImportView';
import { MyThemesView } from './components/MyThemesView';
import { CommunityView } from './components/CommunityView';
import { UserProfileView } from './components/UserProfileView';
import { PublicProfileView } from './components/PublicProfileView';
import { ThemeNameDialog } from './components/ThemeNameDialog';
import { TitleBar } from './components/TitleBar';
import { AuthModal } from './components/AuthModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AccentProvider } from './hooks/useAccentColors';
import { AppThemeProvider } from './hooks/useAppTheme';
import type { ImageFileResult } from './electron';
import type { PaletteSelectionResult } from './extraction';
import type { SavedTheme } from './types/theme-library';
import { useThemeLibrary } from './hooks/useThemeLibrary';
import { generateTheme } from './theme/derivation';
import { generateAskXml } from './theme/ask-generator';
import './App.css';

interface PendingTheme {
  palette: PaletteSelectionResult;
  xmlContent: string;
  previewDataUrl?: string;
}

type View = 'landing' | 'settings' | 'import' | 'my-themes' | 'community' | 'profile' | 'public-profile';

function AppContent() {
  const [version, setVersion] = useState('0.0.1');
  const [currentView, setCurrentView] = useState<View>('landing');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<View>('landing');
  const [importedImage, setImportedImage] = useState<ImageFileResult | null>(null);
  const [pendingTheme, setPendingTheme] = useState<PendingTheme | null>(null);
  const [editingTheme, setEditingTheme] = useState<SavedTheme | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { user } = useAuth();
  const {
    library,
    addTheme,
    removeTheme,
    renameTheme,
    updateTheme,
    installTheme,
    uninstallTheme,
    syncInstallState,
  } = useThemeLibrary();

  // Filter themes to only show those created by the current user
  const userThemes = useMemo(() => {
    if (!user) {
      // When logged out, show themes with no createdBy (legacy themes)
      return library.themes.filter(t => !t.createdBy);
    }
    // When logged in, show only themes created by this user
    return library.themes.filter(t => t.createdBy === user.id);
  }, [library.themes, user]);

  useEffect(() => {
    const loadVersionInfo = async () => {
      if (window.electronAPI) {
        try {
          const ver = await window.electronAPI.getVersion();
          setVersion(ver);
        } catch (error) {
          console.error('Error loading version info:', error);
        }
      }
    };

    loadVersionInfo();
  }, []);

  // Sync install state when entering My Themes view
  useEffect(() => {
    if (currentView === 'my-themes') {
      syncInstallState();
    }
  }, [currentView, syncInstallState]);

  const handleImportImage = () => {
    setCurrentView('import');
  };

  const handleImageLoaded = (image: ImageFileResult) => {
    setImportedImage(image);
  };

  const handleBrowseThemes = () => {
    setCurrentView('my-themes');
  };

  const handleCommunity = () => {
    setCurrentView('community');
  };

  const handleSettings = () => {
    setCurrentView('settings');
  };

  const handleProfile = () => {
    setCurrentView('profile');
  };

  const handleViewProfile = (userId: string) => {
    setPreviousView(currentView);
    setViewingUserId(userId);
    setCurrentView('public-profile');
  };

  const handleBackFromPublicProfile = () => {
    setCurrentView(previousView);
    setViewingUserId(null);
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setImportedImage(null);
    setPendingTheme(null);
    setEditingTheme(null);
    setShowNameDialog(false);
  };

  const handleEditTheme = async (theme: SavedTheme) => {
    setEditingTheme(theme);

    // Try to load the source image if it exists
    if (theme.sourceImagePath && window.electronAPI) {
      const exists = await window.electronAPI.checkFileExists(theme.sourceImagePath);
      if (exists) {
        // Extract filename from path
        const lastSlash = Math.max(theme.sourceImagePath.lastIndexOf('/'), theme.sourceImagePath.lastIndexOf('\\'));
        const fileName = lastSlash >= 0 ? theme.sourceImagePath.substring(lastSlash + 1) : theme.sourceImagePath;
        setImportedImage({ filePath: theme.sourceImagePath, fileName });
      } else {
        setImportedImage(null); // Source image missing, will use color-only mode
      }
    } else {
      setImportedImage(null);
    }

    setCurrentView('import');
  };

  const handlePaletteReady = async (palette: PaletteSelectionResult) => {
    const themeData = generateTheme(palette.roles);
    const xmlContent = generateAskXml(themeData);

    // Read image as data URL for preview (will be saved to file later)
    let previewDataUrl: string | undefined;
    if (importedImage?.filePath && window.electronAPI) {
      previewDataUrl = (await window.electronAPI.readImageAsDataUrl(importedImage.filePath)) ?? undefined;
    }

    // When editing, skip the name dialog and update the theme directly
    if (editingTheme) {
      // Save new preview image to file if we have one
      let previewImagePath = editingTheme.previewImagePath;
      if (previewDataUrl && window.electronAPI) {
        const saveResult = await window.electronAPI.savePreviewImage({
          dataUrl: previewDataUrl,
          themeId: editingTheme.id,
        });
        if (saveResult.success && saveResult.previewPath) {
          previewImagePath = saveResult.previewPath;
        }
      }

      // Convert partial originalColors to full object if provided
      const originalColors = palette.originalColors && Object.keys(palette.originalColors).length === 4
        ? palette.originalColors as { surface_base: string; text_primary: string; accent_primary: string; accent_secondary: string }
        : undefined;

      const result = await updateTheme(editingTheme.id, {
        colors: {
          surface_base: palette.roles.surface_base,
          text_primary: palette.roles.text_primary,
          accent_primary: palette.roles.accent_primary,
          accent_secondary: palette.roles.accent_secondary,
        },
        tone: palette.roles.tone,
        contrastLevel: palette.roles.contrastLevel,
        previewImagePath,
        roleLocations: palette.roleLocations,
        originalColors,
        moodSliders: palette.moodSliders,
      });

      if (result.success) {
        setEditingTheme(null);
        setImportedImage(null);
        setCurrentView('my-themes');
      } else {
        console.error('Failed to update theme:', result.error);
      }
      return;
    }

    setPendingTheme({ palette, xmlContent, previewDataUrl });
    setShowNameDialog(true);
  };

  const handleThemeNameConfirm = async (name: string) => {
    if (!pendingTheme) return;

    const defaultFileName = `${name}.ask`;

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveThemeFile(pendingTheme.xmlContent, defaultFileName);
        if (result.success && result.filePath) {
          const themeId = crypto.randomUUID();

          // Cache source image for potential community gallery submission
          let sourceImagePath: string | undefined;
          if (importedImage?.filePath) {
            const cacheResult = await window.electronAPI.saveSourceImage({
              sourcePath: importedImage.filePath,
              themeId,
            });
            if (cacheResult.success && cacheResult.cachedPath) {
              sourceImagePath = cacheResult.cachedPath;
            }
          }

          // Save preview image to file
          let previewImagePath: string | undefined;
          if (pendingTheme.previewDataUrl) {
            const previewResult = await window.electronAPI.savePreviewImage({
              dataUrl: pendingTheme.previewDataUrl,
              themeId,
            });
            if (previewResult.success && previewResult.previewPath) {
              previewImagePath = previewResult.previewPath;
            }
          }

          // Convert partial originalColors to full object if provided
          const originalColors = pendingTheme.palette.originalColors && Object.keys(pendingTheme.palette.originalColors).length === 4
            ? pendingTheme.palette.originalColors as { surface_base: string; text_primary: string; accent_primary: string; accent_secondary: string }
            : undefined;

          const savedTheme: SavedTheme = {
            id: themeId,
            name,
            createdAt: new Date().toISOString(),
            createdBy: user?.id,
            filePath: result.filePath,
            tone: pendingTheme.palette.roles.tone,
            colors: {
              surface_base: pendingTheme.palette.roles.surface_base,
              text_primary: pendingTheme.palette.roles.text_primary,
              accent_primary: pendingTheme.palette.roles.accent_primary,
              accent_secondary: pendingTheme.palette.roles.accent_secondary,
            },
            contrastLevel: pendingTheme.palette.roles.contrastLevel,
            previewImagePath,
            roleLocations: pendingTheme.palette.roleLocations,
            sourceImagePath,
            isInstalled: true,
            originalColors,
            moodSliders: pendingTheme.palette.moodSliders,
          };

          await addTheme(savedTheme);
          setShowNameDialog(false);
          setPendingTheme(null);
          setImportedImage(null);
          setCurrentView('my-themes');
        } else if (result.error) {
          console.error('Failed to save theme:', result.error);
        }
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  const handleNameDialogCancel = () => {
    setShowNameDialog(false);
    setPendingTheme(null);
  };

  return (
    <div className="app">
      <TitleBar
        onNavigateToProfile={handleProfile}
        onSignInClick={() => setShowAuthModal(true)}
      />

      <main className="app-main">
        {currentView === 'landing' ? (
          <LandingView
            onImportImage={handleImportImage}
            onBrowseThemes={handleBrowseThemes}
            onCommunity={handleCommunity}
            onSettings={handleSettings}
            onViewProfile={handleViewProfile}
          />
        ) : currentView === 'settings' ? (
          <SettingsView onBack={handleBackToLanding} />
        ) : currentView === 'my-themes' ? (
          <MyThemesView
            themes={userThemes}
            onBack={handleBackToLanding}
            onDeleteTheme={removeTheme}
            onRenameTheme={renameTheme}
            onInstallTheme={installTheme}
            onUninstallTheme={uninstallTheme}
            onEditTheme={handleEditTheme}
          />
        ) : currentView === 'community' ? (
          <CommunityView onBack={handleBackToLanding} onViewProfile={handleViewProfile} />
        ) : currentView === 'profile' ? (
          <UserProfileView
            onBack={handleBackToLanding}
            onSignedOut={handleBackToLanding}
          />
        ) : currentView === 'public-profile' && viewingUserId ? (
          <PublicProfileView
            userId={viewingUserId}
            onBack={handleBackFromPublicProfile}
            onThemeClick={() => {}}
          />
        ) : (
          <ImageImportView
            image={importedImage}
            onImageLoaded={handleImageLoaded}
            onContinue={handlePaletteReady}
            onBack={handleBackToLanding}
            editingTheme={editingTheme}
          />
        )}
      </main>

      <ThemeNameDialog
        isOpen={showNameDialog}
        defaultName={importedImage?.fileName?.replace(/\.[^/.]+$/, '') ?? ''}
        onConfirm={handleThemeNameConfirm}
        onCancel={handleNameDialogCancel}
      />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          onSignInClick={() => {
            setShowFeedbackModal(false);
            setShowAuthModal(true);
          }}
        />
      )}

      <footer className="app-footer">
        <p className="footer-credit">
          Made by <strong>Lonebody</strong>
          <span className="footer-socials">
            <a
              href="https://www.instagram.com/lonebody/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="Instagram"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/channel/UCkiy7tsIo_gbFIbscSxXBHw?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="YouTube"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </span>
        </p>
        <div className="footer-version">
          <a
            href="https://ko-fi.com/lonebody"
            target="_blank"
            rel="noopener noreferrer"
            className="support-link"
            title="Support this project on Ko-fi"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
            </svg>
            <span>Support</span>
          </a>
          <button
            className="feedback-button"
            onClick={() => setShowFeedbackModal(true)}
            title="Report a bug or request a feature"
            aria-label="Report a bug or request a feature"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 8h-1.81c-.45-.78-1.07-1.45-1.82-1.96l.93-.93c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-1.47 1.47C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L9.11 3.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l.92.93C7.88 6.55 7.26 7.22 6.81 8H5c-.55 0-1 .45-1 1s.45 1 1 1h1.09c-.05.33-.09.66-.09 1v1H5c-.55 0-1 .45-1 1s.45 1 1 1h1v1c0 .34.04.67.09 1H5c-.55 0-1 .45-1 1s.45 1 1 1h1.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H19c.55 0 1-.45 1-1s-.45-1-1-1h-1.09c.05-.33.09-.66.09-1v-1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1v-1c0-.34-.04-.67-.09-1H19c.55 0 1-.45 1-1s-.45-1-1-1zm-6 8h-2c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1zm0-4h-2c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1z"/>
            </svg>
          </button>
          <span className="version-value">v{version}</span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <AccentProvider>
          <AppContent />
        </AccentProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
