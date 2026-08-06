export const BrandHighlights = () => {
  return (
    <section className="brand-highlights-bar">
      <div className="highlight-item">
        <div className="highlight-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <div className="highlight-text">
          <strong>Giao Hàng Tận Nơi</strong>
          <span>Miễn phí vận chuyển toàn quốc</span>
        </div>
      </div>

      <div className="highlight-item">
        <div className="highlight-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="highlight-text">
          <strong>Bảo Hành 2 Năm</strong>
          <span>Cam kết chất lượng bền lâu</span>
        </div>
      </div>

      <div className="highlight-item">
        <div className="highlight-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div className="highlight-text">
          <strong>Tư Vấn Thiết Kế 3D</strong>
          <span>Hỗ trợ không gian sống tối ưu</span>
        </div>
      </div>

      <div className="highlight-item">
        <div className="highlight-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <div className="highlight-text">
          <strong>Sản Phẩm Đạt Chuẩn</strong>
          <span>Gỗ tự nhiên & da cao cấp</span>
        </div>
      </div>
    </section>
  );
};
