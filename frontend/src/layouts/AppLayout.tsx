import { NavLink, Outlet } from "react-router-dom";

export const AppLayout = () => (
  <div className="app-shell">
    <header className="app-header">
      <div>
        <p className="eyebrow">Phase 1</p>
        <h1>MERN E-commerce Platform</h1>
      </div>
      <nav className="nav-links" aria-label="Primary navigation">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/health">Health</NavLink>
      </nav>
    </header>
    <main className="app-main">
      <Outlet />
    </main>
  </div>
);
