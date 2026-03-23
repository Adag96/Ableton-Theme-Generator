import React, { useState, useCallback, useEffect } from 'react';

interface DraggableColorMarkerProps {
  role: string;
  color: string;
  /** Normalized position (0-1) */
  position: { x: number; y: number };
  /** Called during drag with screen coordinates */
  onDrag: (role: string, clientX: number, clientY: number) => void;
  /** Called when drag ends */
  onDragEnd?: () => void;
  /** Whether this marker's swatch is actively selected */
  isActive?: boolean;
}

export const DraggableColorMarker: React.FC<DraggableColorMarkerProps> = ({
  role,
  color,
  position,
  onDrag,
  onDragEnd,
  isActive = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onDrag(role, e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.();
    };

    // Attach to document for capturing mouse events outside the element
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, role, onDrag, onDragEnd]);

  return (
    <div
      className={`color-marker ${isDragging ? 'color-marker-dragging' : ''} ${isActive ? 'color-marker-active' : ''}`}
      style={{
        backgroundColor: color,
        left: `clamp(10px, ${position.x * 100}%, calc(100% - 10px))`,
        top: `clamp(10px, ${position.y * 100}%, calc(100% - 10px))`,
      }}
      onMouseDown={handleMouseDown}
    />
  );
};
