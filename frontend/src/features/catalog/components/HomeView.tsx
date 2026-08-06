import { Link } from "react-router-dom";
import { ProductCardWithCartAction } from "./ProductCardWithCartAction.js";
import { useCategoriesQuery, useProductsQuery } from "../hooks/useCatalogQueries.js";
import { HeroSlider } from "./HeroSlider.js";
import { BrandHighlights } from "./BrandHighlights.js";
import { RoomInspirationGrid } from "./RoomInspirationGrid.js";
import { AboutUsSection } from "./AboutUsSection.js";

const getCategoryImage = (categoryName: string, categorySlug: string): string => {
  const nameLower = (categoryName + " " + categorySlug).toLowerCase();
  if (nameLower.includes("sofa") || nameLower.includes("ghế")) return "/images/sofa.jpg";
  if (nameLower.includes("bàn") || nameLower.includes("table")) return "/images/table.jpg";
  if (nameLower.includes("giường") || nameLower.includes("bed")) return "/images/bed.jpg";
  return "/images/room-decor.jpg";
};

export const HomeView = () => {
  const categoriesQuery = useCategoriesQuery();
  const productsQuery = useProductsQuery({ page: 1, limit: 4, sort: "newest" });
  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data?.products ?? [];

  return (
    <section className="home-page">
      {/* 1. Dynamic Hero Banner Slider */}
      <HeroSlider />

      {/* 2. Brand Value & Service Commitments */}
      <BrandHighlights />

      {/* 3. Room Inspiration Magazine Grid */}
      <RoomInspirationGrid />

      {/* 4. Brand Story Section (Về ZenLiving) */}
      <AboutUsSection />

      {/* 4. Category Showcase with Rich Visual Cards */}
      <section className="home-section">
        <div className="section-heading-row">
          <div className="section-heading">
            <p className="eyebrow">Danh Mục Tuyển Chọn</p>
            <h2 className="serif-title">
              Khám Phá Theo Danh Mục
            </h2>
          </div>
          <Link className="text-link" to="/products">
            Tất Cả Danh Mục &rarr;
          </Link>
        </div>

        {categoriesQuery.isLoading && (
          <div className="category-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="category-tile category-tile-skeleton" key={index}>
                <span />
                <span />
              </div>
            ))}
          </div>
        )}

        {categoriesQuery.isSuccess && categories.length > 0 && (
          <div className="category-grid">
            {categories.slice(0, 4).map((category) => (
              <Link
                className="category-card-item"
                to={`/products?category=${category.slug}`}
                key={category.id}
              >
                <div className="category-card-media">
                  <img
                    src={getCategoryImage(category.name, category.slug)}
                    alt={category.name}
                    loading="lazy"
                  />
                </div>
                <div className="category-card-info">
                  <h3>{category.name}</h3>
                  <p>{category.description ?? "Khám phá danh mục các sản phẩm cao cấp."}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. Featured Products Showcase */}
      <section className="home-section">
        <div className="section-heading-row">
          <div className="section-heading">
            <p className="eyebrow">Sản Phẩm Độc Quyền</p>
            <h2 className="serif-title">
              Sản Phẩm Nổi Bật Vừa Cập Nhật
            </h2>
          </div>
          <Link className="text-link" to="/products">
            Xem Toàn Bộ &rarr;
          </Link>
        </div>

        {productsQuery.isLoading && (
          <div className="product-grid product-grid-featured">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="product-card product-card-skeleton" key={index}>
                <div className="product-card-image" />
                <div className="product-card-body">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        )}

        {productsQuery.isSuccess && products.length > 0 && (
          <div className="product-grid product-grid-featured">
            {products.map((product) => (
              <ProductCardWithCartAction
                product={product}
                categoryName={categories.find((category) => category.id === product.categoryId)?.name}
                imageLoading="lazy"
                key={product.id}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
};

