import { Link } from "react-router-dom";
import { ScrollReveal } from "../../../components/ui/ScrollReveal.js";

export const FeaturedCollectionSection = () => {
  return (
    <section className="featured-collection-section" aria-label="Bộ sưu tập nổi bật">
      <div className="featured-collection-split">
        {/* 1. Image: fades in + slides from the left (x: -30 -> 0), 0.8s */}
        <ScrollReveal
          direction="left"
          distance={30}
          duration={800}
          className="featured-collection-media-wrapper"
        >
          <div className="featured-collection-media">
            <img
              src="/images/banner-sofa.jpg"
              alt="Bộ sưu tập Sofa & Phòng khách ZenLiving 2026"
              loading="lazy"
            />
          </div>
        </ScrollReveal>

        {/* 2. Text: fades in + slides from the right (x: 30 -> 0), 0.8s, 0.15s delay */}
        <ScrollReveal
          direction="right"
          distance={30}
          duration={800}
          delay={150}
          className="featured-collection-content-wrapper"
        >
          <div className="featured-collection-content">
            <p className="eyebrow">Bộ Sưu Tập Tiêu Biểu 2026</p>
            <h2>Nghệ Thuật Sống Tinh Giản &amp; Sang Trọng</h2>
            <p>
              Từng đường nét được tuyển chọn kỹ lưỡng, giao hòa giữa vẻ đẹp ấm cúng của gỗ tự nhiên và ngôn ngữ kiến trúc đương đại. Tạo nên không gian sống thanh bình cho gia đình bạn.
            </p>

            <div className="featured-collection-actions">
              <Link to="/products?category=sofa" className="primary-action">
                Khám Phá Ngay &rarr;
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
