import { Link } from "react-router-dom";
import type { Category } from "../../features/catalog/types.js";

interface StorefrontFooterProps {
  categories?: Category[];
}

export const StorefrontFooter = ({ categories = [] }: StorefrontFooterProps) => (
  <footer className="storefront-footer">
    <div className="storefront-footer-inner">
      <div className="footer-brand">
        <Link to="/" className="footer-logo-box" aria-label="ZenLiving trang chủ">
          <img src="/images/logo.png" alt="ZenLiving" className="footer-logo-img" />
        </Link>
        <p className="footer-brand-desc">
          Cửa hàng nội thất và đồ gia dụng tuyển chọn, mang đến không gian sống tinh tế và tiện nghi.
        </p>

        <div className="footer-address">
          <svg className="address-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Số 123, đường Marie Curie, Quận 12, TP. Đà Nẵng</span>
        </div>
      </div>

      <nav className="footer-column" aria-label="Footer catalog navigation">
        <h3>Danh mục sản phẩm</h3>
        <Link to="/products">Tất cả sản phẩm</Link>
        {categories.slice(0, 4).map((category) => (
          <Link to={`/products?category=${category.slug}`} key={category.id}>
            {category.name}
          </Link>
        ))}
      </nav>

      <nav className="footer-column" aria-label="Footer account navigation">
        <h3>Tài khoản &amp; Đơn hàng</h3>
        <Link to="/account">Tài khoản của tôi</Link>
        <Link to="/orders">Lịch sử đơn hàng</Link>
        <Link to="/cart">Giỏ hàng</Link>
      </nav>

      <div className="footer-column">
        <h3>Mạng xã hội</h3>
        <p className="footer-social-note">Theo dõi ZenLiving trên các nền tảng:</p>
        <div className="footer-social-icons">
          {/* YouTube */}
          <div className="social-badge social-youtube" title="YouTube" aria-label="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>YouTube</span>
          </div>

          {/* Messenger */}
          <div className="social-badge social-messenger" title="Messenger" aria-label="Messenger">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.45 5.518 3.716 7.214V22l3.35-1.84c.942.26 1.94.402 2.934.402 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.2 12.333l-2.58-2.753-5.033 2.753 5.537-5.88 2.64 2.753 4.973-2.753-5.537 5.88z"/>
            </svg>
            <span>Messenger</span>
          </div>

          {/* Zalo */}
          <div className="social-badge social-zalo" title="Zalo" aria-label="Zalo">
            <span className="zalo-text-badge">Zalo</span>
            <span>Zalo</span>
          </div>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2026 ZenLiving Storefront. All rights reserved.</p>
      <p>Nền tảng Thương mại Điện tử MERN Stack</p>
    </div>
  </footer>
);

