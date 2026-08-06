import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/store/authStore.js";
import { useAddCartItem } from "../../cart/hooks/useCartQueries.js";
import { ProductCard } from "./ProductCard.js";
import type { Product } from "../types.js";

interface ProductCardWithCartActionProps {
  product: Product;
  categoryName?: string;
  action?: "add-to-cart" | "view";
  imageLoading?: "eager" | "lazy";
}

export const ProductCardWithCartAction = ({
  product,
  categoryName,
  action = "add-to-cart",
  imageLoading = "lazy"
}: ProductCardWithCartActionProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const addCartItem = useAddCartItem();
  const isAdding = addCartItem.isPending && addCartItem.variables?.productId === product.id;

  const addToCart = () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    addCartItem.mutate({ productId: product.id, quantity: 1 });
  };

  return (
    <ProductCard
      product={product}
      categoryName={categoryName}
      action={action}
      imageLoading={imageLoading}
      isAdding={isAdding}
      errorMessage={addCartItem.error?.message}
      onAddToCart={addToCart}
    />
  );
};
