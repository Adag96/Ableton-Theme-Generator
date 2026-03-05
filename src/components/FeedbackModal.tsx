import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useModalOverlayClose } from '../hooks/useModalOverlayClose';
import type { SystemInfo } from '../electron';
import './FeedbackModal.css';

interface FeedbackModalProps {
  onClose: () => void;
  onSignInClick: () => void;
}

type FeedbackType = 'bug' | 'feature';

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Minor',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSignInClick }) => {
  const { user } = useAuth();
  const { handleOverlayClick, handleOverlayMouseDown, handleContentMouseDown } = useModalOverlayClose(onClose);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      if (window.electronAPI) {
        try {
          const [info, version] = await Promise.all([
            window.electronAPI.getSystemInfo(),
            window.electronAPI.getVersion(),
          ]);
          setSystemInfo(info);
          setAppVersion(version);
        } catch (err) {
          console.error('Error loading system info:', err);
        }
      }
    };
    loadInfo();
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (cooldown) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const osInfo = type === 'bug' && systemInfo
        ? {
            platform: systemInfo.platform,
            osVersion: systemInfo.osVersion,
            arch: systemInfo.arch,
            appVersion,
          }
        : null;

      const { error: insertError } = await supabase.from('feedback').insert({
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim(),
        priority,
        os_info: osInfo,
        app_version: appVersion,
      });

      if (insertError) {
        setError(`Submission failed: ${insertError.message}`);
        return;
      }

      setSubmitted(true);
      // Start 30s cooldown
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, cooldown, type, systemInfo, appVersion, title, description, priority]);

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'darwin': return 'macOS';
      case 'win32': return 'Windows';
      case 'linux': return 'Linux';
      default: return platform;
    }
  };

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !isSubmitting && !cooldown;

  return (
    <div className="feedback-modal-overlay" onMouseDown={handleOverlayMouseDown} onClick={handleOverlayClick}>
      <div className="feedback-modal-content" onMouseDown={handleContentMouseDown}>
        <button className="feedback-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="feedback-modal-title">Send Feedback</h2>

        {!user ? (
          <div className="feedback-sign-in">
            <p>Sign in to submit feedback</p>
            <button className="feedback-sign-in-button" onClick={onSignInClick}>
              Sign In
            </button>
          </div>
        ) : submitted ? (
          <div className="feedback-modal-success">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p>Thanks for your feedback!</p>
            <button className="feedback-modal-done" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {/* Type Toggle */}
            <div className="feedback-type-toggle">
              <button
                type="button"
                className={`feedback-type-button ${type === 'bug' ? 'active' : ''}`}
                onClick={() => setType('bug')}
              >
                Bug Report
              </button>
              <button
                type="button"
                className={`feedback-type-button ${type === 'feature' ? 'active' : ''}`}
                onClick={() => setType('feature')}
              >
                Feature Request
              </button>
            </div>

            <form className="feedback-modal-form" onSubmit={handleSubmit}>
              <div className="feedback-modal-field">
                <label className="feedback-modal-label">Title</label>
                <input
                  className="feedback-modal-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'bug' ? 'Brief description of the bug' : 'Brief description of the feature'}
                  required
                  maxLength={80}
                />
                <span className="feedback-char-count">{title.length}/80</span>
              </div>

              <div className="feedback-modal-field">
                <label className="feedback-modal-label">Description</label>
                <textarea
                  className="feedback-modal-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? 'Steps to reproduce, expected vs actual behavior...'
                      : 'What would this feature do? Why would it be useful?'
                  }
                  required
                  maxLength={2000}
                  rows={5}
                />
                <span className="feedback-char-count">{description.length}/2000</span>
              </div>

              <div className="feedback-modal-field">
                <label className="feedback-modal-label">Severity</label>
                <div className="feedback-priority-container">
                  <div className="feedback-priority-slider-wrapper">
                    <div className="feedback-priority-ticks">
                      {[1, 2, 3, 4, 5].map((tick) => (
                        <span key={tick} className="feedback-priority-tick" />
                      ))}
                    </div>
                    <input
                      type="range"
                      className="feedback-priority-range"
                      min={1}
                      max={5}
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                    />
                  </div>
                  <div className="feedback-priority-labels">
                    <span className="feedback-priority-label">Minor</span>
                    <span className="feedback-priority-value">{PRIORITY_LABELS[priority]}</span>
                    <span className="feedback-priority-label">Critical</span>
                  </div>
                </div>
              </div>

              {/* System Info (bugs only) */}
              {type === 'bug' && systemInfo && (
                <div className="feedback-system-info">
                  <div className="feedback-system-info-title">System Information (included with report)</div>
                  <div className="feedback-system-info-grid">
                    <span className="feedback-system-info-key">Platform:</span>
                    <span className="feedback-system-info-value">{getPlatformLabel(systemInfo.platform)}</span>
                    <span className="feedback-system-info-key">OS Version:</span>
                    <span className="feedback-system-info-value">{systemInfo.osVersion}</span>
                    <span className="feedback-system-info-key">Architecture:</span>
                    <span className="feedback-system-info-value">{systemInfo.arch}</span>
                    <span className="feedback-system-info-key">App Version:</span>
                    <span className="feedback-system-info-value">{appVersion}</span>
                  </div>
                </div>
              )}

              {error && <p className="feedback-modal-error">{error}</p>}

              <div className="feedback-modal-actions">
                <button
                  type="button"
                  className="feedback-modal-cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="feedback-modal-submit"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
