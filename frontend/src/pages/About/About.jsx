import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../../services/api";
import "./about.css";

function About() {
  return (
    <section className="about-page">
      <div className="about-split">
        <div className="about-left"></div>

        <div className="about-right">
          <img
            className="hero-image"
            src={resolveAssetUrl(
              "/uploads/destinations/hero/hero.jpg",
            )}
            alt="Séjour sélectionné par STAY"
          />
        </div>
      </div>

      <div className="about-center">
        <div className="titles">
          <h1 className="light-mode  masked-title">
            Des lieux où le temps ralentir et l’ailleurs commence.
          </h1>
          <h1 className="dark-mode  masked-title">
            Des lieux où le temps ralentir et l’ailleurs commence.
          </h1>
        </div>

        <div className="paragraph">
          <p className="light-mode  ">
            Une collection de séjours soigneusement sélectionnés autour de
            Cotonou et du sud du Bénin.
          </p>
          <p className="dark-mode ">
            Une collection de séjours soigneusement sélectionnés autour de
            Cotonou et du sud du Bénin.
          </p>
        </div>
      </div>

      <Link to="/destinations" className="explore-card">
  <div className="explore-card-media">
  <img
    src={resolveAssetUrl(
      "/uploads/destinations/hero/card.jpg",
    )}
    alt="Destination STAY"
    className="explore-card-image"
  />
</div>

  <div className="explore-card-content">
    <span className="explore-card-kicker">Explorer</span>
    <h3>Voir les destinations</h3>
    <p>Des lieux choisis pour ralentir, respirer et partir sans aller loin.</p>
  </div>

  <span className="explore-card-arrow">→</span>
</Link>
    </section>
  );
}

export default About;
