import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useToastStore } from "../../../components/feedback/toastStore.js";
import { useAuthStore } from "../../auth/store/authStore.js";
import { useAddCartItem } from "../../cart/hooks/useCartQueries.js";
import { useCategoriesQuery, useProductDetailQuery, useProductsQuery } from "../hooks/useCatalogQueries.js";
import { ProductCardWithCartAction } from "./ProductCardWithCartAction.js";
import { ProductGallery } from "./ProductGallery.js";
import { ROOM_TYPE_LABELS } from "../types.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND"
  }).format(priceMinor / (currency === "VND" ? 1 : 100));

type TabKey = "description" | "warranty" | "shipping";

export const ProductDetailView = () => {
  const { slug = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const productQuery = useProductDetailQuery(slug);
  const categoriesQuery = useCategoriesQuery();
  const addCartItem = useAddCartItem();
  const addCartToast = useToastStore((state) => state.addCartToast);
  const addErrorToast = useToastStore((state) => state.addErrorToast);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [mobileAccordion, setMobileAccordion] = useState<Record<TabKey, boolean>>({
    description: true,
    warranty: false,
    shipping: false
  });
  const [showStickyBar, setShowStickyBar] = useState(false);
  const mainAddToCartRef = useRef<HTMLButtonElement>(null);

  const product = productQuery.data;
  const category = categoriesQuery.data?.find((item) => item.id === product?.categoryId);

  // Fetch related products from same category
  const relatedQuery = useProductsQuery(
    {
      page: 1,
      limit: 5,
      sort: "newest",
      category: category?.slug
    },
    { enabled: Boolean(category?.slug) }
  );

  const isOutOfStock = product ? product.stockQuantity === 0 : true;
  const isAdding = addCartItem.isPending && addCartItem.variables?.productId === product?.id;

  // IntersectionObserver for sticky bottom bar
  useEffect(() => {
    const target = mainAddToCartRef.current;
    if (!target || isOutOfStock || typeof IntersectionObserver === "undefined") {
      setShowStickyBar(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when user scrolls past the main CTA button
        const isScrolledPast = entry.boundingClientRect.top < 0 && !entry.isIntersecting;
        setShowStickyBar(isScrolledPast);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isOutOfStock, product?.id]);

  // Adjust quantity if stock is lower than current quantity
  useEffect(() => {
    if (product && product.stockQuantity > 0 && quantity > product.stockQuantity) {
      setQuantity(product.stockQuantity);
    }
  }, [product, quantity]);

  if (productQuery.isLoading) {
    return (
      <div className="product-detail-container">
        <section className="panel">
          <p>Đang tải thông tin sản phẩm...</p>
        </section>
      </div>
    );
  }

  if (productQuery.isError) {
    const code = productQuery.error.code;

    return (
      <div className="product-detail-container">
        <section className="panel">
          <h2>{code === "PRODUCT_NOT_FOUND" ? "Không tìm thấy sản phẩm" : "Không thể tải sản phẩm"}</h2>
          <p className={code === "PRODUCT_NOT_FOUND" ? undefined : "status-error"}>{productQuery.error.message}</p>
          <Link className="primary-link" to="/products">
            Trở lại danh mục
          </Link>
        </section>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <section className="panel">
          <h2>Sản phẩm không tồn tại</h2>
          <p>Sản phẩm bạn đang tìm kiếm không có sẵn hoặc đã bị gỡ bỏ.</p>
          <Link className="primary-link" to="/products">
            Trở lại danh mục
          </Link>
        </section>
      </div>
    );
  }

  const mainImage = product.images[0];

  const handleAddToCart = (qty = quantity) => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    addCartItem.mutate(
      { productId: product.id, quantity: qty },
      {
        onSuccess: () => {
          addCartToast({
            name: product.name,
            imageUrl: mainImage?.url,
            imageAlt: mainImage?.alt ?? product.name,
            priceFormatted: formatPrice(product.priceMinor, product.currency)
          });
        },
        onError: (error) => {
          addErrorToast(error.message || "Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng.");
        }
      }
    );
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    addCartItem.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          navigate("/checkout");
        },
        onError: (error) => {
          addErrorToast(error.message || "Đã xảy ra lỗi khi chuẩn bị thanh toán.");
        }
      }
    );
  };

  const toggleAccordion = (key: TabKey) => {
    setMobileAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const relatedProducts = (relatedQuery.data?.products || [])
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="product-detail-container">
      {/* Breadcrumbs Navigation */}
      <nav className="breadcrumbs" aria-label="Đường dẫn trang">
        <Link to="/">Trang chủ</Link>
        <span aria-hidden="true" className="breadcrumb-separator">/</span>
        <Link to="/products">Sản phẩm</Link>
        {category && (
          <>
            <span aria-hidden="true" className="breadcrumb-separator">/</span>
            <Link to={`/products?category=${category.slug}`}>{category.name}</Link>
          </>
        )}
        <span aria-hidden="true" className="breadcrumb-separator">/</span>
        <span aria-current="page" className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <section className="product-detail">
        {/* Gallery Component */}
        <div className="product-detail-gallery-col">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Product Purchase & Info Column */}
        <div className="product-detail-content">
          <div className="product-header-meta">
            <div className="product-category-row">
              <span className="eyebrow">{category?.name ?? "Danh mục sản phẩm"}</span>
              {product.roomType && (
                <span className="room-type-pill">{ROOM_TYPE_LABELS[product.roomType]}</span>
              )}
            </div>
            <h2>{product.name}</h2>
          </div>

          <div className="product-price-stock-row">
            <p className="product-detail-price">{formatPrice(product.priceMinor, product.currency)}</p>
            {isOutOfStock ? (
              <span className="status-pill out-of-stock">
                <span className="status-dot status-dot-error" /> Hết hàng
              </span>
            ) : product.stockQuantity <= 5 ? (
              <span className="status-pill status-pill-warning">
                <span className="status-dot status-dot-warning" /> Chỉ còn {product.stockQuantity} sản phẩm
              </span>
            ) : (
              <span className="status-pill in-stock">
                <span className="status-dot status-dot-success" /> Còn hàng
              </span>
            )}
          </div>

          <p className="product-description-snippet">{product.description}</p>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="quantity-section">
              <label htmlFor="quantity-input" className="quantity-label">Số lượng</label>
              <div className="quantity-selector">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isAdding}
                  aria-label="Giảm số lượng"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <input
                  id="quantity-input"
                  type="number"
                  min="1"
                  max={product.stockQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setQuantity(Math.max(1, Math.min(product.stockQuantity, val)));
                    }
                  }}
                  className="qty-input"
                  aria-label="Số lượng sản phẩm"
                />
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={quantity >= product.stockQuantity || isAdding}
                  aria-label="Tăng số lượng"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {addCartItem.error && <p className="status-error">{addCartItem.error.message}</p>}

          {/* Dual CTAs */}
          <div className="product-cta-group">
            <button
              ref={mainAddToCartRef}
              type="button"
              className="primary-action cta-add-to-cart"
              disabled={isOutOfStock || isAdding}
              onClick={() => handleAddToCart()}
            >
              {isAdding ? "Đang thêm vào giỏ..." : isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
            <button
              type="button"
              className="secondary-action cta-buy-now"
              disabled={isOutOfStock || isAdding}
              onClick={handleBuyNow}
            >
              Mua ngay
            </button>
          </div>

          {/* Trust Badges */}
          <div className="trust-badges-grid">
            <div className="trust-badge-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>Giao hàng chuyên dụng cho đồ decor</span>
            </div>
            <div className="trust-badge-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Đổi trả miễn phí trong 30 ngày</span>
            </div>
            <div className="trust-badge-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Bảo hành chính hãng 12 tháng</span>
            </div>
            <div className="trust-badge-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Đồng kiểm hàng khi nhận</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs / Accordion Section */}
      <section className="product-details-tabs-wrapper" aria-label="Thông tin chi tiết sản phẩm">
        {/* Desktop Tab Navigation */}
        <div className="product-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "description"}
            className={`product-tab-btn ${activeTab === "description" ? "product-tab-btn-active" : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Mô tả sản phẩm
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "warranty"}
            className={`product-tab-btn ${activeTab === "warranty" ? "product-tab-btn-active" : ""}`}
            onClick={() => setActiveTab("warranty")}
          >
            Bảo hành sản phẩm
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "shipping"}
            className={`product-tab-btn ${activeTab === "shipping" ? "product-tab-btn-active" : ""}`}
            onClick={() => setActiveTab("shipping")}
          >
            Vận chuyển & Lắp đặt
          </button>
        </div>

        {/* Desktop Tab Panels */}
        <div className="product-tab-panels-desktop">
          {activeTab === "description" && (
            <div className="product-tab-pane" role="tabpanel">
              <p className="product-description-full">{product.description}</p>
            </div>
          )}

          {activeTab === "warranty" && (
            <div className="product-tab-pane" role="tabpanel">
              <div className="policy-block">
                <h4>Chính sách bảo hành sản phẩm ZenLiving (Bản demo)</h4>
                <p className="policy-intro">
                  Các sản phẩm nội thất tại ZenLiving đa số đều được chế tác tại hệ thống xưởng hoàn thiện ZenCraft với đội ngũ thợ thủ công lành nghề cùng cơ sở vật chất hiện đại. ZenLiving luôn kiểm tra kỹ lưỡng từ nguồn nguyên vật liệu cho đến sản phẩm hoàn thiện cuối cùng.
                </p>
                <ul className="care-guide-list">
                  <li><strong>Thời hạn bảo hành:</strong> ZenLiving bảo hành 12 tháng cho các trường hợp có lỗi về kỹ thuật trong quá trình sản xuất hay lắp đặt.</li>
                  <li><strong>Khuyến cáo kỹ thuật:</strong> Quý khách không nên tự ý sửa chữa mà hãy liên hệ ngay cho ZenLiving qua hotline demo: <code>1900 8899</code> để được hướng dẫn và hỗ trợ.</li>
                  <li><strong>Sau thời hạn bảo hành:</strong> Nếu quý khách có bất kỳ yêu cầu hay thắc mắc nào, ZenLiving luôn sẵn sàng tư vấn và đưa ra giải pháp khắc phục phù hợp.</li>
                </ul>
                <h5 className="policy-subheading">
                  TUY NHIÊN ZENLIVING KHÔNG BẢO HÀNH CHO CÁC TRƯỜNG HỢP SAU:
                </h5>
                <ul className="care-guide-list">
                  <li>Khách hàng tự ý sửa chữa khi sản phẩm bị trục trặc mà không thông báo cho ZenLiving.</li>
                  <li>Sản phẩm được sử dụng không đúng quy cách hướng dẫn gây nên trầy xước, móp méo, dơ bẩn hay mất màu.</li>
                  <li>Sản phẩm bị biến dạng do môi trường bên ngoài bất bình thường (quá ẩm, quá khô, mối mọt hay do tác động từ các thiết bị điện nước, các hóa chất hay dung môi sử dụng không phù hợp).</li>
                  <li>Sản phẩm đã hết thời hạn bảo hành.</li>
                  <li>Sản phẩm không có phiếu bảo hành hoặc thông tin đơn hàng hợp lệ từ ZenLiving.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="product-tab-pane" role="tabpanel">
              <div className="policy-block">
                <h4>Vận chuyển & Lắp đặt tại ZenLiving (Bản demo)</h4>
                <p className="policy-intro">
                  ZenLiving hỗ trợ giao hàng, lắp ráp và sắp xếp sản phẩm tại vị trí theo yêu cầu của quý khách.
                </p>
                <ul className="care-guide-list">
                  <li><strong>Chi phí giao hàng & lắp đặt:</strong> Phí giao hàng và lắp đặt sẽ được tư vấn, xác nhận trước khi thực hiện, tùy theo địa chỉ, kích thước sản phẩm và điều kiện giao nhận thực tế.</li>
                  <li><strong>Thời gian giao hàng dự kiến:</strong> Từ 2 - 5 ngày làm việc trên toàn quốc với dịch vụ vận chuyển chuyên biệt cho nội thất và đồ trang trí.</li>
                  <li><strong>Đồng kiểm hàng:</strong> Quý khách được quyền mở hộp kiểm tra đúng mẫu mã, màu sắc và tình trạng nguyên vẹn trước khi ký nhận bàn giao.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Accordion */}
        <div className="product-accordion-mobile">
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-trigger ${mobileAccordion.description ? "accordion-trigger-open" : ""}`}
              onClick={() => toggleAccordion("description")}
              aria-expanded={mobileAccordion.description}
            >
              <span>Mô tả sản phẩm</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {mobileAccordion.description && (
              <div className="accordion-content">
                <p className="product-description-full">{product.description}</p>
              </div>
            )}
          </div>

          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-trigger ${mobileAccordion.warranty ? "accordion-trigger-open" : ""}`}
              onClick={() => toggleAccordion("warranty")}
              aria-expanded={mobileAccordion.warranty}
            >
              <span>Bảo hành sản phẩm</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {mobileAccordion.warranty && (
              <div className="accordion-content">
                <ul className="care-guide-list">
                  <li>Bảo hành 12 tháng cho các lỗi kỹ thuật sản xuất hoặc lắp đặt.</li>
                  <li>Liên hệ hotline demo 1900 8899 thay vì tự ý sửa chữa khi có sự cố.</li>
                  <li>Hỗ trợ tư vấn kỹ thuật sau thời gian hết hạn bảo hành.</li>
                  <li>Không bảo hành đối với hư hỏng do ẩm ướt, nhiệt độ quá cao, hóa chất hoặc tự ý sửa chữa.</li>
                </ul>
              </div>
            )}
          </div>

          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-trigger ${mobileAccordion.shipping ? "accordion-trigger-open" : ""}`}
              onClick={() => toggleAccordion("shipping")}
              aria-expanded={mobileAccordion.shipping}
            >
              <span>Vận chuyển & Lắp đặt</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {mobileAccordion.shipping && (
              <div className="accordion-content">
                <ul className="care-guide-list">
                  <li>Hỗ trợ giao hàng, lắp ráp và sắp xếp theo vị trí yêu cầu.</li>
                  <li>Phí giao hàng và lắp đặt được tư vấn và xác nhận trước theo điều kiện thực tế.</li>
                  <li>Đồng kiểm tra đúng mẫu mã, màu sắc và tình trạng trước khi nhận hàng.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="related-products-section" aria-label="Sản phẩm tương tự">
          <div className="related-products-header">
            <p className="eyebrow">Khám phá thêm</p>
            <h3>Có thể bạn cũng thích</h3>
          </div>
          <div className="product-grid">
            {relatedProducts.map((relProduct) => (
              <ProductCardWithCartAction
                key={relProduct.id}
                product={relProduct}
                categoryName={category?.name}
                imageLoading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom Add-to-Cart Bar */}
      {!isOutOfStock && (
        <div
          className={`sticky-buy-bar ${showStickyBar ? "sticky-buy-bar-visible" : ""}`}
          aria-hidden={!showStickyBar}
        >
          <div className="sticky-buy-bar-inner">
            <div className="sticky-buy-bar-info">
              {mainImage && (
                <img
                  src={mainImage.url}
                  alt={mainImage.alt ?? product.name}
                  className="sticky-buy-thumb"
                />
              )}
              <div className="sticky-buy-meta">
                <span className="sticky-buy-name">{product.name}</span>
                <span className="sticky-buy-price">{formatPrice(product.priceMinor, product.currency)}</span>
              </div>
            </div>
            <div className="sticky-buy-actions">
              <button
                type="button"
                className="primary-action sticky-buy-btn"
                disabled={isAdding}
                onClick={() => handleAddToCart(1)}
              >
                {isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
