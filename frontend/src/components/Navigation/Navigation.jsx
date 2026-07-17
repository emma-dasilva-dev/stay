import { NavLink } from "react-router-dom";
import "./Navigation.css";

function Navigation() {
  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link is-active" : "nav-link";

  return (
    <nav
      className="top-navigation"
      aria-label="Navigation principale"
    >
      <NavLink
        to="/"
        end
        className={getLinkClass}
      >
        About
      </NavLink>

      <NavLink
        to="/destinations"
        className={getLinkClass}
      >
        Destinations
      </NavLink>

      <NavLink
        to="/booking"
        className={getLinkClass}
      >
        Réservation
      </NavLink>

      <NavLink
        to="/faq"
        className={getLinkClass}
      >
        FAQ
      </NavLink>

      <NavLink
        to="/account"
        className={getLinkClass}
      >
        Account
      </NavLink>
    </nav>
  );
}

export default Navigation;
