import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";


import HamburgerMenu from "../HamburgerMenu/HamburgerMenu";
import Logo from "../Logo/Logo";
import Navigation from "../Navigation/Navigation";


import "./Layout.css";


function Layout({ children }) {
  const location = useLocation();


  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const isBookingPage = location.pathname === "/booking";
  const isAboutPage = location.pathname === "/";



  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);


  useEffect(() => {
    closeMenu();
  }, [closeMenu, location.pathname]);


  return (
    <main className="app-shell">
      <section
       className={`site-canvas ${
  isBookingPage ? "booking-theme" : ""
} ${isAboutPage ? "about-theme" : ""}`}
      >
        <header className="site-header">
  <Logo />


  <div className="header-navigation">
    <Navigation />
  </div>


  <button
    className="menu-button"
    type="button"
    aria-label="Ouvrir le menu"
    aria-expanded={isMenuOpen}
    onClick={() => setIsMenuOpen(true)}
  >
    <span></span>
    <span></span>
    <span></span>
  </button>
</header>


<div className="page-content">{children}</div>


        <HamburgerMenu
          isOpen={isMenuOpen}
          onClose={closeMenu}
        />
      </section>
    </main>
  );
}


export default Layout;
