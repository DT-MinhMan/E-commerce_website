import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCategoriesQuery, useProductDetailQuery } from "../hooks/useCatalogQueries.js";
import { useAddCartItem } from "../../cart/hooks/useCartQueries.js";
import { useAuthStore } from "../../auth/store/authStore.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND"
  }).format(priceMinor / (currency === "VND" ? 1 : 100));

export const ProductDetailView = () => {
  const { slug = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const productQuery = useProductDetailQuery(slug);
  const categoriesQuery = useCategoriesQuery();
  const addCartItem = useAddCartItem();

  if (productQuery.isLoading) {
    return (
      <section className="panel">
        <p>Đang tải thông tin sản phẩm...</p>
      </section>
    );
  }

  if (productQuery.isError) {
    const code = productQuery.error.code;

    return (
      <section className="panel">
        <h2>{code === "PRODUCT_NOT_FOUND" ? "Không tìm thấy sản phẩm" : "Không thể tải sản phẩm"}</h2>
        <p className={code === "PRODUCT_NOT_FOUND" ? undefined : "status-error"}>{productQuery.error.message}</p>
        <Link className="primary-link" to="/products">
          Trở lại danh mục
        </Link>
      </section>
    );
  }

  const product = productQuery.data;

  if (!product) {
    return (
      <section className="panel">
        <h2>Sản phẩm không tồn tại</h2>
        <p>Sản phẩm bạn đang tìm kiếm không có sẵn hoặc đã bị gỡ bỏ.</p>
        <Link className="primary-link" to="/products">
          Trở lại danh mục
        </Link>
      </section>
    );
  }

  const image = product.images[0];
  const category = categoriesQuery.data?.find((item) => item.id === product.categoryId);
  const isOutOfStock = product.stockQuantity === 0;
  const isAdding = addCartItem.isPending && addCartItem.variables?.productId === product.id;
  const addToCart = () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    addCartItem.mutate({ productId: product.id, quantity: 1 });
  };

  return (
    <section className="product-detail">
      <div className="product-detail-media">
        {image ? <img src={image.url} alt={image.alt ?? product.name} /> : <span>Không có hình ảnh</span>}
      </div>
      <div className="product-detail-content">
        <Link className="text-link" to="/products" style={{ fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          &larr; Trở lại danh mục sản phẩm
        </Link>
        <div>
          <p className="eyebrow">{category?.name ?? "Danh mục sản phẩm"}</p>
          <h2 style={{ marginTop: "4px" }}>{product.name}</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <p className="product-detail-price">{formatPrice(product.priceMinor, product.currency)}</p>
          <span className={isOutOfStock ? "status-pill out-of-stock" : "status-pill in-stock"}>
            {isOutOfStock ? "Hết hàng" : `Còn ${product.stockQuantity} sản phẩm`}
          </span>
        </div>

        <p className="product-description">{product.description}</p>

        {addCartItem.error && <p className="status-error">{addCartItem.error.message}</p>}

        <button
          type="button"
          className="primary-action"
          style={{ width: "100%", padding: "14px", fontSize: "16px" }}
          disabled={isOutOfStock || isAdding}
          onClick={addToCart}
        >
          {isAdding ? "Đang thêm vào giỏ..." : isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
        </button>

        <div style={{ display: "grid", gap: "12px", paddingTop: "16px", borderTop: "1px solid var(--color-border)", fontSize: "13px", color: "var(--color-text-muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>Giao hàng miễn phí cho đơn hàng từ 500k</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Đổi trả sản phẩm miễn phí trong vòng 30 ngày</span>
          </div>
        </div>
      </div>
    </section>
  );
};
