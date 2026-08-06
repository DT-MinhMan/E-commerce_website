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
      <section className="panel">
        <p>Loading cart...</p>
      </section>
    );
  }

  if (cartQuery.isError) {
    return (
      <section className="panel">
        <h2>Unable to load cart</h2>
        <p className="status-error">{cartQuery.error.message}</p>
        <button type="button" className="primary-action" onClick={() => void cartQuery.refetch()}>
          Retry
        </button>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="panel">
        <h2>Your cart is empty</h2>
        <p>Add products from the storefront to start a cart.</p>
        <Link className="primary-link" to="/products">
          Browse products
        </Link>
      </section>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  return (
    <section className="cart-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Phase 6</p>
          <h2>Your cart</h2>
        </div>
        <button type="button" className="secondary-action" disabled={clearCart.isPending} onClick={() => clearCart.mutate()}>
          {clearCart.isPending ? "Clearing..." : "Clear cart"}
        </button>
      </div>

      {hasUnavailableItems && <p className="status-error">Some cart items are unavailable or exceed current stock.</p>}
      {clearCart.error && <p className="status-error">{clearCart.error.message}</p>}

      <div className="cart-items">
        {cart.items.map((item) => (
          <CartLine item={item} key={item.productId} />
        ))}
      </div>

      <CartSummary cart={cart} hasUnavailableItems={hasUnavailableItems} />
    </section>
  );
};
