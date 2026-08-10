import { Link } from "react-router-dom";
import { formatCartPrice } from "./cartFormat.js";
import type { Cart } from "../types.js";

interface CartSummaryProps {
  cart: Cart;
  hasUnavailableItems: boolean;
}

export const CartSummary = ({ cart, hasUnavailableItems }: CartSummaryProps) => (
  <aside className="cart-summary-card">
    <div className="summary-rows">
      <div className="summary-row">
        <span className="summary-row-label">Số lượng sản phẩm</span>
        <span className="summary-row-value">{cart.itemCount} sản phẩm</span>
      </div>
      <div className="summary-row">
        <span className="summary-row-label">Tạm tính</span>
        <span className="summary-row-value">{formatCartPrice(cart.subtotalMinor, cart.currency)}</span>
      </div>
    </div>

    <div className="summary-divider" />

    <div className="summary-total-row">
      <span className="total-title">Tổng cộng</span>
      <span className="total-price">{formatCartPrice(cart.subtotalMinor, cart.currency)}</span>
    </div>

    {hasUnavailableItems ? (
      <button type="button" className="cart-checkout-btn disabled" disabled>
        Kiểm tra sản phẩm không khả dụng
      </button>
    ) : (
      <Link className="cart-checkout-btn" to="/checkout">
        <span>Tiến hành thanh toán</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </Link>
    )}

    <div className="cart-features">
      <div className="feature-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span>Giao hàng tận nơi toàn quốc</span>
      </div>
      <div className="feature-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Bảo mật thanh toán 100%</span>
      </div>
      <div className="feature-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Đổi trả dễ dàng trong 7 ngày</span>
      </div>
    </div>
  </aside>
);

