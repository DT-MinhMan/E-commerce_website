import { ProductCardWithCartAction } from "./ProductCardWithCartAction.js";
import type { Category, Product } from "../types.js";

interface ProductGridProps {
  categories?: Category[];
  products: Product[];
}

export const ProductGrid = ({ categories = [], products }: ProductGridProps) => (
  <div className="product-grid">
    {products.map((product) => (
      <ProductCardWithCartAction
        product={product}
        categoryName={categories.find((category) => category.id === product.categoryId)?.name}
        key={product.id}
      />
    ))}
  </div>
);

export const ProductGridSkeleton = () => (
  <div className="product-grid" aria-label="Loading products">
    {Array.from({ length: 6 }).map((_, index) => (
      <div className="product-card product-card-skeleton" key={index}>
        <div className="product-card-image" />
        <div className="product-card-body">
          <span />
          <span />
          <span />
        </div>
      </div>
    ))}
  </div>
);
