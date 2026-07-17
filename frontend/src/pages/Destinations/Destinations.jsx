import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDestinations } from "../../hooks/useDestinations";
import "./destinations.css";


function formatNightlyPrice(startingPriceFcfa) {
  return `${new Intl.NumberFormat("fr-FR").format(
    startingPriceFcfa,
  )} FCFA`;
}


function Destinations() {
  const { destinations, isLoading, error, reload } = useDestinations();


  const [activeCategory, setActiveCategory] = useState("Toutes");


  const categories = useMemo(() => {
    const uniqueCategories = destinations
      .map((destination) => destination.category)
      .filter(Boolean);


    return ["Toutes", ...new Set(uniqueCategories)];
  }, [destinations]);


  const filteredDestinations = useMemo(() => {
    if (activeCategory === "Toutes") {
      return destinations;
    }


    return destinations.filter(
      (destination) => destination.category === activeCategory,
    );
  }, [activeCategory, destinations]);


  const featuredDestination =
    filteredDestinations.find((destination) => destination.isFeatured) ||
    filteredDestinations[0];


  const remainingDestinations = featuredDestination
    ? filteredDestinations.filter(
        (destination) => destination.id !== featuredDestination.id,
      )
    : [];


  return (
    <main className="destinations-page">
      {/* =====================================================
          INTRO
      ====================================================== */}
      <section className="destinations-intro">
       <div className="destinations-intro-meta">
  <span>02 / DESTINATIONS</span>
</div>


        <div className="destinations-intro-content">
          <h1>
            Choisir
            <span>où rester.</span>
          </h1>


          <p>
            Une sélection d'adresses choisies pour leur atmosphère,
            leur caractère et leur façon singulière de faire découvrir
            le Bénin.
          </p>
        </div>
      </section>


      {/* =====================================================
          LOADING / ERROR
      ====================================================== */}
      {isLoading && (
        <section className="destinations-state">
          <span className="destinations-loader" aria-hidden="true"></span>
          <p>Chargement des destinations...</p>
        </section>
      )}


      {!isLoading && error && (
        <section className="destinations-state">
          <p>{error}</p>


          <button type="button" onClick={reload}>
            Réessayer
          </button>
        </section>
      )}


      {!isLoading && !error && destinations.length === 0 && (
        <section className="destinations-state">
          <p>Aucune destination n'est disponible pour le moment.</p>
        </section>
      )}


      {!isLoading && !error && destinations.length > 0 && (
        <>
          {/* =====================================================
              FILTERS
          ====================================================== */}
          <section className="destinations-filters">
            <div className="destinations-filter-label">
              <span>Explorer par ambiance</span>
            </div>


            <div className="destinations-filter-list">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category
                      ? "destination-filter is-active"
                      : "destination-filter"
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>


          {/* =====================================================
              FEATURED DESTINATION
          ====================================================== */}
          {featuredDestination && (
            <section className="destination-featured">
              <div className="destination-featured-media">
                <img
                  src={featuredDestination.image}
                  alt={featuredDestination.name}
                />


                <div className="destination-featured-overlay"></div>


                <div className="destination-featured-index">
                  <span>À la une</span>
                  <span>{featuredDestination.category}</span>
                </div>


                <Link
                  to={`/booking?destination=${featuredDestination.id}`}
                  className="destination-featured-action"
                >
                  <span>Réserver ce séjour</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>


              <div className="destination-featured-content">
                <div>
                  <span className="destination-featured-location">
                    {featuredDestination.location}
                  </span>


                  <h2>{featuredDestination.name}</h2>
                </div>


                <div className="destination-featured-copy">
                  <p>{featuredDestination.description}</p>


                  <span className="destination-featured-price">
                    À partir de{" "}
                    {formatNightlyPrice(
                      featuredDestination.startingPriceFcfa,
                    )}{" "}
                    / nuit
                  </span>
                </div>
              </div>
            </section>
          )}


          {/* =====================================================
              DESTINATION COLLECTION
          ====================================================== */}
          {remainingDestinations.length > 0 && (
            <section className="destinations-collection">
              <div className="destinations-collection-heading">
                <span>La collection</span>
                <span>
                  {String(remainingDestinations.length).padStart(2, "0")}
                </span>
              </div>


              <div className="destinations-grid">
                {remainingDestinations.map((destination, index) => (
                  <article
                    key={destination.id}
                    className="destination-gallery-card"
                  >
                    <Link
                      to={`/booking?destination=${destination.id}`}
                      className="destination-gallery-link"
                    >
                      <div className="destination-gallery-media">
                        <img
                          src={destination.image}
                          alt={destination.name}
                        />


                        <div className="destination-gallery-overlay"></div>


                        <span className="destination-gallery-number">
                          {String(index + 2).padStart(2, "0")}
                        </span>


                        <span className="destination-gallery-arrow">
                          ↗
                        </span>
                      </div>


                      <div className="destination-gallery-info">
                        <div>
                          <span className="destination-gallery-location">
                            {destination.location}
                          </span>


                          <h3>{destination.name}</h3>
                        </div>


                        <div className="destination-gallery-meta">
                          <span>{destination.category}</span>


                          <span>
                            Dès{" "}
                            {formatNightlyPrice(
                              destination.startingPriceFcfa,
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}


          {/* =====================================================
              FOOTNOTE
          ====================================================== */}
          <section className="destinations-note">
            <span>
              Les tarifs affichés sont indicatifs et peuvent varier
              selon les dates et disponibilités.
            </span>


            <Link to="/booking">
              Réserver un séjour
              <span aria-hidden="true">↗</span>
            </Link>
          </section>
        </>
      )}
    </main>
  );
}


export default Destinations;
