import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./HamburgerMenu.css";


function HamburgerMenu({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }


    const previousOverflow = document.body.style.overflow;


    document.body.style.overflow = "hidden";


    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }


    window.addEventListener("keydown", handleEscape);


    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);


  const getLinkClass = ({ isActive }) =>
    isActive
      ? "hamburger-menu-link is-active"
      : "hamburger-menu-link";


  return (
    <>
      <button
        type="button"
        className={`hamburger-menu-backdrop ${
          isOpen ? "is-visible" : ""
        }`}
        onClick={onClose}
        aria-label="Fermer le menu"
        tabIndex={isOpen ? 0 : -1}
      />


      <aside
        className={`hamburger-menu-panel ${
          isOpen ? "is-open" : ""
        }`}
        aria-hidden={!isOpen}
        aria-label="Navigation principale"
      >
        <header className="hamburger-menu-header">
          <div>
            <span className="hamburger-menu-brand">STAY</span>
            <span className="hamburger-menu-label">
              Séjours au Bénin
            </span>
          </div>


          <button
            type="button"
            className="hamburger-menu-close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            ×
          </button>
        </header>


        <nav className="hamburger-menu-navigation">
          <span className="hamburger-menu-eyebrow">
            Explorer
          </span>


          <NavLink
            to="/"
            end
            className={getLinkClass}
            onClick={onClose}
          >
            <span>01</span>
            Accueil
          </NavLink>


          <NavLink
            to="/destinations"
            className={getLinkClass}
            onClick={onClose}
          >
            <span>02</span>
            Destinations
          </NavLink>


          <NavLink
            to="/booking"
            className={getLinkClass}
            onClick={onClose}
          >
            <span>03</span>
            Réservation
          </NavLink>


          <NavLink
            to="/faq"
            className={getLinkClass}
            onClick={onClose}
          >
            <span>04</span>
            FAQ
          </NavLink>


          <NavLink
            to="/account"
            className={getLinkClass}
            onClick={onClose}
          >
            <span>05</span>
            Compte
          </NavLink>
        </nav>


        <footer className="hamburger-menu-footer">
          <p>
            Des séjours choisis pour ralentir, respirer et
            découvrir autrement le Bénin.
          </p>


          <div>
            <a
              href="https://wa.me/22940343012"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>


            <a href="tel:+2290140343012">
              Nous appeler
            </a>
          </div>
        </footer>
      </aside>
    </>
  );
}


export default HamburgerMenu;
