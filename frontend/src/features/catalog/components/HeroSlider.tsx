import { useState, useEffect, useCallback, useRef } from "react";
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

export const HeroSlider = ({ slides = DEFAULT_SLIDES, autoPlayInterval = 6500 }: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const bannerRef = useRef<HTMLElement>(null);

  // Kích hoạt chữ sau khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Parallax Scroll & Fade-out on scroll đo trực tiếp từ window.scrollY
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const banner = bannerRef.current;
          if (banner) {
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            const bannerHeight = banner.offsetHeight || 550;

            // Tiến trình cuộn từ 0 -> 1 dựa trên scroll thực tế
            const scrollProgress = Math.max(0, Math.min(1, scrollY / bannerHeight));

            // 1. Fade-out on scroll qua 75% đầu: heroOpacity đi từ 1 -> 0
            const fadeProgress = Math.max(0, Math.min(1, scrollY / (bannerHeight * 0.75)));
            const heroOpacity = Math.max(0, 1 - fadeProgress);
            const captionShift = -(fadeProgress * 48); // trôi nhẹ lên 48px khi mờ đi

            // 2. Parallax scroll shift: ảnh dịch chuyển xuống 0% -> +22% để trôi chậm hơn trang
            const parallaxShift = scrollProgress * 22;

            banner.style.setProperty("--hero-caption-opacity", `${heroOpacity}`);
            banner.style.setProperty("--hero-caption-shift", `${captionShift}px`);
            banner.style.setProperty("--hero-caption-pointer", heroOpacity <= 0.05 ? "none" : "auto");
            banner.style.setProperty("--hero-parallax-y", `${parallaxShift}%`);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      ref={bannerRef}
      className="nhaxinh-hero-slider"
      aria-label="Hero Banner Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="slider-container">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const isPrevious = index === prevIndex;
          const captionStateClass = isMounted ? "caption-visible" : "caption-waiting";
          const statusClass = isActive
            ? `active ${captionStateClass}`
            : isPrevious
              ? "previous"
              : "";
          return (
            <article className={`slide-item ${statusClass}`} key={slide.id}>
              {/* Parallax layer bọc ngoài để phân tách độc lập với Ken Burns scale */}
              <div className="slide-bg-parallax">
                <img
                  className="slide-bg-image"
                  src={slide.image}
                  alt={slide.title}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>

              <div className="slide-overlay" />

              {/* Caption container có hiệu ứng Fade-out on scroll */}
              <div className="slide-caption-scroll-layer">
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
