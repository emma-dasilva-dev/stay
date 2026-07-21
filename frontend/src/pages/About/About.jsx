import { useRef } from "react";
import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../../services/api";
import "./about.css";

function ArrowIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 15L15 5" />
      <path d="M7 5H15V13" />
    </svg>
  );
}

function About() {
  const heroVisualRef = useRef(null);

  const handleHeroMouseMove = (event) => {
    const visual = heroVisualRef.current;

    if (!visual || window.innerWidth <= 1024) {
      return;
    }

    const bounds = visual.getBoundingClientRect();

    const mouseX = event.clientX - bounds.left;
    const mouseY = event.clientY - bounds.top;

    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;

    const rotateY = ((mouseX - centerX) / centerX) * 2.4;
    const rotateX = -((mouseY - centerY) / centerY) * 1.8;

    const shiftX = ((mouseX - centerX) / centerX) * 5;
    const shiftY = ((mouseY - centerY) / centerY) * 5;

    visual.style.setProperty("--hero-rotate-x", `${rotateX}deg`);
    visual.style.setProperty("--hero-rotate-y", `${rotateY}deg`);
    visual.style.setProperty("--hero-shift-x", `${shiftX}px`);
    visual.style.setProperty("--hero-shift-y", `${shiftY}px`);
  };

  const handleHeroMouseLeave = () => {
    const visual = heroVisualRef.current;

    if (!visual) {
      return;
    }

    visual.style.setProperty("--hero-rotate-x", "0deg");
    visual.style.setProperty("--hero-rotate-y", "0deg");
    visual.style.setProperty("--hero-shift-x", "0px");
    visual.style.setProperty("--hero-shift-y", "0px");
  };

  return (
    <main className="about-page">
      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-hero-copy">
           

            <div className="about-title-mask">
              <h1 className="about-title">
                <span>Aller</span>
                <span>autrement.</span>
              </h1>
            </div>

            <p className="about-intro">
              Des séjours choisis pour sortir du cadre, ralentir et découvrir
              le Bénin autrement.
            </p>

            <Link
              to="/destinations"
              className="about-link about-discover-link"
            >
              <span>Découvrir nos destinations</span>
              <ArrowIcon className="about-link-icon" />
            </Link>
          </div>

          <div
            ref={heroVisualRef}
            className="about-hero-visual"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
          >
            <div className="about-3d-stage">
              <div className="about-image-frame">
                <img
                  className="about-hero-image"
                  src={resolveAssetUrl(
                    "/uploads/destinations/hero/hero.jpg",
                  )}
                  alt="Séjour d'exception sélectionné par STAY"
                />

                <div
                  className="about-image-depth"
                  aria-hidden="true"
                />

                <div
                  className="about-image-overlay"
                  aria-hidden="true"
                />
              </div>

              <div
                className="about-3d-shadow"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div
          className="about-hero-curve"
          aria-hidden="true"
        />
      </section>

      {/* VISION */}
      <section className="about-manifesto">
        <div
          className="about-manifesto-number"
          aria-hidden="true"
        >
          02
        </div>

        <div className="about-manifesto-content">
          <span className="about-section-label">
            Notre vision
          </span>

          <h2>
            Le voyage ne commence pas toujours{" "}
            <span>loin de chez soi.</span>
          </h2>

          <div className="about-manifesto-bottom">
            <p>
              STAY révèle des adresses singulières à travers le Bénin,
              choisies pour leur caractère, leur atmosphère et la manière
              dont elles transforment un simple séjour en véritable
              parenthèse.
            </p>

            <Link
              to="/destinations"
              className="about-link about-text-link"
            >
              <span>Explorer la collection</span>
              <ArrowIcon className="about-link-icon" />
            </Link>
          </div>
        </div>
      </section>

      {/* STAY SELECTION */}
      <section className="about-feature">
        <div className="about-feature-inner">
          <div className="about-feature-heading">
            <span className="about-section-label">
              La sélection STAY
            </span>
          </div>

          <Link
            to="/destinations"
            className="about-feature-card"
          >
            <div className="about-feature-image-wrap">
              <img
                src={resolveAssetUrl(
                  "/uploads/destinations/hero/card.jpg",
                )}
                alt="Découvrir les destinations sélectionnées par STAY"
                className="about-feature-image"
              />

              <div
                className="about-feature-overlay"
                aria-hidden="true"
              />
            </div>

            <div className="about-feature-content">
              <div>
                <span className="about-feature-kicker">
                  Une autre façon de partir
                </span>

                <h2>
                  Des lieux qui méritent le détour.
                </h2>
              </div>

              <div className="about-feature-copy">
                <p>
                  Une collection pensée pour celles et ceux qui recherchent
                  plus qu&apos;une chambre : une atmosphère, un rythme et une
                  expérience à retenir.
                </p>

                <span className="about-feature-action">
                  <span>Explorer</span>
                  <ArrowIcon className="about-link-icon" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="about-final">
        <span className="about-final-label">
          Votre prochaine parenthèse
        </span>

        <h2>
          Et si vous partiez
          <span>autrement ?</span>
        </h2>

        <Link
          to="/booking"
          className="about-link about-final-button"
        >
          <span>Réserver un séjour</span>
          <ArrowIcon className="about-link-icon" />
        </Link>

        <div className="about-final-footer">
          <span>STAY</span>
          <span>Bénin</span>
          <span>Hospitalité sélectionnée</span>
        </div>
      </section>
    </main>
  );
}

export default About;
