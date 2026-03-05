import { useState, useEffect, useRef, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import './ColorPickerPopover.css';

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  label: string;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  onClose,
  label,
}) => {
  const [localColor, setLocalColor] = useState(color);
  const [hexInput, setHexInput] = useState(color);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync local state when external color changes
  useEffect(() => {
    setLocalColor(color);
    setHexInput(color);
  }, [color]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePickerChange = useCallback((newColor: string) => {
    setLocalColor(newColor);
    setHexInput(newColor);
    onChange(newColor);
  }, [onChange]);

  const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    // Only apply valid hex colors
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setLocalColor(value);
      onChange(value);
    }
  }, [onChange]);

  return (
    <div
      className="color-picker-popover"
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="color-picker-header">
        <span className="color-picker-label">{label}</span>
      </div>
      <HexColorPicker color={localColor} onChange={handlePickerChange} />
      <div className="color-picker-input-row">
        <input
          className="color-picker-hex-input"
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          spellCheck={false}
          maxLength={7}
        />
        <button className="color-picker-reset" onClick={onClose} title="Done">
          Done
        </button>
      </div>
    </div>
  );
};
