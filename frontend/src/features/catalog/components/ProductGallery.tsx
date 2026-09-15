import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, TouchEvent } from "react";
import type { ProductImage } from "../types.js";

interface ProductGalleryProps {
  images?: ProductImage[];
  productName: string;
}

export const ProductGallery = ({ images = [], productName }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const mainAreaRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lightboxDialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const validImages = images.filter((img) => Boolean(img && img.url));
  const total = validImages.length;
  const currentImage = validImages[activeIndex] || validImages[0];

  // Adjust activeIndex if image list changes
  useEffect(() => {
    if (activeIndex >= total && total > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, total]);

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation when gallery is focused
  const handleKeyDown = (e: KeyboardEvent) => {
    if (total <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goToNext();
    }
  };

  // Hover Zoom on Desktop
  const handleMouseEnter = () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setIsZooming(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!mainAreaRef.current) return;
    const rect = mainAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomCoords({ x, y });
  };

  // Touch Swipe for Mobile
  const handleTouchStart = (e: TouchEvent) => {
    if (total <= 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current || total <= 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only apply horizontal swipe drag if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setTouchDeltaX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (total <= 1) return;
    if (touchDeltaX > 50) {
      goToPrev();
    } else if (touchDeltaX < -50) {
      goToNext();
    }
    setTouchDeltaX(0);
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  // Lightbox key controls, focus trap & scroll locking
  useEffect(() => {
    if (!isLightboxOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Focus first focusable element (close button) inside dialog
    if (lightboxDialogRef.current) {
      const focusableElements = lightboxDialogRef.current.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    const handleLightboxKeys = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsLightboxOpen(false);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
        return;
      }

      if (e.key === "Tab") {
        const dialog = lightboxDialogRef.current;
        if (!dialog) return;

        const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleLightboxKeys);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleLightboxKeys);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isLightboxOpen, goToNext, goToPrev]);

  // 0 images state
  if (total === 0) {
    return (
      <div className="product-gallery product-gallery-empty" aria-label={`Bộ sưu tập hình ảnh ${productName}`}>
        <div className="product-gallery-main product-gallery-placeholder">
          <span>Không có hình ảnh</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="product-gallery"
      role="region"
      aria-label={`Bộ sưu tập hình ảnh ${productName}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Main Image Container */}
      <div
        className="product-gallery-main"
        ref={mainAreaRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="product-gallery-stage"
          style={{
            transform: isSwiping && touchDeltaX !== 0 ? `translateX(${touchDeltaX}px)` : "translateX(0)",
            transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.2, 0, 0, 1)"
          }}
        >
          <img
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.alt ?? `${productName} - Ảnh ${activeIndex + 1}`}
            className="product-gallery-img"
          />
        </div>

        {/* Hover Zoom layer for desktop */}
        {isZooming && (
          <div
            className="product-gallery-zoom-lens"
            style={{
              backgroundImage: `url(${currentImage.url})`,
              backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`
            }}
            aria-hidden="true"
          />
        )}

        {/* Expand / Lightbox Button */}
        <button
          type="button"
          className="product-gallery-expand-btn"
          aria-label="Phóng to ảnh"
          onClick={() => setIsLightboxOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        {/* Navigation arrows for 2+ images */}
        {total > 1 && (
          <>
            <button
              type="button"
              className="product-gallery-nav product-gallery-prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Ảnh trước"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="product-gallery-nav product-gallery-next"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Ảnh tiếp theo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Counter Badge */}
        {total > 1 && (
          <div className="product-gallery-counter" aria-live="polite">
            <span>{activeIndex + 1}</span> / <span>{total}</span>
          </div>
        )}
      </div>

      {/* Thumbnails Strip (desktop) */}
      {total > 1 && (
        <div className="product-gallery-thumbs" role="tablist" aria-label="Danh sách hình ảnh sản phẩm">
          {validImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={img.url + idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Xem hình ảnh ${idx + 1}`}
                className={`product-gallery-thumb ${isActive ? "product-gallery-thumb-active" : ""}`}
                onClick={() => setActiveIndex(idx)}
              >
                <img src={img.url} alt={img.alt ? `Thu nhỏ: ${img.alt}` : `${productName} thu nhỏ ${idx + 1}`} loading="lazy" />
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile Dot Indicators */}
      {total > 1 && (
        <div className="product-gallery-dots" aria-hidden="true">
          {validImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              tabIndex={-1}
              className={`product-gallery-dot ${idx === activeIndex ? "product-gallery-dot-active" : ""}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Chuyển đến ảnh ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Xem ảnh phóng to ${productName}`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="lightbox-dialog" ref={lightboxDialogRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Đóng xem ảnh"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="lightbox-content">
              <img
                src={currentImage.url}
                alt={currentImage.alt ?? productName}
                className="lightbox-img"
              />
            </div>

            {total > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox-nav lightbox-prev"
                  onClick={goToPrev}
                  aria-label="Ảnh trước"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="lightbox-nav lightbox-next"
                  onClick={goToNext}
                  aria-label="Ảnh tiếp theo"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <div className="lightbox-counter">
                  {activeIndex + 1} / {total}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
