import { Link } from "react-router-dom";

export interface RoomSpace {
  id: string;
  name: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  link: string;
}

const DEFAULT_ROOMS: RoomSpace[] = [
  {
    id: "living-room",
    name: "Phòng Khách",
    subtitle: "Sang Trọng & Ấm Cúng",
    eyebrow: "Không Gian Sống",
    image: "/images/room-living.jpg",
    link: "/products?roomType=LIVING_ROOM",
  },
  {
    id: "dining-room",
    name: "Phòng Ăn",
    subtitle: "Sum Vầy & Tinh Tế",
    eyebrow: "Không Gian Bữa Ăn",
    image: "/images/room-dining.jpg",
    link: "/products?roomType=DINING_ROOM",
  },
  {
    id: "bedroom",
    name: "Phòng Ngủ",
    subtitle: "Thư Thái & Êm Ái",
    eyebrow: "Chốn Nghỉ Ngơi",
    image: "/images/room-bedroom.jpg",
    link: "/products?roomType=BEDROOM",
  },
  {
    id: "decor",
    name: "Trang Trí & Đèn",
    subtitle: "Điểm Nhấn Nghệ Thuật",
    eyebrow: "Nội Thất & Đồ Decor",
    image: "/images/room-decor.jpg",
    link: "/products?roomType=DECOR",
  },
];

interface RoomInspirationGridProps {
  rooms?: RoomSpace[];
}

export const RoomInspirationGrid = ({ rooms = DEFAULT_ROOMS }: RoomInspirationGridProps) => {
  return (
    <section className="room-inspiration-section">
      <div className="room-inspiration-header">
        <div className="section-heading">
          <p className="eyebrow">Cảm Hứng Thiết Kế</p>
          <h2>Không Gian Sống Nghệ Thuật</h2>
        </div>
      </div>

      <div className="room-grid">
        {rooms.map((room) => (
          <Link className="room-card" to={room.link} key={room.id}>
            <img className="room-card-image" src={room.image} alt={room.name} loading="lazy" />
            <div className="room-card-overlay" />
            <div className="room-card-body">
              <span className="eyebrow">{room.eyebrow}</span>
              <h3>{room.name}</h3>
              <p>{room.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
