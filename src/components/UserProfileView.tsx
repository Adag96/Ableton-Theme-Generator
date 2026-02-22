import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Profile, SocialPlatform } from '../lib/supabase';
import { SOCIAL_PLATFORMS, SOCIAL_ICONS } from '../lib/social-platforms';
import './UserProfileView.css';

interface UserProfileViewProps {
  onBack: () => void;
  onSignedOut: () => void;
}

interface FormErrors {
  displayName?: string;
  bio?: string;
  socialUrl?: string;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onBack, onSignedOut }) => {
  const { user, profile, signOut, updateProfile } = useAuth();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<Profile['social_links']>({});

  // New social link state
  const [newPlatform, setNewPlatform] = useState<SocialPlatform | ''>('');
  const [newUrl, setNewUrl] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form from profile (only once when profile first loads)
  useEffect(() => {
    if (profile && !isInitialized) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setSocialLinks(profile.social_links || {});
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  // Redirect if user signs out while on this view
  useEffect(() => {
    if (!user) {
      onSignedOut();
    }
  }, [user, onSignedOut]);

  // Compute if form has changes
  const hasChanges = useMemo(() => {
    if (!profile) return false;

    if (displayName !== (profile.display_name || '')) return true;
    if (bio !== (profile.bio || '')) return true;

    const originalLinks = profile.social_links || {};
    const currentLinkKeys = Object.keys(socialLinks).filter(k => socialLinks[k as SocialPlatform]);
    const originalLinkKeys = Object.keys(originalLinks).filter(k => originalLinks[k as SocialPlatform]);

    if (currentLinkKeys.length !== originalLinkKeys.length) return true;

    for (const key of currentLinkKeys) {
      if (socialLinks[key as SocialPlatform] !== originalLinks[key as SocialPlatform]) return true;
    }

    return false;
  }, [profile, displayName, bio, socialLinks]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length > 50) {
      newErrors.displayName = 'Display name must be under 50 characters';
    }

    if (bio.length > 200) {
      newErrors.bio = 'Bio must be under 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    // Auto-add https:// if no protocol specified
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      new URL(normalizeUrl(url));
      return true;
    } catch {
      return false;
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!validateForm()) return;

    setIsSaving(true);
    const { error } = await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      social_links: socialLinks,
    });
    setIsSaving(false);

    if (error) {
      setSaveError(error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleAddSocialLink = () => {
    if (!newPlatform || !newUrl.trim()) return;

    if (!validateUrl(newUrl)) {
      setErrors(prev => ({ ...prev, socialUrl: 'Please enter a valid URL' }));
      return;
    }

    setErrors(prev => ({ ...prev, socialUrl: undefined }));
    setSocialLinks(prev => ({ ...prev, [newPlatform]: normalizeUrl(newUrl) }));
    setNewPlatform('');
    setNewUrl('');
  };

  const handleRemoveSocialLink = (platform: SocialPlatform) => {
    setSocialLinks(prev => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });
  };

  // Get available platforms (not already added)
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    p => !socialLinks[p.key]
  );

  const currentLinkCount = Object.keys(socialLinks).filter(k => socialLinks[k as SocialPlatform]).length;
  const canAddMore = currentLinkCount < 4;

  if (!user) {
    return null;
  }

  return (
    <div className="profile-view">
      <button className="profile-back-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <h2 className="profile-title">User Profile</h2>

      <div className="profile-section">
        <div className="profile-avatar">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="profile-form">
          {/* Display Name */}
          <div className="profile-field">
            <label className="profile-field-label" htmlFor="displayName">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              className={`profile-input ${errors.displayName ? 'profile-input-error' : ''}`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
            />
            {errors.displayName && (
              <span className="profile-error">{errors.displayName}</span>
            )}
          </div>

          {/* Bio */}
          <div className="profile-field">
            <label className="profile-field-label" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              className={`profile-textarea ${bio.length > 200 ? 'profile-input-error' : ''}`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
            <div className="profile-char-count">
              <span className={bio.length > 200 ? 'profile-char-count-error' : ''}>
                {bio.length}/200
              </span>
            </div>
            {errors.bio && (
              <span className="profile-error">{errors.bio}</span>
            )}
          </div>

          {/* Social Links */}
          <div className="profile-field">
            <label className="profile-field-label">Social Links</label>

            {/* Existing links */}
            <div className="profile-social-list">
              {SOCIAL_PLATFORMS.map(platform => {
                const url = socialLinks[platform.key];
                if (!url) return null;

                return (
                  <div key={platform.key} className="profile-social-item">
                    <span className="profile-social-icon">
                      {SOCIAL_ICONS[platform.key]}
                    </span>
                    <span className="profile-social-url">{url}</span>
                    <button
                      type="button"
                      className="profile-social-remove"
                      onClick={() => handleRemoveSocialLink(platform.key)}
                      title="Remove link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add new link */}
            {canAddMore && availablePlatforms.length > 0 && (
              <div className="profile-social-add">
                <select
                  className="profile-select"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as SocialPlatform | '')}
                >
                  <option value="">Select platform...</option>
                  {availablePlatforms.map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
                <input
                  type="url"
                  className="profile-input profile-social-url-input"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={!newPlatform}
                />
                <button
                  type="button"
                  className="profile-social-add-button"
                  onClick={handleAddSocialLink}
                  disabled={!newPlatform || !newUrl.trim()}
                >
                  Add
                </button>
              </div>
            )}

            {!canAddMore && (
              <p className="profile-social-limit">Maximum of 4 social links reached</p>
            )}

            {errors.socialUrl && (
              <span className="profile-error">{errors.socialUrl}</span>
            )}
          </div>

          {/* Save button */}
          <div className="profile-actions">
            {saveError && (
              <span className="profile-error profile-save-error">{saveError}</span>
            )}
            {saveSuccess && (
              <span className="profile-success">Profile saved successfully</span>
            )}
            <button
              type="button"
              className="profile-save-button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving || bio.length > 200}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="profile-divider" />

        <button className="profile-sign-out" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
};
