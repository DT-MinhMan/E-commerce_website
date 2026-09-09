import { ScrollReveal } from "../../../components/ui/ScrollReveal.js";

export const BrandPhilosophyQuote = () => {
  return (
    <section className="brand-quote-section" aria-label="Triết lý thương hiệu ZenLiving">
      <ScrollReveal distance={28} duration={850} className="brand-quote-container">
        <p className="brand-quote-eyebrow">Về Chúng Tôi</p>
        <blockquote className="brand-quote-title">
          Chúng tôi tin vào vẻ đẹp của lối sống chậm—trong những tạo tác đong đầy tâm huyết, chất liệu bền đẹp cùng thời gian, và những không gian gợi mở sự <em>lắng lại</em>.
        </blockquote>
        <p className="brand-quote-description">
          Mỗi tuyệt phẩm trong bộ sưu tập đều được tuyển chọn kỹ lưỡng từ độ chân thực của vật liệu, câu chuyện của người làm nghề và khả năng đồng hành dài lâu cùng năm tháng. Chúng tôi hợp tác cùng các nghệ nhân có chung cam kết về nghệ thuật thủ công tinh xảo và sự phát triển bền vững.
        </p>
      </ScrollReveal>
    </section>
  );
};
