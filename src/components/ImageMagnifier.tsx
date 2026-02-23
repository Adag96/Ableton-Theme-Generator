import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './ImageMagnifier.css';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  className?: string;
  magnification?: number;
  loupeSize?: number;
  children?: React.ReactNode;
}

/**
 * Calculate the actual rendered image bounds within an <img> element
 * that uses object-fit: contain. The element's bounding rect includes
 * letterboxed/padded areas; this returns only the visible image area.
 */
function getRenderedImageBounds(img: HTMLImageElement) {
  const rect = img.getBoundingClientRect();
  const { naturalWidth, naturalHeight } = img;

  if (!naturalWidth || !naturalHeight) {
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  const scale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
  const renderedWidth = naturalWidth * scale;
  const renderedHeight = naturalHeight * scale;

  // object-fit: contain centers the image within the element
  return {
    left: rect.left + (rect.width - renderedWidth) / 2,
    top: rect.top + (rect.height - renderedHeight) / 2,
    width: renderedWidth,
    height: renderedHeight,
  };
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt,
  className = '',
  magnification = 2,
  loupeSize = 160,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ clientX: 0, clientY: 0 });
  const [imageBounds, setImageBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const img = imageRef.current;
      if (!img) return;

      // Calculate actual visible image bounds (not the element box)
      const bounds = getRenderedImageBounds(img);

      const isOverImage =
        e.clientX >= bounds.left &&
        e.clientX <= bounds.left + bounds.width &&
        e.clientY >= bounds.top &&
        e.clientY <= bounds.top + bounds.height;

      if (isOverImage) {
        setCursorPos({ clientX: e.clientX, clientY: e.clientY });
        setImageBounds(bounds);
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Render the loupe via portal
  const renderLoupe = () => {
    if (!imageBounds || !isHovering || !imageLoaded) return null;

    const halfLoupe = loupeSize / 2;

    // Position loupe centered on cursor
    const loupeX = cursorPos.clientX - halfLoupe;
    const loupeY = cursorPos.clientY - halfLoupe;

    // Calculate where in the rendered image the cursor is (0-1 range)
    const normalizedX = (cursorPos.clientX - imageBounds.left) / imageBounds.width;
    const normalizedY = (cursorPos.clientY - imageBounds.top) / imageBounds.height;

    // Background size is the rendered image scaled by magnification
    const bgWidth = imageBounds.width * magnification;
    const bgHeight = imageBounds.height * magnification;

    // Background position to show the magnified area centered in loupe
    const bgX = normalizedX * bgWidth - halfLoupe;
    const bgY = normalizedY * bgHeight - halfLoupe;

    const loupeStyle: React.CSSProperties = {
      position: 'fixed',
      left: loupeX,
      top: loupeY,
      width: loupeSize,
      height: loupeSize,
      backgroundImage: `url(${src})`,
      backgroundSize: `${bgWidth}px ${bgHeight}px`,
      backgroundPosition: `${-bgX}px ${-bgY}px`,
      backgroundRepeat: 'no-repeat',
    };

    return createPortal(
      <div
        className="image-magnifier-loupe image-magnifier-loupe-visible"
        style={loupeStyle}
      />,
      document.body
    );
  };

  return (
    <div
      ref={containerRef}
      className={`image-magnifier-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="image-magnifier-image"
        onLoad={handleImageLoad}
      />

      {/* Overlay layer for children (color markers) */}
      {children && <div className="image-magnifier-overlay">{children}</div>}

      {/* Magnifier loupe rendered via portal to escape overflow constraints */}
      {renderLoupe()}
    </div>
  );
};
