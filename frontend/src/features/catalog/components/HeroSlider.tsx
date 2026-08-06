import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

export interface SlideItem {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

const DEFAULT_SLIDES: SlideItem[] = [
  {
    id: "slide-1",
    image: "/images/banner-1.jpg",
    eyebrow: "Bộ Sưu Tập Mới 2026",
    title: "Kiến Tạo Không Gian Sống Tinh Tế & Đẳng Cấp",
    description: "Trải nghiệm bộ sưu tập nội thất cao cấp mang phong cách thiết kế đương đại, ấm cúng và hiện đại.",
    primaryCtaText: "Khám Phá Bộ Sưu Tập",
    primaryCtaLink: "/products",
    secondaryCtaText: "Xem Giỏ Hàng",
    secondaryCtaLink: "/cart",
  },
  {
    id: "slide-2",
    image: "/images/banner-2.jpg",
    eyebrow: "Phòng Khách Sang Trọng",
    title: "Sofa & Bàn Trà Tinh Tế Cho Ngôi Nhà Bạn",
    description: "Sự kết hợp hoàn hảo giữa chất liệu gỗ tự nhiên bền bỉ và đệm êm ái sang trọng.",
    primaryCtaText: "Sản Phẩm Nổi Bật",
    primaryCtaLink: "/products?category=sofa",
  },
  {
    id: "slide-3",
    image: "/images/banner-3.jpg",
    eyebrow: "Nội Thất Phòng Ăn",
    title: "Bàn Ăn Ấm Cúng Cho Bữa Cơm Gia Đình",
    description: "Thiết kế tinh gọn, hiện đại mang lại cảm giác ấm áp và không gian sum vầy tròn đầy.",
    primaryCtaText: "Khám Phá Ngay",
    primaryCtaLink: "/products?category=table",
  },
];

interface HeroSliderProps {
  slides?: SlideItem[];
  autoPlayInterval?: number;
}

export const HeroSlider = ({ slides = DEFAULT_SLIDES, autoPlayInterval = 4500 }: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((newIndex: number) => {
    setCurrentIndex((current) => {
      setPrevIndex(current);
      return newIndex;
    });
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, goToSlide, slides.length]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayInterval, isPaused, nextSlide]);

  return (
    <section
      className="nhaxinh-hero-slider"
      aria-label="Hero Banner Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="slider-container">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const isPrevious = index === prevIndex;
          const statusClass = isActive ? "active" : isPrevious ? "previous" : "";
          return (
            <article className={`slide-item ${statusClass}`} key={slide.id}>
              <img className="slide-bg-image" src={slide.image} alt={slide.title} loading={index === 0 ? "eager" : "lazy"} />
              <div className="slide-overlay" />
              <div className="slide-caption-wrapper">
                <span className="eyebrow">{slide.eyebrow}</span>
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
                <div className="slide-actions">
                  <Link className="slide-btn-primary" to={slide.primaryCtaLink}>
                    {slide.primaryCtaText}
                  </Link>
                  {slide.secondaryCtaText && slide.secondaryCtaLink && (
                    <Link className="slide-btn-secondary" to={slide.secondaryCtaLink}>
                      {slide.secondaryCtaText}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Chuyển đến slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
