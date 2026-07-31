import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useCartQuery, useClearCart, useRemoveCartItem, useUpdateCartItem } from "../hooks/useCartQueries.js";
import type { CartItem } from "../types/cart.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);

const CartLine = ({ item }: { item: CartItem }) => {
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const [quantity, setQuantity] = useState(String(item.quantity));
  const isUpdating = updateCartItem.isPending && updateCartItem.variables?.productId === item.productId;
  const isRemoving = removeCartItem.isPending && removeCartItem.variables === item.productId;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(quantity);

    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed === item.quantity) {
      setQuantity(String(item.quantity));
      return;
    }

    updateCartItem.mutate({ productId: item.productId, quantity: parsed });
  };

  return (
    <article className={item.isAvailable ? "cart-item" : "cart-item cart-item-unavailable"}>
      <div className="cart-item-media">
        {item.image ? <img src={item.image.url} alt={item.image.alt ?? item.name} /> : <span>No image</span>}
      </div>
      <div className="cart-item-body">
        <h3>{item.slug ? <Link to={`/products/${item.slug}`}>{item.name}</Link> : item.name}</h3>
        <p>{formatPrice(item.unitPriceMinor, item.currency)} each</p>
        <p className={item.isAvailable ? "stock-status" : "stock-status stock-status-empty"}>
          {item.isAvailable ? `${item.stockQuantity} in stock` : "Unavailable at current quantity"}
        </p>
        {(updateCartItem.error || removeCartItem.error) && <p className="status-error">{updateCartItem.error?.message ?? removeCartItem.error?.message}</p>}
      </div>
      <form className="cart-item-actions" onSubmit={submit}>
        <label>
          Qty
          <input
            type="number"
            min="1"
            max={Math.max(item.stockQuantity, 1)}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={isUpdating || isRemoving}
          />
        </label>
        <button type="submit" disabled={isUpdating || isRemoving}>
          {isUpdating ? "Updating..." : "Update"}
        </button>
        <button type="button" disabled={isUpdating || isRemoving} onClick={() => removeCartItem.mutate(item.productId)}>
          {isRemoving ? "Removing..." : "Remove"}
        </button>
      </form>
      <p className="cart-line-total">{formatPrice(item.lineTotalMinor, item.currency)}</p>
    </article>
  );
};

export const CartPage = () => {
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

      <aside className="cart-summary">
        <p>{cart.itemCount} items</p>
        <h3>Subtotal {formatPrice(cart.subtotalMinor, cart.currency)}</h3>
        <button type="button" className="primary-action" disabled>
          Checkout in Phase 7
        </button>
      </aside>
    </section>
  );
};
