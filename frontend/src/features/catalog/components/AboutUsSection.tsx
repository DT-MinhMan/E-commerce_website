export const AboutUsSection = () => {
  return (
    <section className="aboutus-section">
      <div className="aboutus-container">
        {/* Left column: Main large lifestyle image */}
        <div className="aboutus-media-col">
          <img
            src="/images/aboutus-1.jpg"
            alt="Không gian sống ZenLiving"
            className="aboutus-main-img"
            loading="lazy"
          />
        </div>

        {/* Right column: Warm panel with inset feature image and brand story */}
        <div className="aboutus-content-col">
          <div className="aboutus-inset-media">
            <img
              src="/images/aboutus-2.jpg"
              alt="Nội thất tinh tế ZenLiving"
              className="aboutus-inset-img"
              loading="lazy"
            />
          </div>

          <div className="aboutus-text-box">
            <h2>Về ZenLiving</h2>
            <p>
              ZenLiving là một trong những thương hiệu tiên phong trong ngành nội thất, với nguồn cảm hứng văn hóa Việt và gu thẩm mỹ tinh tế. ZenLiving luôn chú trọng đổi mới để duy trì vị thế là thương hiệu nội thất hàng đầu tại Việt Nam.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
