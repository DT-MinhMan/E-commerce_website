import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useRemoveCartItem, useUpdateCartItem } from "../hooks/useCartQueries.js";
import { formatCartPrice } from "./cartFormat.js";
import type { CartItem } from "../types.js";

interface CartLineProps {
  item: CartItem;
}

export const CartLine = ({ item }: CartLineProps) => {
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
        <p>{formatCartPrice(item.unitPriceMinor, item.currency)} each</p>
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
      <p className="cart-line-total">{formatCartPrice(item.lineTotalMinor, item.currency)}</p>
    </article>
  );
};
