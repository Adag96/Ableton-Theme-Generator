import { useState, useCallback, useEffect } from 'react';
import type { ImageFileResult } from '../electron';
import { useColorExtraction } from '../hooks/useColorExtraction';
import type { PaletteSelectionResult } from '../extraction';
import type { ThemeTone } from '../theme/types';
import './ImageImportView.css';

interface ImageImportViewProps {
  image: ImageFileResult | null;
  onImageLoaded: (image: ImageFileResult) => void;
  onContinue: (palette: PaletteSelectionResult) => void;
  onBack: () => void;
}

const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

function isAcceptedFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return ACCEPTED_EXTENSIONS.includes(ext);
}

export const ImageImportView: React.FC<ImageImportViewProps> = ({
  image,
  onImageLoaded,
  onContinue,
  onBack,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<ThemeTone | null>(null);

  // Reset tone selection when image changes
  useEffect(() => {
    setSelectedTone(null);
  }, [image?.filePath]);

  // Load image as data URL for preview
  useEffect(() => {
    if (!image?.filePath || !window.electronAPI) {
      setImageDataUrl(null);
      return;
    }

    window.electronAPI.readImageAsDataUrl(image.filePath).then((dataUrl) => {
      setImageDataUrl(dataUrl);
    });
  }, [image?.filePath]);

  // Extraction runs only when both image and tone are selected
  const { palette, isExtracting, error: extractionError } = useColorExtraction(
    image?.filePath ?? null,
    selectedTone ?? undefined
  );

  const handleBrowse = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.openFileDialog();
      if (result) {
        setError(null);
        onImageLoaded(result);
      }
    } catch (err) {
      console.error('Error opening file dialog:', err);
      setError('Failed to open file dialog');
    }
  }, [onImageLoaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!isAcceptedFile(file.name)) {
      setError('Unsupported file type. Please use PNG, JPG, or JPEG.');
      return;
    }

    // Electron exposes the `path` property on dropped File objects
    const filePath = (file as File & { path: string }).path;
    if (!filePath) {
      setError('Could not read file path.');
      return;
    }

    setError(null);
    onImageLoaded({ filePath, fileName: file.name });
  }, [onImageLoaded]);

  return (
    <div className="import-view">
      <button className="import-back-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {!image ? (
        <>
          <div
            className={`import-dropzone ${isDragOver ? 'import-dropzone-active' : ''}`}
            onClick={handleBrowse}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="import-dropzone-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <h3 className="import-dropzone-title">Import Image</h3>
            <p className="import-dropzone-subtitle">
              Drag & drop an image here, or click to browse
            </p>
            <p className="import-dropzone-filetypes">PNG, JPG, JPEG</p>
          </div>
          {error && <p className="import-error">{error}</p>}
        </>
      ) : (
        <div className="import-confirmation">
          <div className="import-preview">
            {imageDataUrl ? (
              <div className="import-preview-container">
                <img
                  src={imageDataUrl}
                  alt={image.fileName}
                  className="import-preview-image"
                />
                {/* Color location markers - only show after extraction */}
                {palette?.roleLocations && (
                  <>
                    {palette.roleLocations.surface_base && (
                      <div
                        className="color-marker"
                        style={{
                          backgroundColor: palette.roles.surface_base,
                          left: `${palette.roleLocations.surface_base.x * 100}%`,
                          top: `${palette.roleLocations.surface_base.y * 100}%`,
                        }}
                      />
                    )}
                    {palette.roleLocations.text_primary && (
                      <div
                        className="color-marker"
                        style={{
                          backgroundColor: palette.roles.text_primary,
                          left: `${palette.roleLocations.text_primary.x * 100}%`,
                          top: `${palette.roleLocations.text_primary.y * 100}%`,
                        }}
                      />
                    )}
                    {palette.roleLocations.accent_primary && (
                      <div
                        className="color-marker"
                        style={{
                          backgroundColor: palette.roles.accent_primary,
                          left: `${palette.roleLocations.accent_primary.x * 100}%`,
                          top: `${palette.roleLocations.accent_primary.y * 100}%`,
                        }}
                      />
                    )}
                    {palette.roleLocations.accent_secondary && (
                      <div
                        className="color-marker"
                        style={{
                          backgroundColor: palette.roles.accent_secondary,
                          left: `${palette.roleLocations.accent_secondary.x * 100}%`,
                          top: `${palette.roleLocations.accent_secondary.y * 100}%`,
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="import-preview-loading">
                <div className="import-spinner" />
              </div>
            )}
          </div>
          <div className="import-details">
            <h3 className="import-file-name">{image.fileName}</h3>
            <p className="import-file-path">{image.filePath}</p>
          </div>

          {/* Tone selection - shown before extraction */}
          <div className="import-tone-section">
            <p className="import-tone-label">Theme Style</p>
            <div className="import-tone-toggle">
              <button
                className={`tone-toggle-option ${selectedTone === 'dark' ? 'tone-toggle-option-active' : ''}`}
                onClick={() => setSelectedTone('dark')}
              >
                Dark
              </button>
              <button
                className={`tone-toggle-option ${selectedTone === 'light' ? 'tone-toggle-option-active' : ''}`}
                onClick={() => setSelectedTone('light')}
              >
                Light
              </button>
            </div>
          </div>

          {/* Color extraction state - only shows after tone is selected */}
          {selectedTone && isExtracting && (
            <div className="import-extraction-status">
              <div className="import-spinner" />
              <span>Extracting colors...</span>
            </div>
          )}

          {extractionError && (
            <p className="import-error">{extractionError}</p>
          )}

          {/* Palette swatches - shown after extraction completes */}
          {palette && (
            <div className="import-palette">
              <div className="import-palette-swatches">
                <div
                  className="import-swatch"
                  style={{ backgroundColor: palette.roles.surface_base }}
                  title={`Surface: ${palette.roles.surface_base}`}
                >
                  <span className="import-swatch-label">Surface</span>
                </div>
                <div
                  className="import-swatch"
                  style={{ backgroundColor: palette.roles.text_primary }}
                  title={`Text: ${palette.roles.text_primary}`}
                >
                  <span className="import-swatch-label">Text</span>
                </div>
                <div
                  className="import-swatch"
                  style={{ backgroundColor: palette.roles.accent_primary }}
                  title={`Accent 1: ${palette.roles.accent_primary}`}
                >
                  <span className="import-swatch-label">Accent 1</span>
                </div>
                <div
                  className="import-swatch"
                  style={{ backgroundColor: palette.roles.accent_secondary }}
                  title={`Accent 2: ${palette.roles.accent_secondary}`}
                >
                  <span className="import-swatch-label">Accent 2</span>
                </div>
              </div>
            </div>
          )}

          <div className="import-actions">
            <button className="import-action-button import-change-button" onClick={handleBrowse}>
              Change Image
            </button>
            <button
              className="import-action-button import-continue-button"
              disabled={!palette || isExtracting}
              onClick={() => palette && onContinue(palette)}
            >
              {isExtracting ? 'Extracting...' : 'Generate Theme'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
