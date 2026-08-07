import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogout } from "../../features/auth/hooks/useAuthQueries.js";
import { useAuthStore } from "../../features/auth/store/authStore.js";
import { useCartQuery } from "../../features/cart/hooks/useCartQueries.js";
import type { Category } from "../../features/catalog/types.js";
import { SearchSuggestions } from "./SearchSuggestions.js";

interface StorefrontHeaderProps {
  categories?: Category[];
}

export const StorefrontHeader = ({ categories = [] }: StorefrontHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"products" | "rooms" | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const drawerId = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const cartQuery = useCartQuery();
  const cartCount = cartQuery.data?.itemCount ?? 0;

  // Sync search input with URL q param
  useEffect(() => {
    const urlQ = new URLSearchParams(location.search).get("q") ?? "";
    setSearchTerm(urlQ);
    setShowSuggestions(false);
  }, [location.search]);

  // Click outside to close suggestions
  useEffect(() => {
    if (!showSuggestions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  };

  const closeSuggestions = useCallback(() => setShowSuggestions(false), []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchTerm.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/products");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.trim().length >= 2);
  };

  const handleSearchFocus = () => {
    if (searchTerm.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const roomTypeParam = searchParams.get("roomType");
  const sortParam = searchParams.get("sort");
  const viewParam = searchParams.get("view");

  const isHomeActive = location.pathname === "/";
  const isRoomActive = location.pathname.startsWith("/products") && Boolean(roomTypeParam);
  const isCollectionActive = location.pathname.startsWith("/products") && sortParam === "newest" && !roomTypeParam;
  const isInspirationActive = location.pathname.startsWith("/inspiration") || location.pathname.startsWith("/goc-cam-hung") || (location.pathname.startsWith("/products") && viewParam === "inspiration");
  const isProductsActive =
    location.pathname.startsWith("/products") &&
    !roomTypeParam &&
    sortParam !== "newest" &&
    viewParam !== "inspiration";

  return (
    <header className="app-header nhaxinh-header">
      <div className="header-bar nhaxinh-header-bar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Open navigation"
          aria-controls={drawerId}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* 1. Logo ZenLiving Hình Ảnh */}
        <Link className="brand-mark nhaxinh-logo-box" to="/" aria-label="ZenLiving trang chủ">
          <img src="/images/logo.png" alt="ZenLiving" className="brand-logo-img" />
        </Link>

        {/* 2. Menu Điều Hướng Desktop */}
        <nav className="nav-links desktop-nav nhaxinh-nav" aria-label="Primary navigation">
          <Link to="/" className={isHomeActive ? "active" : ""}>TRANG CHỦ</Link>

          {/* Menu Dropdown: SẢN PHẨM */}
          <div
            className="nhaxinh-dropdown-container"
            onMouseEnter={() => setActiveDropdown("products")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link to="/products" className={`dropdown-trigger ${isProductsActive ? "active" : ""}`}>
              SẢN PHẨM <span className="dropdown-arrow">∨</span>
            </Link>
            {activeDropdown === "products" && (
              <div className="nhaxinh-dropdown-menu">
                <Link to="/products" onClick={closeMenu}>Tất cả sản phẩm</Link>
                {categories.map((cat) => (
                  <Link to={`/products?category=${cat.slug}`} key={cat.id} onClick={closeMenu}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Menu Dropdown: PHÒNG */}
          <div
            className="nhaxinh-dropdown-container"
            onMouseEnter={() => setActiveDropdown("rooms")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link to="/products?roomType=LIVING_ROOM" className={`dropdown-trigger ${isRoomActive ? "active" : ""}`}>
              PHÒNG <span className="dropdown-arrow">∨</span>
            </Link>
            {activeDropdown === "rooms" && (
              <div className="nhaxinh-dropdown-menu">
                <Link to="/products?roomType=LIVING_ROOM" onClick={closeMenu}>Phòng Khách</Link>
                <Link to="/products?roomType=BEDROOM" onClick={closeMenu}>Phòng Ngủ</Link>
                <Link to="/products?roomType=DINING_ROOM" onClick={closeMenu}>Phòng Ăn</Link>
                <Link to="/products?roomType=WORKING_ROOM" onClick={closeMenu}>Phòng Làm Việc</Link>
                <Link to="/products?roomType=DECOR" onClick={closeMenu}>Trang Trí &amp; Đèn</Link>
              </div>
            )}
          </div>

          <Link to="/products?sort=newest" className={isCollectionActive ? "active" : ""}>BỘ SƯU TẬP</Link>
          <Link to="/inspiration" className={isInspirationActive ? "active" : ""}>GÓC CẢM HỨNG</Link>
        </nav>

        {/* 3. Thanh Tìm Kiếm, Giỏ Hàng & Đăng Nhập */}
        <div className="header-right-actions">
          {/* Form tìm kiếm Pill + Suggestions */}
          <div className="search-pill-wrapper" ref={searchWrapperRef}>
            <form className="nhaxinh-search-pill" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Tìm sản phẩm"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onKeyDown={handleSearchKeyDown}
                aria-label="Tìm sản phẩm"
                autoComplete="off"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.5" y2="16.5" />
                </svg>
              </button>
            </form>
            <SearchSuggestions query={searchTerm} visible={showSuggestions} onClose={closeSuggestions} />
          </div>

          {/* Icon Giỏ hàng (Túi xách) */}
          <Link className="nhaxinh-cart-btn" to="/cart" aria-label={`Giỏ hàng có ${cartCount} sản phẩm`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && <strong className="cart-badge">{cartCount > 99 ? "99+" : cartCount}</strong>}
          </Link>

          {/* Nút Đăng nhập / Tài khoản */}
          <Link className="nhaxinh-account-btn" to={user ? "/account" : "/login"}>
            <span>{user ? (user.fullName || "Tài khoản") : "Đăng nhập"}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMenuOpen && (
        <>
          <button type="button" className="drawer-backdrop" aria-label="Đóng menu" onClick={closeMenu} />
          <aside className="mobile-drawer mobile-drawer-open" id={drawerId} role="dialog" aria-modal="true">
            <div className="drawer-header">
              <Link className="brand-mark nhaxinh-logo-box" to="/" onClick={closeMenu}>
                <img src="/images/logo.png" alt="ZenLiving" className="brand-logo-img" />
              </Link>
              <button type="button" className="drawer-close" aria-label="Đóng menu" onClick={closeMenu}>
                ✕
              </button>
            </div>
            <nav className="drawer-nav" aria-label="Mobile navigation">
              <Link to="/" className={isHomeActive ? "active" : ""} onClick={closeMenu}>TRANG CHỦ</Link>
              <Link to="/products" className={isProductsActive && !searchParams.get("category") ? "active" : ""} onClick={closeMenu}>TẤT CẢ SẢN PHẨM</Link>
              {categories.map((category) => (
                <Link
                  to={`/products?category=${category.slug}`}
                  key={category.id}
                  className={location.pathname.startsWith("/products") && searchParams.get("category") === category.slug ? "active" : ""}
                  onClick={closeMenu}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
            <div className="drawer-account">
              {user ? (
                <>
                  <Link className="secondary-action" to="/account" onClick={closeMenu}>Tài khoản của tôi</Link>
                  {user.role === "ADMIN" && (
                    <Link className="secondary-action" to="/admin" onClick={closeMenu}>Trang Quản trị</Link>
                  )}
                  <button type="button" className="secondary-action" onClick={() => logout.mutate()} disabled={status === "loading"}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link className="primary-link" to="/login" onClick={closeMenu}>Đăng nhập</Link>
                  <Link className="secondary-action" to="/register" onClick={closeMenu}>Tạo tài khoản</Link>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </header>
  );
};

