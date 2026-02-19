import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthModal.css';

type Mode = 'signin' | 'signup';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        if (!displayName.trim()) {
          setError('Display name is required');
          return;
        }
        const { error: signUpError } = await signUp(email, password, displayName.trim());
        if (signUpError) {
          setError(signUpError);
        } else {
          setSignupSuccess(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSignupSuccess(false);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="auth-modal-title">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>

        {signupSuccess ? (
          <div className="auth-modal-success">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p>Check your email to confirm your account, then sign in.</p>
            <button
              className="auth-modal-switch-button"
              onClick={() => { setMode('signin'); setSignupSuccess(false); }}
            >
              Sign In
            </button>
          </div>
        ) : (
          <form className="auth-modal-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="auth-modal-field">
                <label className="auth-modal-label">Display Name</label>
                <input
                  className="auth-modal-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="auth-modal-field">
              <label className="auth-modal-label">Email</label>
              <input
                className="auth-modal-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus={mode === 'signin'}
              />
            </div>

            <div className="auth-modal-field">
              <label className="auth-modal-label">Password</label>
              <input
                className="auth-modal-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && <p className="auth-modal-error">{error}</p>}

            <button
              className="auth-modal-submit"
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>
        )}

        {!signupSuccess && (
          <p className="auth-modal-switch">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button className="auth-modal-switch-link" onClick={switchMode}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
