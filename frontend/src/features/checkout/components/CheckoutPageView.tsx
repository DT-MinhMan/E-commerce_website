import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCartQuery } from "../../cart/hooks/useCartQueries.js";
import { useCheckout } from "../../orders/hooks/useOrderQueries.js";
import type { ShippingAddressInput } from "../../orders/types.js";

const emptyAddress: ShippingAddressInput = {
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateOrProvince: "",
  postalCode: "",
  countryCode: "US"
};

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);

const validateAddress = (address: ShippingAddressInput): string | null => {
  if (!address.recipientName.trim()) {
    return "Recipient name is required.";
  }

  if (!address.phone.trim()) {
    return "Phone is required.";
  }

  if (!address.addressLine1.trim() || !address.city.trim() || !address.stateOrProvince.trim() || !address.postalCode.trim()) {
    return "Shipping address is incomplete.";
  }

  if (!/^[A-Za-z]{2}$/.test(address.countryCode.trim())) {
    return "Country code must be two letters.";
  }

  return null;
};

export const CheckoutPageView = () => {
  const navigate = useNavigate();
  const cartQuery = useCartQuery();
  const checkout = useCheckout();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressInput>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
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
        paymentMethod: paymentMethod.toUpperCase() as "COD" | "CARD"
      },
      {
        onSuccess: (order) => {
          navigate(`/orders/${order.id}`);
        }
      }
    );
  };

  if (cartQuery.isLoading) {
    return (
      <section className="checkout-page checkout-loading-state">
        <div className="checkout-spinner" />
        <p>Loading your checkout details...</p>
      </section>
    );
  }

  if (cartQuery.isError) {
    return (
      <section className="checkout-page checkout-error-state panel">
        <h2>Unable to load checkout</h2>
        <p className="status-error">{cartQuery.error.message}</p>
        <button type="button" className="primary-action" onClick={() => void cartQuery.refetch()}>
          Retry Loading
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
          Back to Shopping Cart
        </Link>
        <div className="checkout-title-area">
          <h1 className="checkout-title">Checkout</h1>
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
              <h3>Cart items require attention</h3>
              <p className="status-error">Some items in your cart are currently out of stock or unavailable.</p>
            </div>
          </div>
          <Link className="primary-action" to="/cart">
            Return to Cart
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
                    <h3>1. Shipping Address</h3>
                    <p className="section-desc">Enter the location where you want your order delivered.</p>
                  </div>
                </div>

                <div className="form-fields">
                  <div className="form-field">
                    <label htmlFor="recipientName">Full Name *</label>
                    <input
                      id="recipientName"
                      placeholder="e.g. John Doe"
                      value={shippingAddress.recipientName}
                      onChange={(event) => updateField("recipientName", event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      placeholder="e.g. +1 555-0199 or 0912345678"
                      value={shippingAddress.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="addressLine1">Address Line 1 *</label>
                    <input
                      id="addressLine1"
                      placeholder="Street address, P.O. box, company name"
                      value={shippingAddress.addressLine1}
                      onChange={(event) => updateField("addressLine1", event.target.value)}
                      autoComplete="address-line1"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="addressLine2">Address Line 2 (Optional)</label>
                    <input
                      id="addressLine2"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      value={shippingAddress.addressLine2 ?? ""}
                      onChange={(event) => updateField("addressLine2", event.target.value)}
                      autoComplete="address-line2"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="city">City / District *</label>
                      <input
                        id="city"
                        placeholder="e.g. San Francisco or District 1"
                        value={shippingAddress.city}
                        onChange={(event) => updateField("city", event.target.value)}
                        autoComplete="address-level2"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="stateOrProvince">State / Province *</label>
                      <input
                        id="stateOrProvince"
                        placeholder="e.g. California or Ho Chi Minh"
                        value={shippingAddress.stateOrProvince}
                        onChange={(event) => updateField("stateOrProvince", event.target.value)}
                        autoComplete="address-level1"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="postalCode">Postal Code *</label>
                      <input
                        id="postalCode"
                        placeholder="e.g. 94103 or 700000"
                        value={shippingAddress.postalCode}
                        onChange={(event) => updateField("postalCode", event.target.value)}
                        autoComplete="postal-code"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="countryCode">Country Code (2 letters) *</label>
                      <input
                        id="countryCode"
                        placeholder="US, VN, CA, GB..."
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
                    <h3>2. Payment Method</h3>
                    <p className="section-desc">Select how you would like to pay for your purchase.</p>
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
                        <strong>Cash on Delivery (COD)</strong>
                        <p>Pay with cash when your package is delivered.</p>
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
                        <strong>Credit / Debit Card</strong>
                        <p>Instant approval (Storefront sandbox simulation mode).</p>
                      </div>
                    </div>
                  </label>
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
                <button type="submit" className="checkout-submit-btn" disabled={checkout.isPending}>
                  {checkout.isPending ? (
                    <>
                      <span className="btn-spinner" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Place Order • {formatPrice(cart.subtotalMinor, cart.currency)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <aside className="checkout-sidebar">
            <div className="checkout-summary-card">
              <div className="summary-card-header">
                <h3>Order Summary</h3>
                <span className="summary-item-badge">{cart.items.length} {cart.items.length === 1 ? "item" : "items"}</span>
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
                        {formatPrice(item.unitPriceMinor, item.currency)} each
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
                  <span>Subtotal</span>
                  <strong>{formatPrice(cart.subtotalMinor, cart.currency)}</strong>
                </div>
                <div className="summary-line-row">
                  <span>Estimated Shipping</span>
                  <strong className="shipping-free-badge">FREE</strong>
                </div>
                <div className="summary-line-row">
                  <span>Estimated Tax</span>
                  <span className="summary-muted-text">Included</span>
                </div>
                <div className="summary-line-divider" />
                <div className="summary-line-row total-row">
                  <span>Total Due</span>
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
