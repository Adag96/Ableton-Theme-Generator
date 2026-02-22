import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import './UserProfileView.css';

interface UserProfileViewProps {
  onBack: () => void;
  onSignedOut: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onBack, onSignedOut }) => {
  const { user, profile, signOut } = useAuth();

  // Redirect if user signs out while on this view
  useEffect(() => {
    if (!user) {
      onSignedOut();
    }
  }, [user, onSignedOut]);

  const handleSignOut = async () => {
    await signOut();
  };

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

        <div className="profile-info">
          <div className="profile-field">
            <span className="profile-field-label">Display Name</span>
            <span className="profile-field-value">{profile?.display_name ?? 'Not set'}</span>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Email</span>
            <span className="profile-field-value">{user.email}</span>
          </div>
        </div>

        <p className="profile-placeholder">Profile settings coming soon</p>

        <button className="profile-sign-out" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
};
