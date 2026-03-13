import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ImageFileResult } from '../electron';
import { useColorExtraction } from '../hooks/useColorExtraction';
import type { PaletteSelectionResult } from '../extraction';
import type { ThemeTone, ContrastLevel, VariantMode, HueInjectionConfig } from '../theme/types';
import type { SavedTheme } from '../types/theme-library';
import { hexToHsl, hslToHex } from '../theme/color-utils';
import { generateRandomPalette } from '../theme/random-palette';
import { ColorPickerPopover } from './ColorPickerPopover';
import { DraggableColorMarker } from './DraggableColorMarker';
import { createColorSampler, type ColorSampler } from '../utils/color-sampler';
import './ImageImportView.css';

interface ImageImportViewProps {
  image: ImageFileResult | null;
  onImageLoaded: (image: ImageFileResult) => void;
  onContinue: (palette: PaletteSelectionResult) => void;
  onBack: () => void;
  editingTheme?: SavedTheme | null;
}

type ColorRole = 'surface_base' | 'text_primary' | 'accent_primary' | 'accent_secondary';

interface MoodSliders {
  warmth: number;     // -100 to +100
  saturation: number; // -100 to +100
  brightness: number; // -100 to +100
}

const ROLE_LABELS: Record<ColorRole, string> = {
  surface_base: 'Surface',
  text_primary: 'Text',
  accent_primary: 'Accent 1',
  accent_secondary: 'Accent 2',
};

const ROLES: ColorRole[] = ['surface_base', 'text_primary', 'accent_primary', 'accent_secondary'];

const DEFAULT_MOOD: MoodSliders = { warmth: 0, saturation: 0, brightness: 0 };

const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

function isAcceptedFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return ACCEPTED_EXTENSIONS.includes(ext);
}

/** Apply mood slider offsets to a hex color */
function applyMoodToColor(hex: string, mood: MoodSliders): string {
  const hsl = hexToHsl(hex);

  // Warmth: shift hue toward warm (30°/orange) or cool (210°/blue)
  // Scale: ±20° hue shift at ±100
  const hueShift = (mood.warmth / 100) * 20;
  const h = (hsl.h + hueShift + 360) % 360;

  // Saturation: scale by ±50% of current at ±100
  const satScale = 1 + (mood.saturation / 100) * 0.5;
  const s = Math.max(0, Math.min(100, hsl.s * satScale));

  // Brightness: shift lightness by ±15 at ±100
  const lightnessShift = (mood.brightness / 100) * 15;
  const l = Math.max(0, Math.min(100, hsl.l + lightnessShift));

  return hslToHex(h, s, l);
}

/** Check if any mood slider is non-zero */
function hasMoodAdjustments(mood: MoodSliders): boolean {
  return mood.warmth !== 0 || mood.saturation !== 0 || mood.brightness !== 0;
}

/**
 * Detect whether an image suits a dark or light theme.
 * Samples center region and checks average lightness.
 */
function detectThemeTone(sampler: ColorSampler): ThemeTone {
  const samples: number[] = [];
  // Sample 9 points in a 3x3 grid centered on image (normalized coords 0.25-0.75)
  for (let y = 0.25; y <= 0.75; y += 0.25) {
    for (let x = 0.25; x <= 0.75; x += 0.25) {
      const hex = sampler.sampleAt(x, y, 5);
      const hsl = hexToHsl(hex);
      samples.push(hsl.l);
    }
  }
  const avgLightness = samples.reduce((a, b) => a + b, 0) / samples.length;
  return avgLightness < 50 ? 'dark' : 'light';
}

