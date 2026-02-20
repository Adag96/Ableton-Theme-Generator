import React, { useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import './EmailPreferencesModal.css';

interface EmailPreferencesModalProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: () => void;
}

export const EmailPreferencesModal: React.FC<EmailPreferencesModalProps> = ({
  profile,
  onClose,
  onUpdate,
}) => {
  const [productUpdates, setProductUpdates] = useState(profile.consent_product_updates ?? false);
  const [marketing, setMarketing] = useState(profile.consent_marketing ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        consent_product_updates: productUpdates,
        consent_marketing: marketing,
        consent_updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setIsSaving(false);

    if (updateError) {
      setError('Failed to save preferences. Please try again.');
    } else {
      onUpdate();
      onClose();
    }
  };

  const hasChanges =
    productUpdates !== (profile.consent_product_updates ?? false) ||
    marketing !== (profile.consent_marketing ?? false);

  return (
    <div className="email-prefs-overlay" onClick={onClose}>
      <div className="email-prefs-content" onClick={(e) => e.stopPropagation()}>
        <button className="email-prefs-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="email-prefs-title">Email Preferences</h2>
        <p className="email-prefs-description">
          Choose what emails you'd like to receive from us.
        </p>

        <div className="email-prefs-options">
          <label className="email-prefs-toggle">
            <div className="email-prefs-toggle-info">
              <span className="email-prefs-toggle-label">Product Updates</span>
              <span className="email-prefs-toggle-desc">
                Get notified about new features and updates to this app
              </span>
            </div>
            <input
              type="checkbox"
              checked={productUpdates}
              onChange={(e) => setProductUpdates(e.target.checked)}
            />
            <span className="email-prefs-toggle-switch" />
          </label>

          <label className="email-prefs-toggle">
            <div className="email-prefs-toggle-info">
              <span className="email-prefs-toggle-label">Newsletter</span>
              <span className="email-prefs-toggle-desc">
                Stay updated about new products and releases
              </span>
            </div>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            <span className="email-prefs-toggle-switch" />
          </label>
        </div>

        {error && <p className="email-prefs-error">{error}</p>}

        <div className="email-prefs-actions">
          <button className="email-prefs-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="email-prefs-save"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        <p className="email-prefs-footer">
          You can update these preferences at any time.{' '}
          <a href="https://example.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};
