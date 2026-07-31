import { Link } from "react-router-dom";

export const HomePage = () => (
  <section className="home-hero">
    <p className="eyebrow">Customer storefront</p>
    <h2>MERN E-commerce Platform</h2>
    <p>Browse the active public catalog with search, filters, sorting and pagination powered by the Phase 4 API.</p>
    <Link className="primary-link" to="/products">
      Shop products
    </Link>
  </section>
);
