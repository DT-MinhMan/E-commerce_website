export const ProductDetailSkeleton = () => (
  <div
    className="product-detail-container product-detail-skeleton-container"
    role="status"
    aria-busy="true"
    aria-label="Đang tải thông tin sản phẩm"
  >
    {/* Skeleton Breadcrumbs */}
    <div className="skeleton-breadcrumbs">
      <div className="skeleton-box skeleton-crumb" style={{ width: "72px" }} />
      <span className="breadcrumb-separator">/</span>
      <div className="skeleton-box skeleton-crumb" style={{ width: "64px" }} />
      <span className="breadcrumb-separator">/</span>
      <div className="skeleton-box skeleton-crumb" style={{ width: "120px" }} />
    </div>

    {/* Skeleton Main Grid */}
    <div className="product-detail-layout">
      {/* Left: Gallery Skeleton */}
      <div className="product-gallery-skeleton">
        <div className="skeleton-box skeleton-gallery-stage" />
        <div className="skeleton-thumbnails-row">
          <div className="skeleton-box skeleton-thumb" />
          <div className="skeleton-box skeleton-thumb" />
          <div className="skeleton-box skeleton-thumb" />
          <div className="skeleton-box skeleton-thumb" />
        </div>
      </div>

      {/* Right: Buy Box Skeleton */}
      <div className="product-detail-content">
        <div className="skeleton-header-row">
          <div className="skeleton-box" style={{ width: "100px", height: "22px", borderRadius: "999px" }} />
          <div className="skeleton-box" style={{ width: "80px", height: "22px", borderRadius: "999px" }} />
        </div>
        <div className="skeleton-box" style={{ width: "80%", height: "34px", marginTop: "12px" }} />
        <div className="skeleton-box" style={{ width: "50%", height: "34px", marginTop: "8px" }} />

        <div className="skeleton-price-row" style={{ marginTop: "24px" }}>
          <div className="skeleton-box" style={{ width: "150px", height: "32px" }} />
          <div className="skeleton-box" style={{ width: "85px", height: "24px", borderRadius: "999px" }} />
        </div>

        {/* Quantity selector skeleton */}
        <div style={{ marginTop: "24px" }}>
          <div className="skeleton-box" style={{ width: "55px", height: "14px", marginBottom: "8px" }} />
          <div className="skeleton-box" style={{ width: "136px", height: "44px", borderRadius: "var(--radius-sm)" }} />
        </div>

        {/* CTA Buttons skeleton */}
        <div className="product-cta-group" style={{ marginTop: "24px" }}>
          <div className="skeleton-box" style={{ width: "100%", height: "48px", borderRadius: "var(--radius-sm)" }} />
          <div className="skeleton-box" style={{ width: "100%", height: "48px", borderRadius: "var(--radius-sm)" }} />
        </div>

        {/* Trust Badges skeleton */}
        <div className="trust-badges-grid" style={{ marginTop: "28px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="trust-badge-item" style={{ opacity: 0.6 }}>
              <div className="skeleton-box" style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-box" style={{ width: "85%", height: "14px", marginBottom: "6px" }} />
                <div className="skeleton-box" style={{ width: "60%", height: "12px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Skeleton Tabs */}
    <div className="product-details-tabs-wrapper" style={{ marginTop: "40px" }}>
      <div className="skeleton-tabs-nav">
        <div className="skeleton-box" style={{ width: "110px", height: "22px" }} />
        <div className="skeleton-box" style={{ width: "130px", height: "22px" }} />
        <div className="skeleton-box" style={{ width: "140px", height: "22px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
        <div className="skeleton-box" style={{ width: "100%", height: "16px" }} />
        <div className="skeleton-box" style={{ width: "92%", height: "16px" }} />
        <div className="skeleton-box" style={{ width: "84%", height: "16px" }} />
        <div className="skeleton-box" style={{ width: "65%", height: "16px" }} />
      </div>
    </div>
  </div>
);
