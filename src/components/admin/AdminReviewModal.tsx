import React, { useState, useRef } from 'react';
import type { CommunityTheme } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { useModalOverlayClose } from '../../hooks/useModalOverlayClose';

interface AdminReviewModalProps {
  theme: CommunityTheme;
  onClose: () => void;
  onComplete: () => void;
  installedReviewPath: string | null;
}

export const AdminReviewModal: React.FC<AdminReviewModalProps> = ({
  theme,
  onClose,
  onComplete,
  installedReviewPath,
}) => {
  const { handleOverlayClick, handleOverlayMouseDown, handleContentMouseDown } = useModalOverlayClose(onClose);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(theme.name);
  const [description, setDescription] = useState(theme.description ?? '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const cleanupReviewTheme = async () => {
    if (installedReviewPath) {
      await window.electronAPI.cleanupReviewTheme({ filePath: installedReviewPath });
    }
  };

  const handleApprove = async () => {
    if (!screenshotFile) {
      setError('Please upload a preview screenshot before approving.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Upload screenshot to Supabase Storage
      const ext = screenshotFile.type === 'image/png' ? 'png' : 'jpg';
      const screenshotPath = `${theme.user_id}/${theme.id}-preview.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('theme-images')
        .upload(screenshotPath, screenshotFile, { upsert: true });

      if (uploadError) {
        setError(`Screenshot upload failed: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('theme-images')
        .getPublicUrl(screenshotPath);

      // Update the theme record
      const { error: updateError } = await supabase
        .from('community_themes')
        .update({
          status: 'approved',
          name: name.trim(),
          description: description.trim() || null,
          preview_image_url: publicUrl,
          approved_at: new Date().toISOString(),
        })
        .eq('id', theme.id);

      if (updateError) {
        setError(`Approval failed: ${updateError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Clean up test file
      await cleanupReviewTheme();
      onComplete();
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('community_themes')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim() || null,
        })
        .eq('id', theme.id);

      if (updateError) {
        setError(`Rejection failed: ${updateError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Clean up test file
      await cleanupReviewTheme();
      onComplete();
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const swatchColors = theme.swatch_colors ?? [];

  return (
    <div className="admin-modal-overlay" onMouseDown={handleOverlayMouseDown} onClick={handleOverlayClick}>
      <div className="admin-modal-content" onMouseDown={handleContentMouseDown} onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="admin-modal-title">Review: {theme.name}</h2>

        {/* Swatch preview */}
        <div className="admin-modal-swatches">
          {swatchColors.slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="admin-modal-swatch"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="admin-modal-form">
          <div className="admin-modal-field">
            <label className="admin-modal-label">Theme Name</label>
            <input
              className="admin-modal-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="admin-modal-field">
            <label className="admin-modal-label">Description</label>
            <textarea
              className="admin-modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={400}
              rows={3}
            />
          </div>

          <div className="admin-modal-field">
            <label className="admin-modal-label">Preview Screenshot</label>
            <div
              className={`admin-modal-dropzone ${screenshotPreview ? 'admin-modal-dropzone-has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {screenshotPreview ? (
                <img src={screenshotPreview} alt="Preview" className="admin-modal-preview-image" />
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Click or drag to upload screenshot</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="admin-modal-field">
            <label className="admin-modal-label">
              Rejection Reason <span className="admin-modal-optional">(if rejecting)</span>
            </label>
            <input
              className="admin-modal-input"
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Low contrast, inappropriate content..."
              maxLength={200}
            />
          </div>

          {error && <p className="admin-modal-error">{error}</p>}

          <p className="admin-modal-note">
            Test file will be auto-removed from Ableton Themes folder on approve/reject.
          </p>

          <div className="admin-modal-actions">
            <button
              className="admin-modal-approve"
              onClick={handleApprove}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Processing...' : 'Approve'}
            </button>
            <button
              className="admin-modal-reject"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
