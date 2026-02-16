import { useState, useCallback } from 'react';
import type { ImageFileResult } from '../electron';
import './ImageImportView.css';

interface ImageImportViewProps {
  image: ImageFileResult | null;
  onImageLoaded: (image: ImageFileResult) => void;
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
  onBack,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <img
              src={`file://${image.filePath}`}
              alt={image.fileName}
              className="import-preview-image"
            />
          </div>
          <div className="import-details">
            <h3 className="import-file-name">{image.fileName}</h3>
            <p className="import-file-path">{image.filePath}</p>
          </div>
          <div className="import-actions">
            <button className="import-action-button import-change-button" onClick={handleBrowse}>
              Change Image
            </button>
            <button className="import-action-button import-continue-button" disabled>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
