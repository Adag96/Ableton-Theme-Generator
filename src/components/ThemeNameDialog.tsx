import React, { useState, useEffect } from 'react';
import './ThemeNameDialog.css';

interface ThemeNameDialogProps {
  isOpen: boolean;
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const ThemeNameDialog: React.FC<ThemeNameDialogProps> = ({
  isOpen,
  defaultName,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">Name Your Theme</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="dialog-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter theme name..."
            autoFocus
          />
          <div className="dialog-actions">
            <button type="button" className="dialog-button dialog-button-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="dialog-button dialog-button-confirm"
              disabled={!name.trim()}
            >
              Save Theme
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
