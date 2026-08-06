import { Link } from "react-router-dom";
import { formatCartPrice } from "./cartFormat.js";
import type { Cart } from "../types.js";

interface CartSummaryProps {
  cart: Cart;
  hasUnavailableItems: boolean;
}

export const CartSummary = ({ cart, hasUnavailableItems }: CartSummaryProps) => (
  <aside className="cart-summary">
    <p>{cart.itemCount} items</p>
    <h3>Subtotal {formatCartPrice(cart.subtotalMinor, cart.currency)}</h3>
    {hasUnavailableItems ? (
      <button type="button" className="primary-action" disabled>
        Review unavailable items
      </button>
    ) : (
      <Link className="primary-link" to="/checkout">
        Checkout
      </Link>
    )}
  </aside>
);
