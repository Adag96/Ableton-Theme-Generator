import React, { useState } from 'react';
import type { SavedTheme } from '../types/theme-library';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './SubmitThemeModal.css';

interface SubmitThemeModalProps {
  theme: SavedTheme;
  onClose: () => void;
}

export const SubmitThemeModal: React.FC<SubmitThemeModalProps> = ({ theme, onClose }) => {
  const { user } = useAuth();
  const [name, setName] = useState(theme.name);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const swatchColors = [
    theme.colors.surface_base,
    theme.colors.text_primary,
    theme.colors.accent_primary,
    theme.colors.accent_secondary,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setIsSubmitting(true);

    try {
      // Read .ask file content
      const readResult = await window.electronAPI.readThemeFileAsText(theme.filePath);
      if (!readResult.success || !readResult.content) {
        setError('Could not read theme file. Make sure the theme is still installed.');
        return;
      }

      // Generate a unique theme ID
      const themeId = crypto.randomUUID();

      // Upload .ask file to Supabase Storage
      const blob = new Blob([readResult.content], { type: 'application/xml' });
      const { error: uploadError } = await supabase.storage
        .from('theme-files')
        .upload(`${user.id}/${themeId}.ask`, blob);

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('theme-files')
        .getPublicUrl(`${user.id}/${themeId}.ask`);

      // Insert community_themes row
      const { error: insertError } = await supabase.from('community_themes').insert({
        id: themeId,
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        ask_file_url: publicUrl,
        swatch_colors: swatchColors,
        variant_mode: null,
      });

      if (insertError) {
        setError(`Submission failed: ${insertError.message}`);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="submit-modal-overlay" onClick={onClose}>
      <div className="submit-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="submit-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="submit-modal-title">Submit to Gallery</h2>

        {submitted ? (
          <div className="submit-modal-success">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p>Submitted! We'll review it soon.</p>
            <button className="submit-modal-done" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="submit-modal-form" onSubmit={handleSubmit}>
            {/* Swatch preview */}
            <div className="submit-modal-swatches">
              {swatchColors.map((color, i) => (
                <div
                  key={i}
                  className="submit-modal-swatch"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="submit-modal-field">
              <label className="submit-modal-label">Theme Name</label>
              <input
                className="submit-modal-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </div>

            <div className="submit-modal-field">
              <label className="submit-modal-label">Description <span className="submit-modal-optional">(optional)</span></label>
              <textarea
                className="submit-modal-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What inspired this theme? What makes it special?"
                maxLength={400}
                rows={3}
              />
            </div>

            <p className="submit-modal-note">
              Submissions are reviewed before appearing in the gallery.
            </p>

            {error && <p className="submit-modal-error">{error}</p>}

            <div className="submit-modal-actions">
              <button
                type="button"
                className="submit-modal-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-modal-submit"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
