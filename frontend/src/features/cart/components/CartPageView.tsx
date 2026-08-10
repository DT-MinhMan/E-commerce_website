import { Link } from "react-router-dom";
import { CartLine } from "./CartLine.js";
import { CartSummary } from "./CartSummary.js";
import { useCartQuery, useClearCart } from "../hooks/useCartQueries.js";

export const CartPageView = () => {
  const cartQuery = useCartQuery();
  const clearCart = useClearCart();
  const cart = cartQuery.data;

  if (cartQuery.isLoading) {
    return (
      <section className="panel state-panel">
        <p>Đang tải giỏ hàng...</p>
      </section>
    );
  }

  if (cartQuery.isError) {
    return (
      <section className="panel state-panel">
        <h2>Không thể tải giỏ hàng</h2>
        <p className="status-error">{cartQuery.error.message}</p>
        <button type="button" className="primary-action" onClick={() => void cartQuery.refetch()}>
          Thử lại
        </button>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="cart-empty-panel">
        <div className="cart-empty-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Hãy khám phá các sản phẩm nội thất tinh tế và lựa chọn món đồ yêu thích của bạn.</p>
        <Link className="primary-link" to="/products">
          Khám phá sản phẩm
        </Link>
      </section>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  return (
    <section className="cart-page-container">
      <div className="cart-page-header">
        <div>
          <h1 className="serif-title">Giỏ hàng của bạn</h1>
          <p className="cart-subtitle">{cart.itemCount} sản phẩm trong giỏ hàng</p>
        </div>
        <button
          type="button"
          className="cart-clear-btn"
          disabled={clearCart.isPending}
          onClick={() => clearCart.mutate()}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          {clearCart.isPending ? "Đang xóa..." : "Xóa giỏ hàng"}
        </button>
      </div>

      {hasUnavailableItems && (
        <p className="status-error">Một số sản phẩm không đủ số lượng hoặc tạm thời không khả dụng.</p>
      )}
      {clearCart.error && <p className="status-error">{clearCart.error.message}</p>}

      <div className="cart-layout-grid">
        <div className="cart-items-column">
          {cart.items.map((item) => (
            <CartLine item={item} key={item.productId} />
          ))}
        </div>

        <div className="cart-summary-column">
          <CartSummary cart={cart} hasUnavailableItems={hasUnavailableItems} />
        </div>
      </div>
    </section>
  );
};