export const ImageImportView: React.FC<ImageImportViewProps> = ({
  image,
  onImageLoaded,
  onContinue,
  onBack,
  editingTheme,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<ThemeTone | null>(null);
  const [contrastLevel, setContrastLevel] = useState<ContrastLevel>('medium');
  const [variantMode, setVariantMode] = useState<VariantMode>('sampled');
  // Phase 1B: Hue injection toggle (experimental)
  const [hueInjection, setHueInjection] = useState<HueInjectionConfig>({ enabled: false, strength: 0.5 });

  // Option A: Color overrides
  const [colorOverrides, setColorOverrides] = useState<Partial<Record<ColorRole, string>>>({});
  const [activePickerRole, setActivePickerRole] = useState<ColorRole | null>(null);

  // Option B: Mood sliders
  const [mood, setMood] = useState<MoodSliders>(DEFAULT_MOOD);

  // Option C: Random palette (bypasses image extraction)
  const [randomPalette, setRandomPalette] = useState<PaletteSelectionResult | null>(null);

  // Draggable marker state
  const imageRef = useRef<HTMLImageElement>(null);
  const [colorSampler, setColorSampler] = useState<ColorSampler | null>(null);
  // null = explicitly hidden (user manually edited color), undefined = use original location
  const [markerPositions, setMarkerPositions] = useState<Partial<Record<ColorRole, { x: number; y: number } | null>>>({});

  // Reset state when image changes (but not when editing)
  useEffect(() => {
    if (editingTheme) return; // Skip reset when editing
    setSelectedTone(null);
    setColorOverrides({});
    setActivePickerRole(null);
    setMood(DEFAULT_MOOD);
    setRandomPalette(null);
    setMarkerPositions({});
  }, [image?.filePath, editingTheme]);

  // Pre-populate state when editing an existing theme
  useEffect(() => {
    if (!editingTheme) return;

    setSelectedTone(editingTheme.tone);
    setContrastLevel(editingTheme.contrastLevel ?? 'medium');

    // Use original colors as the base for slider adjustments (if available)
    const baseColors = editingTheme.originalColors ?? editingTheme.colors;
    setColorOverrides({
      surface_base: baseColors.surface_base,
      text_primary: baseColors.text_primary,
      accent_primary: baseColors.accent_primary,
      accent_secondary: baseColors.accent_secondary,
    });

    if (editingTheme.roleLocations) {
      setMarkerPositions(editingTheme.roleLocations);
    }

    // Restore slider positions if saved, else default
    setMood(editingTheme.moodSliders ?? DEFAULT_MOOD);

    setRandomPalette(null);
    setActivePickerRole(null);
  }, [editingTheme]);

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

  // Create color sampler when image data URL is available
  // Note: We intentionally omit selectedTone/editingTheme from deps - we only want
  // to auto-detect once when a new image loads, not re-detect when tone changes
  useEffect(() => {
    if (!imageDataUrl) {
      setColorSampler(null);
      return;
    }

    let disposed = false;
    let sampler: ColorSampler | null = null;

    createColorSampler(imageDataUrl).then((s) => {
      if (!disposed) {
        sampler = s;
        setColorSampler(s);
        // Auto-detect theme tone if not already set (and not editing)
        if (!selectedTone && !editingTheme) {
          try {
            const detectedTone = detectThemeTone(s);
            setSelectedTone(detectedTone);
          } catch (err) {
            console.error('Failed to detect theme tone:', err);
            setSelectedTone('dark'); // Fallback to dark
          }
        }
      } else {
        s.dispose();
      }
    }).catch((err) => {
      console.error('Failed to create color sampler:', err);
    });

    return () => {
      disposed = true;
      sampler?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageDataUrl]);

  // Extraction runs only when both image and tone are selected
  const { palette: extractedPalette, isExtracting, error: extractionError } = useColorExtraction(
    randomPalette ? null : (image?.filePath ?? null), // Skip extraction if using random palette
    selectedTone ?? undefined,
    variantMode
  );

  // Create synthetic palette from editingTheme when editing without an image
  const editingPalette = useMemo((): PaletteSelectionResult | null => {
    if (!editingTheme || image) return null; // Only use when editing without image
    return {
      roles: {
        tone: editingTheme.tone,
        surface_base: editingTheme.colors.surface_base,
        text_primary: editingTheme.colors.text_primary,
        accent_primary: editingTheme.colors.accent_primary,
        accent_secondary: editingTheme.colors.accent_secondary,
        contrastLevel: editingTheme.contrastLevel ?? 'medium',
      },
      roleLocations: editingTheme.roleLocations ?? {},
      extractedColors: [], // No extracted colors for color-only editing
    };
  }, [editingTheme, image]);

  // Base palette: from extraction, random generation, or editing
  const basePalette = randomPalette ?? extractedPalette ?? editingPalette;

  // Effective palette: base + color overrides + mood adjustments
  const effectivePalette = useMemo(() => {
    if (!basePalette) return null;

    const baseRoles = basePalette.roles;
    const roles = { ...baseRoles };

    // Apply color overrides first
    for (const role of ROLES) {
      if (colorOverrides[role]) {
        roles[role] = colorOverrides[role]!;
      }
    }

    // Then apply mood adjustments
    if (hasMoodAdjustments(mood)) {
      for (const role of ROLES) {
        roles[role] = applyMoodToColor(roles[role], mood);
      }
    }

    // Add hue injection config (Phase 1B experimental)
    if (hueInjection.enabled) {
      (roles as Record<string, unknown>).hueInjection = hueInjection;
    }

    return {
      ...basePalette,
      roles,
      // Clear role locations for overridden colors (no longer from image)
      roleLocations: {
        ...basePalette.roleLocations,
        ...Object.fromEntries(
          ROLES
            .filter(r => colorOverrides[r] || hasMoodAdjustments(mood))
            .map(r => [r, undefined])
        ),
      },
    } as PaletteSelectionResult;
  }, [basePalette, colorOverrides, mood, hueInjection]);

  const handleBrowse = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.openFileDialog();
      if (result) {
        setError(null);
        setRandomPalette(null);
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
    setRandomPalette(null);
    onImageLoaded({ filePath, fileName: file.name });
  }, [onImageLoaded]);

  // Option A: Color override handlers
  const handleSwatchClick = useCallback((role: ColorRole) => {
    setActivePickerRole(prev => prev === role ? null : role);
  }, []);

  const handleColorChange = useCallback((role: ColorRole, color: string) => {
    setColorOverrides(prev => ({ ...prev, [role]: color }));
    // When manually editing a color via picker, reset sliders
    // The manually edited color becomes the new baseline
    setMood(DEFAULT_MOOD);
    // Set marker position to null to hide it (color no longer represents an image location)
    setMarkerPositions(prev => ({ ...prev, [role]: null }));
  }, []);

  const handlePickerClose = useCallback(() => {
    setActivePickerRole(null);
  }, []);

  // Option B: Mood slider handler
  const handleMoodChange = useCallback((key: keyof MoodSliders, value: number) => {
    setMood(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleResetMood = useCallback(() => {
    setMood(DEFAULT_MOOD);
  }, []);

  // Reset color overrides and marker positions
  const handleResetColors = useCallback(() => {
    setColorOverrides({});
    setMarkerPositions({});
  }, []);

  // Reset to Original: restore original colors and clear sliders (edit mode only)
  const handleResetToOriginal = useCallback(() => {
    const originals = editingTheme?.originalColors ?? editingTheme?.colors;
    if (originals) {
      setColorOverrides({
        surface_base: originals.surface_base,
        text_primary: originals.text_primary,
        accent_primary: originals.accent_primary,
        accent_secondary: originals.accent_secondary,
      });
    }
    setMood(DEFAULT_MOOD);
  }, [editingTheme]);

  // Helper: Calculate the actual rendered image bounds within the <img> element
  // (accounts for object-fit: contain letterboxing)
  const getRenderedImageBounds = useCallback((img: HTMLImageElement) => {
    const rect = img.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = img;

    if (!naturalWidth || !naturalHeight) {
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }

    const scale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
    const renderedWidth = naturalWidth * scale;
    const renderedHeight = naturalHeight * scale;

    return {
      left: rect.left + (rect.width - renderedWidth) / 2,
      top: rect.top + (rect.height - renderedHeight) / 2,
      width: renderedWidth,
      height: renderedHeight,
    };
  }, []);

  // Handle marker drag - sample color at cursor position
  const handleMarkerDrag = useCallback((role: string, clientX: number, clientY: number) => {
    const img = imageRef.current;
    if (!img || !colorSampler) return;

    const bounds = getRenderedImageBounds(img);

    // Clamp cursor to image bounds
    const clampedX = Math.max(bounds.left, Math.min(bounds.left + bounds.width, clientX));
    const clampedY = Math.max(bounds.top, Math.min(bounds.top + bounds.height, clientY));

    // Convert to normalized coordinates (0-1)
    const normX = (clampedX - bounds.left) / bounds.width;
    const normY = (clampedY - bounds.top) / bounds.height;

    // Sample color with 3x3 averaging
    const sampledColor = colorSampler.sampleAt(normX, normY, 3);

    // Update both marker position and color override
    setMarkerPositions(prev => ({ ...prev, [role]: { x: normX, y: normY } }));
    setColorOverrides(prev => ({ ...prev, [role as ColorRole]: sampledColor }));
  }, [colorSampler, getRenderedImageBounds]);

  // Track eyedropper drag state
  const [isEyedropperDragging, setIsEyedropperDragging] = useState(false);
  const eyedropperRoleRef = useRef<ColorRole | null>(null);

  // Helper to sample color at client coordinates and update state
  const sampleColorAtPosition = useCallback((clientX: number, clientY: number, role: ColorRole) => {
    const img = imageRef.current;
    if (!img || !colorSampler) return;

    const bounds = getRenderedImageBounds(img);

    // Clamp to image bounds
    const clampedX = Math.max(bounds.left, Math.min(bounds.left + bounds.width, clientX));
    const clampedY = Math.max(bounds.top, Math.min(bounds.top + bounds.height, clientY));

    // Convert to normalized coordinates
    const normX = (clampedX - bounds.left) / bounds.width;
    const normY = (clampedY - bounds.top) / bounds.height;

    // Sample color
    const sampledColor = colorSampler.sampleAt(normX, normY, 3);

    // Update marker and color
    setMarkerPositions(prev => ({ ...prev, [role]: { x: normX, y: normY } }));
    setColorOverrides(prev => ({ ...prev, [role]: sampledColor }));
  }, [colorSampler, getRenderedImageBounds]);

  // Eyedropper mode: mousedown on image starts drag sampling
  const handleImageMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePickerRole || !colorSampler) return;

    e.preventDefault(); // Prevent image drag

    // Store the role and start dragging
    eyedropperRoleRef.current = activePickerRole;
    setIsEyedropperDragging(true);

    // Sample immediately at mousedown position
    sampleColorAtPosition(e.clientX, e.clientY, activePickerRole);
  }, [activePickerRole, colorSampler, sampleColorAtPosition]);

  // Document-level mouse events for eyedropper drag
  useEffect(() => {
    if (!isEyedropperDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const role = eyedropperRoleRef.current;
      if (role) {
        sampleColorAtPosition(e.clientX, e.clientY, role);
      }
    };

    const handleMouseUp = () => {
      setIsEyedropperDragging(false);
      eyedropperRoleRef.current = null;
      setActivePickerRole(null); // Close picker on release
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEyedropperDragging, sampleColorAtPosition]);

  // Option C: Random palette handler
  const handleRandomPalette = useCallback(() => {
    const tone = selectedTone ?? (Math.random() < 0.5 ? 'dark' : 'light');
    if (!selectedTone) setSelectedTone(tone);
    const result = generateRandomPalette(tone);
    setRandomPalette(result);
    setColorOverrides({});
    setMood(DEFAULT_MOOD);
  }, [selectedTone]);

  const hasOverrides = Object.keys(colorOverrides).length > 0;
  const hasAdjustments = hasMoodAdjustments(mood);

  return (
    <div className="import-view">
      <button className="import-back-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {!image && !randomPalette && !editingTheme ? (
        <>
          <div
            className={`import-dropzone ${isDragOver ? 'import-dropzone-active' : ''}`}
            onClick={handleBrowse}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="import-dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

          {/* Random generation button */}
          <div className="import-random-section">
            <div className="import-divider">
              <span className="import-divider-text">or</span>
            </div>
            <button className="import-random-button" onClick={handleRandomPalette}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
                <path d="m18 2 4 4-4 4" />
                <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
                <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
                <path d="m18 14 4 4-4 4" />
              </svg>
              <h3 className="import-random-button-title">Make One For Me</h3>
              <p className="import-random-button-subtitle">Generate a theme algorithmically</p>
            </button>
          </div>

          {error && <p className="import-error">{error}</p>}
        </>
      ) : (
        <div className="import-confirmation">
          {/* Image preview - only when image-based */}
          {image && (
            <div className="import-preview">
              {imageDataUrl ? (
                <div
                className={`import-preview-container ${activePickerRole ? 'import-preview-eyedropper' : ''}`}
                onMouseDown={handleImageMouseDown}
              >
                  <img
                    ref={imageRef}
                    src={imageDataUrl}
                    alt={image.fileName}
                    className="import-preview-image"
                  />
                  {/* Draggable color markers - show for colors with original locations or dragged positions */}
                  {basePalette?.roleLocations && ROLES.map(role => {
                    // Check if marker was explicitly hidden (user manually edited color via picker)
                    if (markerPositions[role] === null) return null;

                    // Use dragged position if available, otherwise original location
                    const originalLocation = basePalette.roleLocations?.[role];
                    const draggedPosition = markerPositions[role];
                    const position = draggedPosition ?? originalLocation;

                    // Don't render marker if no position available (synthetic colors)
                    if (!position) return null;

                    return (
                      <DraggableColorMarker
                        key={role}
                        role={role}
                        color={effectivePalette?.roles[role] ?? basePalette.roles[role]}
                        position={position}
                        onDrag={handleMarkerDrag}
                        isActive={activePickerRole === role}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="import-preview-loading">
                  <div className="import-spinner" />
                </div>
              )}
            </div>
          )}

          {/* Header for random palette mode */}
          {!image && randomPalette && (
            <div className="import-random-header">
              <h3 className="import-random-title">Random Palette</h3>
              <p className="import-random-subtitle">Tweak colors or re-roll below</p>
            </div>
          )}

          {/* Header for editing mode without image */}
          {!image && !randomPalette && editingTheme && (
            <div className="import-random-header">
              <h3 className="import-random-title">Edit Theme: {editingTheme.name}</h3>
              <p className="import-random-subtitle">Adjust colors using the swatches below</p>
            </div>
          )}

          {image && (
            <div className="import-details">
              <h3 className="import-file-name">{image.fileName}</h3>
              <p className="import-file-path">{image.filePath}</p>
            </div>
          )}

          {/* Theme options section */}
          <div className="import-options-section">
            {/* Tone selection */}
            <div className="import-option-group">
              <p className="import-option-label">Theme Style</p>
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

            {/* Contrast level selection */}
            <div className="import-option-group">
              <p className="import-option-label">Contrast</p>
              <div className="import-contrast-toggle">
                <button
                  className={`contrast-toggle-option ${contrastLevel === 'low' ? 'contrast-toggle-option-active' : ''}`}
                  onClick={() => setContrastLevel('low')}
                  title="Subtle surface differentiation (Ableton default style)"
                >
                  Low
                </button>
                <button
                  className={`contrast-toggle-option ${contrastLevel === 'medium' ? 'contrast-toggle-option-active' : ''}`}
                  onClick={() => setContrastLevel('medium')}
                  title="Moderate contrast boost (recommended)"
                >
                  Medium
                </button>
                <button
                  className={`contrast-toggle-option ${contrastLevel === 'high' ? 'contrast-toggle-option-active' : ''}`}
                  onClick={() => setContrastLevel('high')}
                  title="Higher visual separation between panels"
                >
                  High
                </button>
                <button
                  className={`contrast-toggle-option ${contrastLevel === 'very-high' ? 'contrast-toggle-option-active' : ''}`}
                  onClick={() => setContrastLevel('very-high')}
                  title="Maximum differentiation between surfaces"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Surface style / variant mode selection - only for image-based */}
            {image && (
              <div className="import-option-group">
                <p className="import-option-label">Surface Style</p>
                <div className="import-variant-tabs">
                  <button
                    className={`variant-tab ${variantMode === 'sampled' ? 'variant-tab-active' : ''}`}
                    onClick={() => setVariantMode('sampled')}
                    title="Surface color sampled directly from the image"
                  >
                    Sampled
                  </button>
                  <button
                    className={`variant-tab ${variantMode === 'vibrant' ? 'variant-tab-active' : ''}`}
                    onClick={() => setVariantMode('vibrant')}
                    title="Bold, dramatically colored surfaces"
                  >
                    Vibrant
                  </button>
                </div>
              </div>
            )}

            {/* Hue injection toggle (Phase 1B experimental) */}
            {image && (
              <div className="import-option-group">
                <p className="import-option-label">Color Variety (Experimental)</p>
                <label className="import-checkbox-label">
                  <input
                    type="checkbox"
                    checked={hueInjection.enabled}
                    onChange={(e) => setHueInjection(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <span>Inject accent hues into surfaces</span>
                </label>
                {hueInjection.enabled && (
                  <div className="import-slider-row">
                    <span className="import-slider-label">Strength</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={hueInjection.strength! * 100}
                      onChange={(e) => setHueInjection(prev => ({ ...prev, strength: parseInt(e.target.value) / 100 }))}
                      className="import-slider"
                    />
                    <span className="import-slider-value">{Math.round(hueInjection.strength! * 100)}%</span>
                  </div>
                )}
              </div>
            )}
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

          {/* Palette swatches - clickable for color editing (Option A) */}
          {effectivePalette && (
            <div className="import-palette">
              <div className="import-palette-header">
                <span className="import-palette-hint">Click a swatch to edit</span>
                <div className="import-palette-actions">
                  {editingTheme && (
                    <button className="import-palette-reset" onClick={handleResetToOriginal}>
                      Reset to Original
                    </button>
                  )}
                  {hasOverrides && !editingTheme && (
                    <button className="import-palette-reset" onClick={handleResetColors}>
                      Reset Colors
                    </button>
                  )}
                </div>
              </div>
              <div className="import-palette-swatches">
                {ROLES.map(role => (
                  <div
                    key={role}
                    className={`import-swatch import-swatch-editable ${activePickerRole === role ? 'import-swatch-active' : ''} ${colorOverrides[role] ? 'import-swatch-overridden' : ''}`}
                    style={{ backgroundColor: effectivePalette.roles[role] }}
                    title={`${ROLE_LABELS[role]}: ${effectivePalette.roles[role]}${colorOverrides[role] ? ' (edited)' : ''}`}
                    onClick={() => handleSwatchClick(role)}
                  >
                    <span className="import-swatch-label">{ROLE_LABELS[role]}</span>
                    {colorOverrides[role] && <div className="import-swatch-edited-dot" />}
                    {activePickerRole === role && (
                      <ColorPickerPopover
                        color={effectivePalette.roles[role]}
                        onChange={(color) => handleColorChange(role, color)}
                        onClose={handlePickerClose}
                        label={ROLE_LABELS[role]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood sliders (Option B) - shown after palette exists */}
          {effectivePalette && (
            <div className="import-mood-section">
              <div className="import-mood-header">
                <p className="import-option-label">Mood Adjustments</p>
                {hasAdjustments && (
                  <button className="import-palette-reset" onClick={handleResetMood}>
                    Reset
                  </button>
                )}
              </div>
              <div className="import-mood-sliders">
                <div className="import-mood-slider">
                  <label className="import-mood-slider-label">
                    <span>Warmth</span>
                    <span className="import-mood-slider-value">{mood.warmth > 0 ? `+${mood.warmth}` : mood.warmth}</span>
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={mood.warmth}
                    onChange={(e) => handleMoodChange('warmth', parseInt(e.target.value))}
                    className="import-mood-range"
                  />
                </div>
                <div className="import-mood-slider">
                  <label className="import-mood-slider-label">
                    <span>Saturation</span>
                    <span className="import-mood-slider-value">{mood.saturation > 0 ? `+${mood.saturation}` : mood.saturation}</span>
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={mood.saturation}
                    onChange={(e) => handleMoodChange('saturation', parseInt(e.target.value))}
                    className="import-mood-range"
                  />
                </div>
                <div className="import-mood-slider">
                  <label className="import-mood-slider-label">
                    <span>Brightness</span>
                    <span className="import-mood-slider-value">{mood.brightness > 0 ? `+${mood.brightness}` : mood.brightness}</span>
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={mood.brightness}
                    onChange={(e) => handleMoodChange('brightness', parseInt(e.target.value))}
                    className="import-mood-range"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="import-actions">
            {image && (
              <button className="import-action-button import-change-button" onClick={handleBrowse}>
                Change Image
              </button>
            )}
            {randomPalette && (
              <button className="import-action-button import-change-button" onClick={handleRandomPalette}>
                Re-roll
              </button>
            )}
            {randomPalette && !image && (
              <button className="import-action-button import-change-button" onClick={() => { setRandomPalette(null); }}>
                Use Image Instead
              </button>
            )}
            <button
              className="import-action-button import-continue-button"
              disabled={!effectivePalette || isExtracting}
              onClick={() => effectivePalette && onContinue({
                ...effectivePalette,
                roles: { ...effectivePalette.roles, contrastLevel },
                // Pass original colors (for edit, use existing originals; for new, use current overrides before mood)
                originalColors: editingTheme?.originalColors ?? colorOverrides,
                moodSliders: mood,
              })}
            >
              {isExtracting ? 'Extracting...' : editingTheme ? 'Save Changes' : 'Generate Theme'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
