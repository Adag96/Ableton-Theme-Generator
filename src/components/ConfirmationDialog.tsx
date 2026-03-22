import React from 'react';
import { createPortal } from 'react-dom';
import { useModalOverlayClose } from '../hooks/useModalOverlayClose';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  showDontShowAgain?: boolean;
  onDontShowAgainChange?: (checked: boolean) => void;
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
  showDontShowAgain,
  onDontShowAgainChange,
  onConfirm,
  onCancel,
}) => {
  const { handleOverlayClick, handleOverlayMouseDown, handleContentMouseDown } = useModalOverlayClose(onCancel);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="dialog-overlay" onMouseDown={handleOverlayMouseDown} onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="dialog-content" onMouseDown={handleContentMouseDown}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        {showDontShowAgain && (
          <label className="dialog-checkbox-row">
            <input
              type="checkbox"
              onChange={(e) => onDontShowAgainChange?.(e.target.checked)}
            />
            <span>Don't show this message again</span>
          </label>
        )}
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
