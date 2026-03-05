import { useCallback, useRef } from 'react';

/**
 * Hook to handle modal overlay close behavior correctly.
 * Prevents modal from closing when:
 * - A drag gesture starts inside content and ends on overlay
 * - A drag gesture starts on overlay but ends outside (e.g., outside window)
 * Only closes the modal if both mousedown AND mouseup occur on the overlay.
 */
export function useModalOverlayClose(onClose: () => void) {
  const mouseDownOnOverlayRef = useRef(false);

  const handleContentMouseDown = useCallback((e: React.MouseEvent) => {
    // Stop propagation so overlay's mousedown doesn't fire
    e.stopPropagation();
    // Mark that mousedown was inside content, not on overlay
    mouseDownOnOverlayRef.current = false;
  }, []);

  const handleOverlayMouseDown = useCallback(() => {
    // Mark that mousedown was on the overlay
    mouseDownOnOverlayRef.current = true;
  }, []);

  const handleOverlayClick = useCallback(() => {
    // Only close if mousedown was on overlay (not inside content, not dragged from elsewhere)
    if (mouseDownOnOverlayRef.current) {
      onClose();
    }
    mouseDownOnOverlayRef.current = false;
  }, [onClose]);

  return { handleOverlayClick, handleOverlayMouseDown, handleContentMouseDown };
}
