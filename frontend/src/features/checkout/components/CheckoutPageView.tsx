import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { formatPrice } from "../../../lib/formatters.js";
import { useCartQuery } from "../../cart/hooks/useCartQueries.js";
import { useCheckout } from "../../orders/hooks/useOrderQueries.js";
import type { ShippingAddressInput } from "../../orders/types.js";
import { useCreateCheckoutSession } from "../../payments/hooks/usePaymentQueries.js";

const emptyAddress: ShippingAddressInput = {
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateOrProvince: "",
  postalCode: "",
  countryCode: "VN"
};

const validateAddress = (address: ShippingAddressInput): string | null => {
  if (!address.recipientName.trim()) {
    return "Vui lòng nhập họ và tên người nhận.";
  }

  if (!address.phone.trim()) {
    return "Vui lòng nhập số điện thoại liên hệ.";
  }

  if (!address.addressLine1.trim() || !address.city.trim() || !address.stateOrProvince.trim() || !address.postalCode.trim()) {
    return "Vui lòng điền đầy đủ thông tin địa chỉ giao hàng.";
  }

  if (!/^[A-Za-z]{2}$/.test(address.countryCode.trim())) {
    return "Mã quốc gia phải gồm 2 ký tự (VD: VN).";
  }

  return null;
};

