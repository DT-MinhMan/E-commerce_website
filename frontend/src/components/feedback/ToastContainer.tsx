import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type ToastItem, useToastStore } from "./toastStore.js";

const TOAST_DURATION_MS = 4000;

interface ToastItemProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const ToastItemView = ({ toast, onClose }: ToastItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const timer = setTimeout(() => {
      onClose(toast.id);
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [toast.id, onClose, isHovered]);

  if (toast.type === "cart") {
    const { product } = toast;
    return (
      <div
        className="toast-item toast-cart"
        role="status"
        aria-live="polite"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="toast-header">
          <div className="toast-title-wrap">
            <span className="toast-icon-success" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="toast-title">Đã thêm vào giỏ hàng</p>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            aria-label="Đóng thông báo"
            onClick={() => onClose(toast.id)}
          >
            ✕
          </button>
        </div>

        <div className="toast-body">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              className="toast-product-thumb"
            />
          ) : (
            <div className="toast-product-thumb toast-product-thumb-placeholder" aria-hidden="true" />
          )}
          <div className="toast-product-details">
            <p className="toast-product-name" title={product.name}>
              {product.name}
            </p>
            {product.priceFormatted && (
              <p className="toast-product-price">{product.priceFormatted}</p>
            )}
          </div>
        </div>

        <div className="toast-footer">
          <Link
            to="/cart"
            className="toast-cart-link"
            onClick={() => onClose(toast.id)}
          >
            Xem giỏ hàng &rarr;
          </Link>
        </div>
      </div>
    );
  }

  if (toast.type === "success") {
    return (
      <div
        className="toast-item toast-success"
        role="status"
        aria-live="polite"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="toast-header">
          <div className="toast-title-wrap">
            <span className="toast-icon-success" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="toast-title">{toast.title ?? "Thành công"}</p>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            aria-label="Đóng thông báo"
            onClick={() => onClose(toast.id)}
          >
            ✕
          </button>
        </div>
        <p className="toast-message">{toast.message}</p>
      </div>
    );
  }

  return (
    <div
      className="toast-item toast-error"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="toast-header">
        <div className="toast-title-wrap">
          <span className="toast-icon-error" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <p className="toast-title">Không thể thêm vào giỏ hàng</p>
        </div>
        <button
          type="button"
          className="toast-close-btn"
          aria-label="Đóng thông báo"
          onClick={() => onClose(toast.id)}
        >
          ✕
        </button>
      </div>
      <p className="toast-message">{toast.message}</p>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Thông báo hệ thống">
      {toasts.map((toast) => (
        <ToastItemView key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};
