import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook to handle modal overlay close behavior correctly.
 * Prevents modal from closing when a drag gesture (e.g., slider) ends over the overlay.
 * Only closes the modal if the click originated on the overlay itself.
 */
export function useModalOverlayClose(onClose: () => void) {
  const mouseDownInsideRef = useRef(false);

  const handleContentMouseDown = useCallback(() => {
    mouseDownInsideRef.current = true;
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      // Reset on next tick to allow click event to check the flag first
      requestAnimationFrame(() => {
        mouseDownInsideRef.current = false;
      });
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleOverlayClick = useCallback(() => {
    if (!mouseDownInsideRef.current) {
      onClose();
    }
  }, [onClose]);

  return { handleOverlayClick, handleContentMouseDown };
}
