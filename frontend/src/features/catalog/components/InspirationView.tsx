export const InspirationView = () => {
  return (
    <div className="inspiration-zigzag-page">
      {/* 1. Full-width Hero Banner */}
      <header className="inspiration-hero">
        <img
          src="/images/banner-goc-cam-hung.jpg"
          alt="Góc cảm hứng banner"
          className="inspiration-hero-bg"
        />
        <div className="inspiration-hero-overlay" />
        <div className="inspiration-hero-content">
          <span className="inspiration-hero-badge">GÓC CẢM HỨNG &amp; Ý TƯỞNG THIẾT KẾ</span>
          <h1 className="inspiration-hero-title">Ý Tưởng Kiến Tạo Không Gian Sống</h1>
          <p className="inspiration-hero-desc">
            Gợi ý bài trí nội thất tinh tế, mang dấu ấn nghệ thuật và sự ấm áp đến từng góc nhỏ trong ngôi nhà của bạn.
          </p>
        </div>
      </header>

      {/* 2. Intro Quote Section */}
      <section className="inspiration-intro">
        <div className="inspiration-intro-container">
          <div className="inspiration-quote-mark">“</div>
          <blockquote className="inspiration-quote-text">
            Mỗi ngôi nhà là một câu chuyện riêng biệt. Chúng tôi tin rằng không gian sống hoàn hảo không chỉ đến từ những món đồ đắt giá, mà đến từ sự kết hợp hài hòa giữa ánh sáng, màu sắc và cảm xúc của gia chủ.
          </blockquote>
          <p className="inspiration-quote-author">— Đội Ngũ Thiết Kế ZenLiving —</p>
        </div>
      </section>

      {/* Main Zig-Zag List Section */}
      <main className="inspiration-zigzag-body">
        {/* Intro Banner */}
        <section className="inspiration-intro-simple">
          <span className="eyebrow">KHÁM PHÁ Ý TƯỞNG</span>
          <h2>Gợi Ý Bài Trí Nội Thất ZenLiving</h2>
          <div className="editorial-divider" />
        </section>

        {/* Item 1: Ảnh bên TRÁI, Ý tưởng bên PHẢI */}
        <section className="zigzag-item item-left-img">
          <div className="zigzag-img-box">
            <img
              src="/images/goc-cam-hung-1.jpg"
              alt="Ý tưởng phòng khách"
              className="zigzag-img"
              loading="lazy"
            />
          </div>
          <div className="zigzag-content-box">
            <span className="zigzag-badge">01 / PHÒNG KHÁCH</span>
            <h2>Không Gian Sống Tối Giản &amp; Sang Trọng</h2>
            <p className="zigzag-text">
              Sử dụng các gam màu trung tính như be, xám nhạt kết hợp cùng sofa bọc da hoặc nệm vải mịn màng giúp mở rộng thị giác. Bàn trà gỗ tự nhiên chân mảnh kết hợp khung cửa kính lớn đón ánh sáng tự nhiên tạo nên không gian tiếp khách vô cùng thoáng đãng, ấm áp và thanh lịch.
            </p>
            <div className="zigzag-tags">
              <span>#TốiGiản</span>
              <span>#ÁnhSángTựNhiên</span>
              <span>#SofaDaGỗSồi</span>
            </div>
          </div>
        </section>

        {/* Item 2: Ý tưởng bên TRÁI, Ảnh bên PHẢI */}
        <section className="zigzag-item item-right-img">
          <div className="zigzag-content-box">
            <span className="zigzag-badge">02 / PHÒNG ĂN</span>
            <h2>Góc Bữa Ăn Ấm Cúng Cho Gia Đình</h2>
            <p className="zigzag-text">
              Lựa chọn chiếc bàn ăn gỗ sồi nguyên khối với đường vân tự nhiên độc bản làm trung tâm gian bếp. Treo đèn thả trần cách mặt bàn 75cm tỏa ánh sáng vàng dịu giúp các món ăn thêm phần hấp dẫn, đồng thời tạo bầu không khí sum vầy riêng tư và thân mật cho cả gia đình.
            </p>
            <div className="zigzag-tags">
              <span>#BànĂnGỗSồi</span>
              <span>#ĐènThảNghệThuật</span>
              <span>#ẤmCúngSumVầy</span>
            </div>
          </div>
          <div className="zigzag-img-box">
            <img
              src="/images/goc-cam-hung-2.jpg"
              alt="Ý tưởng phòng ăn"
              className="zigzag-img"
              loading="lazy"
            />
          </div>
        </section>

        {/* Item 3: Ảnh bên TRÁI, Ý tưởng bên PHẢI */}
        <section className="zigzag-item item-left-img">
          <div className="zigzag-img-box">
            <img
              src="/images/goc-cam-hung-3.jpg"
              alt="Ý tưởng phòng ngủ"
              className="zigzag-img"
              loading="lazy"
            />
          </div>
          <div className="zigzag-content-box">
            <span className="zigzag-badge">03 / PHÒNG NGỦ</span>
            <h2>Chốn Bình Yên Tái Tạo Năng Lượng</h2>
            <p className="zigzag-text">
              Phòng ngủ chú trọng sự thư thái với giường ngủ bọc nệm vải mềm mại, tông màu pastel nhã nhặn và rèm chắn sáng 2 lớp. Tiết chế thiết bị điện tử, ưu tiên ánh sáng dịu nhẹ từ đèn ngủ đầu giường mang lại giấc ngủ sâu và trọn vẹn mỗi đêm.
            </p>
            <div className="zigzag-tags">
              <span>#NghỉNgơi</span>
              <span>#TôngMàuNhãNhặn</span>
              <span>#GiườngBọcNệm</span>
            </div>
          </div>
        </section>

        {/* Item 4: Ý tưởng bên TRÁI, Ảnh bên PHẢI */}
        <section className="zigzag-item item-right-img">
          <div className="zigzag-content-box">
            <span className="zigzag-badge">04 / ĐỒ TRANG TRÍ &amp; ĐÈN</span>
            <h2>Điểm Nhấn Nghệ Thuật Cho Từng Góc Nhỏ</h2>
            <p className="zigzag-text">
              Thổi hồn vào khoảng trống bằng các món đồ decor thủ công như bình gốm vuốt tay, tranh nghệ thuật hay thảm dệt sợi tự nhiên. Sắp xếp phụ kiện theo quy tắc số 3 hoặc 5 với độ cao khác nhau để tạo nhịp điệu thị giác ấn tượng và tôn vinh gu thẩm mỹ gia chủ.
            </p>
            <div className="zigzag-tags">
              <span>#GốmThủCông</span>
              <span>#TranhNghệThuật</span>
              <span>#QuyTắcSắpĐặt</span>
            </div>
          </div>
          <div className="zigzag-img-box">
            <img
              src="/images/goc-cam-hung-4.jpg"
              alt="Ý tưởng đồ trang trí"
              className="zigzag-img"
              loading="lazy"
            />
          </div>
        </section>
      </main>
    </div>
  );
};
