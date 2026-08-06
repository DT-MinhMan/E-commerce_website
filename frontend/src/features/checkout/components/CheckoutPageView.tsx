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
        }
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
      <section className="panel">
        <p>Loading checkout...</p>
      </section>
    );
  }

  if (cartQuery.isError) {
    return (
      <section className="panel">
        <h2>Unable to load checkout</h2>
        <p className="status-error">{cartQuery.error.message}</p>
        <button type="button" className="primary-action" onClick={() => void cartQuery.refetch()}>
          Retry
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
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Phase 7</p>
          <h2>Checkout</h2>
        </div>
      </div>

      {hasUnavailableItems && (
        <section className="panel">
          <h2>Cart needs attention</h2>
          <p className="status-error">Some cart items are unavailable or exceed current stock.</p>
          <Link className="primary-link" to="/cart">
            Review cart
          </Link>
        </section>
      )}

      {!hasUnavailableItems && (
        <div className="checkout-grid">
          <form className="checkout-form panel" onSubmit={submit}>
            <h3>Shipping address</h3>
            <label>
              Recipient name
              <input value={shippingAddress.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} autoComplete="name" />
            </label>
            <label>
              Phone
              <input value={shippingAddress.phone} onChange={(event) => updateField("phone", event.target.value)} autoComplete="tel" />
            </label>
            <label>
              Address line 1
              <input
                value={shippingAddress.addressLine1}
                onChange={(event) => updateField("addressLine1", event.target.value)}
                autoComplete="address-line1"
              />
            </label>
            <label>
              Address line 2
              <input
                value={shippingAddress.addressLine2 ?? ""}
                onChange={(event) => updateField("addressLine2", event.target.value)}
                autoComplete="address-line2"
              />
            </label>
            <div className="form-row">
              <label>
                City
                <input value={shippingAddress.city} onChange={(event) => updateField("city", event.target.value)} autoComplete="address-level2" />
              </label>
              <label>
                State
                <input
                  value={shippingAddress.stateOrProvince}
                  onChange={(event) => updateField("stateOrProvince", event.target.value)}
                  autoComplete="address-level1"
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Postal code
                <input value={shippingAddress.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} autoComplete="postal-code" />
              </label>
              <label>
                Country
                <input
                  value={shippingAddress.countryCode}
                  onChange={(event) => updateField("countryCode", event.target.value)}
                  autoComplete="country"
                  maxLength={2}
                />
              </label>
            </div>
            {(fieldError || checkout.error) && <p className="status-error">{fieldError ?? checkout.error?.message}</p>}
            <button type="submit" className="primary-action" disabled={checkout.isPending}>
              {checkout.isPending ? "Creating order..." : "Place order"}
            </button>
          </form>

          <aside className="order-summary panel">
            <h3>Order summary</h3>
            <div className="summary-lines">
              {cart.items.map((item) => (
                <div key={item.productId}>
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <strong>{formatPrice(item.lineTotalMinor, item.currency)}</strong>
                </div>
              ))}
              <div>
                <span>Shipping</span>
                <strong>{formatPrice(0, cart.currency)}</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>{formatPrice(cart.subtotalMinor, cart.currency)}</strong>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};
