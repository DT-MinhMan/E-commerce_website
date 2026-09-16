import { useLocation, useNavigate } from "react-router-dom";
import { useToastStore } from "../../../components/feedback/toastStore.js";
import { formatPrice } from "../../../lib/formatters.js";
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
  const addCartToast = useToastStore((state) => state.addCartToast);
  const addErrorToast = useToastStore((state) => state.addErrorToast);
  const isAdding = addCartItem.isPending && addCartItem.variables?.productId === product.id;

  const addToCart = () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    addCartItem.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          addCartToast({
            name: product.name,
            imageUrl: product.images[0]?.url,
            imageAlt: product.images[0]?.alt ?? product.name,
            priceFormatted: formatPrice(product.priceMinor, product.currency)
          });
        },
        onError: (error) => {
          addErrorToast(error.message || "Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng.");
        }
      }
    );
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
