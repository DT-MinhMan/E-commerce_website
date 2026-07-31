import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCategoriesQuery, useProductDetailQuery } from "../hooks/useCatalogQueries.js";
import { useAddCartItem } from "../hooks/useCartQueries.js";
import { useAuthStore } from "../store/authStore.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);

export const ProductDetailPage = () => {
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
        <p>Loading product...</p>
      </section>
    );
  }

  if (productQuery.isError) {
    const code = productQuery.error.code;

    return (
      <section className="panel">
        <h2>{code === "PRODUCT_NOT_FOUND" ? "Product not found" : "Unable to load product"}</h2>
        <p className={code === "PRODUCT_NOT_FOUND" ? undefined : "status-error"}>{productQuery.error.message}</p>
        <Link className="primary-link" to="/products">
          Back to products
        </Link>
      </section>
    );
  }

  const product = productQuery.data;

  if (!product) {
    return (
      <section className="panel">
        <h2>Product not found</h2>
        <p>The requested product is not available.</p>
        <Link className="primary-link" to="/products">
          Back to products
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
        {image ? <img src={image.url} alt={image.alt ?? product.name} /> : <span>No image</span>}
      </div>
      <div className="product-detail-content">
        <Link className="text-link" to="/products">
          Back to products
        </Link>
        <p className="eyebrow">{category?.name ?? "Catalog product"}</p>
        <h2>{product.name}</h2>
        <p className="product-detail-price">{formatPrice(product.priceMinor, product.currency)}</p>
        <p className={isOutOfStock ? "stock-status stock-status-empty" : "stock-status"}>
          {isOutOfStock ? "Out of stock" : `${product.stockQuantity} in stock`}
        </p>
        <p className="product-description">{product.description}</p>
        {addCartItem.error && <p className="status-error">{addCartItem.error.message}</p>}
        <button type="button" className="primary-action" disabled={isOutOfStock || isAdding} onClick={addToCart}>
          {isAdding ? "Adding..." : isOutOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </section>
  );
};