export const CheckoutPageView = () => {
  const navigate = useNavigate();
  const cartQuery = useCartQuery();
  const checkout = useCheckout();
  const checkoutSession = useCreateCheckoutSession();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressInput>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "momo">("cod");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const cart = cartQuery.data;

  const updateField = (field: keyof ShippingAddressInput, value: string) => {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    const validationError = validateAddress(shippingAddress);
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    checkout.mutate(
      {
        shippingAddress: {
          ...shippingAddress,
          countryCode: shippingAddress.countryCode.toUpperCase()
        },
        paymentMethod: paymentMethod.toUpperCase() as "COD" | "CARD" | "MOMO"
      },
      {
        onSuccess: (order) => {
          if (paymentMethod === "cod") {
            navigate(`/orders/${order.id}`);
          } else {
            checkoutSession.mutate(
              { orderId: order.id },
              {
                onError: () => {
                  navigate(`/orders/${order.id}`);
                }
              }
            );
          }
        }
      }
    );
  };

  if (cartQuery.isLoading) {
    return (
      <section className="checkout-page checkout-loading-state">
        <div className="checkout-spinner" />
        <p>Đang tải thông tin thanh toán...</p>
      </section>
    );
  }

  if (cartQuery.isError) {
    return (
      <section className="checkout-page checkout-error-state panel">
        <h2>Không thể tải thông tin thanh toán</h2>
        <p className="status-error">{cartQuery.error.message}</p>
        <button type="button" className="primary-action" onClick={() => void cartQuery.refetch()}>
          Thử lại
        </button>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  return (
    <section className="checkout-page">
      <div className="checkout-header-bar">
        <Link to="/cart" className="checkout-back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Quay lại giỏ hàng
        </Link>
        <div className="checkout-title-area">
          <h1 className="checkout-title">Thanh toán</h1>
        </div>
      </div>

      {hasUnavailableItems && (
        <section className="panel checkout-warning-card">
          <div className="warning-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <h3>Sản phẩm trong giỏ hàng cần chú ý</h3>
              <p className="status-error">Một số sản phẩm trong giỏ hàng hiện đã hết hàng hoặc không khả dụng.</p>
            </div>
          </div>
          <Link className="primary-action" to="/cart">
            Quay lại giỏ hàng
          </Link>
        </section>
      )}

      {!hasUnavailableItems && (
        <div className="checkout-grid">
          <div className="checkout-main">
            <form className="checkout-form-card" onSubmit={submit}>
              <div className="form-section">
                <div className="section-header">
                  <span className="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </span>
                  <div>
                    <h3>1. Địa chỉ giao hàng</h3>
                    <p className="section-desc">Nhập địa chỉ nơi bạn muốn nhận đơn hàng.</p>
                  </div>
                </div>

                <div className="form-fields">
                  <div className="form-field">
                    <label htmlFor="recipientName">Họ và tên người nhận *</label>
                    <input
                      id="recipientName"
                      placeholder="VD: Nguyễn Văn A"
                      value={shippingAddress.recipientName}
                      onChange={(event) => updateField("recipientName", event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="phone">Số điện thoại liên hệ *</label>
                    <input
                      id="phone"
                      placeholder="VD: 0912345678"
                      value={shippingAddress.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="addressLine1">Địa chỉ chi tiết (Số nhà, tên đường) *</label>
                    <input
                      id="addressLine1"
                      placeholder="Số nhà, tên đường, khu phố..."
                      value={shippingAddress.addressLine1}
                      onChange={(event) => updateField("addressLine1", event.target.value)}
                      autoComplete="address-line1"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="addressLine2">Địa chỉ bổ sung (Tùy chọn)</label>
                    <input
                      id="addressLine2"
                      placeholder="Căn hộ, số phòng, tầng, tòa nhà..."
                      value={shippingAddress.addressLine2 ?? ""}
                      onChange={(event) => updateField("addressLine2", event.target.value)}
                      autoComplete="address-line2"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="city">Quận / Huyện *</label>
                      <input
                        id="city"
                        placeholder="VD: Quận 1, Cầu Giấy..."
                        value={shippingAddress.city}
                        onChange={(event) => updateField("city", event.target.value)}
                        autoComplete="address-level2"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="stateOrProvince">Tỉnh / Thành phố *</label>
                      <input
                        id="stateOrProvince"
                        placeholder="VD: TP. Hồ Chí Minh, Hà Nội..."
                        value={shippingAddress.stateOrProvince}
                        onChange={(event) => updateField("stateOrProvince", event.target.value)}
                        autoComplete="address-level1"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="postalCode">Mã bưu điện *</label>
                      <input
                        id="postalCode"
                        placeholder="VD: 700000"
                        value={shippingAddress.postalCode}
                        onChange={(event) => updateField("postalCode", event.target.value)}
                        autoComplete="postal-code"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="countryCode">Mã quốc gia (2 ký tự) *</label>
                      <input
                        id="countryCode"
                        placeholder="VN, US, JP..."
                        value={shippingAddress.countryCode}
                        onChange={(event) => updateField("countryCode", event.target.value)}
                        autoComplete="country"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <span className="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </span>
                  <div>
                    <h3>2. Phương thức thanh toán</h3>
                    <p className="section-desc">Chọn phương thức thanh toán phù hợp cho đơn hàng.</p>
                  </div>
                </div>

                <div className="payment-options-grid">
                  <label className={`payment-card ${paymentMethod === "cod" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    <div className="payment-card-body">
                      <span className="payment-card-icon">💵</span>
                      <div>
                        <strong>Thanh toán khi nhận hàng (COD)</strong>
                        <p>Thanh toán bằng tiền mặt khi đơn hàng được giao tới nơi.</p>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-card ${paymentMethod === "card" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    <div className="payment-card-body">
                      <span className="payment-card-icon">💳</span>
                      <div>
                        <strong>Thẻ tín dụng / Thẻ ghi nợ</strong>
                        <p>Thanh toán trực tuyến an toàn qua cổng Stripe.</p>
                      </div>
                    </div>
                  </label>

                  {/* Tạm thời ẩn chức năng thanh toán qua MoMo theo yêu cầu
                  {cart.currency === "VND" && (
                    <label className={`payment-card ${paymentMethod === "momo" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="momo"
                        checked={paymentMethod === "momo"}
                        onChange={() => setPaymentMethod("momo")}
                      />
                      <div className="payment-card-body">
                        <span className="payment-card-icon" style={{ color: "#d82d8b" }}>🌸</span>
                        <div>
                          <strong>Ví MoMo</strong>
                          <p>Thanh toán qua ví điện tử MoMo (Sandbox).</p>
                        </div>
                      </div>
                    </label>
                  )}
                  */}
                </div>
              </div>

              {(fieldError || checkout.error) && (
                <div className="checkout-error-banner" role="alert">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{fieldError ?? checkout.error?.message}</span>
                </div>
              )}

              <div className="checkout-actions">
                <button type="submit" className="checkout-submit-btn" disabled={checkout.isPending || checkoutSession.isPending}>
                  {checkout.isPending || checkoutSession.isPending ? (
                    <>
                      <span className="btn-spinner" />
                      {checkout.isPending ? "Đang xử lý đơn hàng..." : "Đang kết nối thanh toán..."}
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Đặt hàng • {formatPrice(cart.subtotalMinor, cart.currency)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <aside className="checkout-sidebar">
            <div className="checkout-summary-card">
              <div className="summary-card-header">
                <h3>Tóm tắt đơn hàng</h3>
                <span className="summary-item-badge">{cart.items.length} sản phẩm</span>
              </div>

              <div className="checkout-summary-items">
                {cart.items.map((item) => (
                  <div key={item.productId} className="checkout-item-row">
                    <div className="checkout-item-image">
                      {item.image?.url ? (
                        <img src={item.image.url} alt={item.image.alt ?? item.name} />
                      ) : (
                        <div className="checkout-item-placeholder">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <span className="item-qty-badge">{item.quantity}</span>
                    </div>

                    <div className="checkout-item-details">
                      <h4 className="checkout-item-title">{item.name}</h4>
                      <p className="checkout-item-meta">
                        {formatPrice(item.unitPriceMinor, item.currency)} / sản phẩm
                      </p>
                    </div>

                    <div className="checkout-item-total">
                      {formatPrice(item.lineTotalMinor, item.currency)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-card-breakdown">
                <div className="summary-line-row">
                  <span>Tạm tính</span>
                  <strong>{formatPrice(cart.subtotalMinor, cart.currency)}</strong>
                </div>
                <div className="summary-line-row">
                  <span>Phí vận chuyển</span>
                  <strong className="shipping-free-badge">MIỄN PHÍ</strong>
                </div>
                <div className="summary-line-row">
                  <span>Thuế</span>
                  <span className="summary-muted-text">Đã bao gồm</span>
                </div>
                <div className="summary-line-divider" />
                <div className="summary-line-row total-row">
                  <span>Tổng thanh toán</span>
                  <strong className="summary-grand-total">{formatPrice(cart.subtotalMinor, cart.currency)}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};
