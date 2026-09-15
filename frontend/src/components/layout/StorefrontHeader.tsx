import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore.js";
import { ChangePasswordModal } from "../../features/auth/components/ChangePasswordModal.js";
import { useCartQuery } from "../../features/cart/hooks/useCartQueries.js";
import type { Category } from "../../features/catalog/types.js";
import { SearchSuggestions } from "./SearchSuggestions.js";
import { UserDropdown } from "./UserDropdown.js";

interface StorefrontHeaderProps {
  categories?: Category[];
}

export const StorefrontHeader = ({ categories = [] }: StorefrontHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"products" | "rooms" | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
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
    if (!activeDropdown) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [activeDropdown]);

  const closeDropdown = () => {
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
                <Link to="/products" onClick={closeDropdown}>Tất cả sản phẩm</Link>
                {categories.map((cat) => (
                  <Link to={`/products?category=${cat.slug}`} key={cat.id} onClick={closeDropdown}>
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
                <Link to="/products?roomType=LIVING_ROOM" onClick={closeDropdown}>Phòng Khách</Link>
                <Link to="/products?roomType=BEDROOM" onClick={closeDropdown}>Phòng Ngủ</Link>
                <Link to="/products?roomType=DINING_ROOM" onClick={closeDropdown}>Phòng Ăn</Link>
                <Link to="/products?roomType=WORKING_ROOM" onClick={closeDropdown}>Phòng Làm Việc</Link>
                <Link to="/products?roomType=DECOR" onClick={closeDropdown}>Trang Trí &amp; Đèn</Link>
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
            {cartCount > 0 && <strong className="cart-badge" aria-live="polite">{cartCount > 99 ? "99+" : cartCount}</strong>}
          </Link>

          {/* Nút Đăng nhập / User Dropdown */}
          {user ? (
            <UserDropdown
              user={user}
              onOpenChangePassword={() => setShowChangePasswordModal(true)}
            />
          ) : (
            <Link className="nhaxinh-account-btn" to="/login">
              <span>Đăng nhập</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {user && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </header>
  );
};

