import { ScrollReveal } from "../../../components/ui/ScrollReveal.js";

interface InstagramItem {
  id: string;
  image: string;
  tag: string;
  link: string;
}

const INSTAGRAM_POSTS: InstagramItem[] = [
  {
    id: "insta-1",
    image: "/images/goc-cam-hung-1.jpg",
    tag: "@zenliving.livingroom",
    link: "https://instagram.com",
  },
  {
    id: "insta-2",
    image: "/images/goc-cam-hung-2.jpg",
    tag: "@zenliving.dining",
    link: "https://instagram.com",
  },
  {
    id: "insta-3",
    image: "/images/goc-cam-hung-3.jpg",
    tag: "@zenliving.bedroom",
    link: "https://instagram.com",
  },
  {
    id: "insta-4",
    image: "/images/goc-cam-hung-4.jpg",
    tag: "@zenliving.minimalism",
    link: "https://instagram.com",
  },
];

export const InstagramSection = () => {
  return (
    <section className="instagram-feed-section" aria-label="Instagram ZenLiving">
      {/* Heading: fades in + slides up (y: 20 -> 0), 0.6s */}
      <ScrollReveal direction="up" distance={20} duration={600}>
        <div className="instagram-feed-header">
          <p className="eyebrow">Theo Dõi @ZenLiving</p>
          <h2>Không Gian Sống Cùng Cộng Đồng ZenLiving</h2>
          <p>Khám phá khoảnh khắc bài trí thực tế và cảm hứng sống chậm từ khách hàng thân thiết</p>
        </div>
      </ScrollReveal>

      {/* Tiles grid: Each tile fades in + scales up (scale: 0.95 -> 1), 0.5s, staggered by index * 0.1s */}
      <div className="instagram-feed-grid">
        {INSTAGRAM_POSTS.map((item, index) => (
          <ScrollReveal
            key={item.id}
            direction="scale"
            scaleFrom={0.95}
            duration={500}
            delay={index * 100}
          >
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-feed-tile"
              aria-label={`Xem bài đăng ${item.tag} trên Instagram`}
            >
              <img src={item.image} alt={item.tag} loading="lazy" />
              <div className="instagram-tile-overlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>{item.tag}</span>
              </div>
            </a>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};
