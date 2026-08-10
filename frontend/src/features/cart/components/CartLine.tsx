import { type FormEvent, useState, useEffect } from "react";
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

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

  const handleStep = (delta: number) => {
    const currentNum = Number(quantity) || item.quantity;
    const newQty = Math.max(1, Math.min(item.stockQuantity, currentNum + delta));
    setQuantity(String(newQty));
    if (newQty !== item.quantity) {
      updateCartItem.mutate({ productId: item.productId, quantity: newQty });
    }
  };

  const handleBlur = () => {
    const parsed = Number(quantity);
    if (parsed >= 1 && parsed <= item.stockQuantity && parsed !== item.quantity) {
      updateCartItem.mutate({ productId: item.productId, quantity: parsed });
    } else {
      setQuantity(String(item.quantity));
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleBlur();
  };

  return (
    <article className={item.isAvailable ? "cart-item-card" : "cart-item-card cart-item-unavailable"}>
      <div className="cart-item-media">
        {item.image ? (
          <img src={item.image.url} alt={item.image.alt ?? item.name} />
        ) : (
          <div className="no-image-placeholder">No image</div>
        )}
      </div>

      <div className="cart-item-info">
        <h3 className="cart-item-name">
          {item.slug ? <Link to={`/products/${item.slug}`}>{item.name}</Link> : item.name}
        </h3>
        <p className="cart-item-unit-price">{formatCartPrice(item.unitPriceMinor, item.currency)} / sản phẩm</p>
        <span className={item.isAvailable ? "stock-badge available" : "stock-badge unavailable"}>
          {item.isAvailable ? `Còn ${item.stockQuantity} sản phẩm` : "Tạm hết hàng"}
        </span>
        {(updateCartItem.error || removeCartItem.error) && (
          <p className="status-error">{updateCartItem.error?.message ?? removeCartItem.error?.message}</p>
        )}
      </div>

      <div className="cart-item-controls">
        <form className="cart-item-qty-form" onSubmit={submit}>
          <div className="qty-stepper">
            <button
              type="button"
              className="qty-step-btn"
              disabled={isUpdating || isRemoving || Number(quantity) <= 1}
              onClick={() => handleStep(-1)}
              aria-label="Giảm số lượng"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={Math.max(item.stockQuantity, 1)}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              onBlur={handleBlur}
              disabled={isUpdating || isRemoving}
              aria-label="Số lượng"
            />
            <button
              type="button"
              className="qty-step-btn"
              disabled={isUpdating || isRemoving || Number(quantity) >= item.stockQuantity}
              onClick={() => handleStep(1)}
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
        </form>

        <button
          type="button"
          className="cart-remove-btn"
          disabled={isUpdating || isRemoving}
          onClick={() => removeCartItem.mutate(item.productId)}
          title="Xóa khỏi giỏ hàng"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>{isRemoving ? "Đang xóa..." : "Xóa"}</span>
        </button>
      </div>

      <div className="cart-item-total">
        <span className="total-label">Tổng cộng</span>
        <span className="total-value">{formatCartPrice(item.lineTotalMinor, item.currency)}</span>
      </div>
    </article>
  );
};

