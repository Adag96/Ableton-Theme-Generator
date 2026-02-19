import React from 'react';
import { createPortal } from 'react-dom';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="dialog-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="dialog-content" onClick={handleContentClick}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-button dialog-button-cancel"
            onClick={(e) => handleButtonClick(e, onCancel)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`dialog-button ${variant === 'destructive' ? 'dialog-button-destructive' : 'dialog-button-confirm'}`}
            onClick={(e) => handleButtonClick(e, onConfirm)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
