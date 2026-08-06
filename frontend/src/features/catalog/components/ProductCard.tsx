import { Link } from "react-router-dom";
import type { Product } from "../types.js";

const formatPrice = (priceMinor: number, currency: string): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND"
  }).format(priceMinor / (currency === "VND" ? 1 : 100));
};

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  action?: "add-to-cart" | "view";
  imageLoading?: "eager" | "lazy";
  isAdding?: boolean;
  errorMessage?: string;
  onAddToCart?: () => void;
}

export const ProductCard = ({
  product,
  categoryName,
  action = "add-to-cart",
  imageLoading = "lazy",
  isAdding = false,
  errorMessage,
  onAddToCart
}: ProductCardProps) => {
  const image = product.images[0];
  const isOutOfStock = product.stockQuantity === 0;

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card-image" aria-label={`Xem sản phẩm ${product.name}`}>
        {image ? <img src={image.url} alt={image.alt ?? product.name} loading={imageLoading} /> : <span>Không có hình ảnh</span>}
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta">
          <span>{categoryName ?? "Sản phẩm"}</span>
          <span className={isOutOfStock ? "status-pill out-of-stock" : "status-pill in-stock"}>
            {isOutOfStock ? "Hết hàng" : "Còn hàng"}
          </span>
        </div>
        <h3>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="product-price">{formatPrice(product.priceMinor, product.currency)}</p>
        
        {action === "add-to-cart" ? (
          <>
            {errorMessage && <p className="status-error">{errorMessage}</p>}
            <button type="button" className="secondary-action" disabled={isOutOfStock || isAdding} onClick={onAddToCart}>
              {isAdding ? "Đang thêm..." : isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
          </>
        ) : isOutOfStock ? (
          <button type="button" className="secondary-action" disabled>
            Hết hàng
          </button>
        ) : (
          <Link className="secondary-action" to={`/products/${product.slug}`}>
            Xem chi tiết
          </Link>
        )}
      </div>
    </article>
  );
};
