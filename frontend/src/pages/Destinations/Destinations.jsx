import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDestinations } from "../../hooks/useDestinations";
import "./destinations.css";

const CATEGORY_ORDER = [
  "Escapade urbaine",
  "Bord de mer",
  "Nature & calme",
];

const DESTINATION_ORDER = [
  "sofitel",
  "casa-del-papa",
  "nyumba-lodge-grand-popo",
  "golden-tulip-le-diplomate",
  "natura-luxury-lodge",
  "village-helene",
  "awale-plage",
  "novotel",
  "auberge-grand-popo",
  "queens-hotel",
];

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

function formatNightlyPrice(startingPriceFcfa) {
  const price = Number(startingPriceFcfa);

  if (!Number.isFinite(price)) {
    return "Tarif sur demande";
  }

  return `${new Intl.NumberFormat("fr-FR").format(price)} FCFA`;
}

function formatAddressCount(count) {
  const value = String(count).padStart(2, "0");

  return `${value} ${count === 1 ? "ADRESSE" : "ADRESSES"}`;
}

function getDestinationRank(destination) {
  const index = DESTINATION_ORDER.indexOf(destination.slug);

  return index === -1
    ? Number.MAX_SAFE_INTEGER
    : index;
}

function handleImageError(event) {
  const image = event.currentTarget;
  const imageContainer = image.parentElement;

  if (imageContainer) {
    imageContainer.classList.add("is-image-missing");
  }

  image.style.display = "none";
}

function Destinations() {
  const {
    destinations,
    isLoading,
    error,
    reload,
  } = useDestinations();

  const [activeCategory, setActiveCategory] = useState("Toutes");

  const orderedDestinations = useMemo(() => {
    return [...destinations].sort(
      (firstDestination, secondDestination) =>
        getDestinationRank(firstDestination) -
        getDestinationRank(secondDestination),
    );
  }, [destinations]);

  const categories = useMemo(() => {
    const availableCategories = new Set(
      orderedDestinations
        .map((destination) => destination.category)
        .filter(Boolean),
    );

    const knownCategories = CATEGORY_ORDER.filter((category) =>
      availableCategories.has(category),
    );

    const additionalCategories = [...availableCategories]
      .filter((category) => !CATEGORY_ORDER.includes(category))
      .sort((firstCategory, secondCategory) =>
        firstCategory.localeCompare(secondCategory, "fr"),
      );

    return [
      "Toutes",
      ...knownCategories,
      ...additionalCategories,
    ];
  }, [orderedDestinations]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("Toutes");
    }
  }, [activeCategory, categories]);

  const filteredDestinations = useMemo(() => {
    if (activeCategory === "Toutes") {
      return orderedDestinations;
    }

    return orderedDestinations.filter(
      (destination) =>
        destination.category === activeCategory,
    );
  }, [activeCategory, orderedDestinations]);

  const featuredDestination =
    orderedDestinations.find(
      (destination) =>
        destination.isFeatured === true ||
        destination.isFeatured === 1,
    ) ||
    orderedDestinations[0] ||
    null;

  return (
    <main className="destinations-page">
      {/* INTRO */}
      <section className="destinations-intro">
        <span className="destinations-intro-meta">
          02 / DESTINATIONS
        </span>

        <div className="destinations-intro-content">
          <h1>
            <span>Choisir</span>
            <span>où rester.</span>
          </h1>

          <p>
            Une sélection d&apos;adresses choisies pour leur atmosphère,
            leur caractère et leur façon singulière de faire découvrir
            le Bénin.
          </p>
        </div>
      </section>

      {/* LOADING */}
      {isLoading && (
        <section className="destinations-state">
          <span
            className="destinations-loader"
            aria-hidden="true"
          />

          <p>Chargement des destinations...</p>
        </section>
      )}

      {/* ERROR */}
      {!isLoading && error && (
        <section className="destinations-state">
          <p>{error}</p>

          <button
            type="button"
            onClick={reload}
          >
            Réessayer
          </button>
        </section>
      )}

      {/* EMPTY */}
      {!isLoading &&
        !error &&
        orderedDestinations.length === 0 && (
          <section className="destinations-state">
            <p>
              Aucune destination n&apos;est disponible pour le moment.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        orderedDestinations.length > 0 && (
          <>
            {/* FILTERS */}
            <section className="destinations-filters">
              <span className="destinations-filter-label">
                Filtrer la collection
              </span>

              <div
                className="destinations-filter-list"
                role="group"
                aria-label="Filtrer les destinations"
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={
                      activeCategory === category
                        ? "destination-filter is-active"
                        : "destination-filter"
                    }
                    aria-pressed={
                      activeCategory === category
                    }
                    onClick={() =>
                      setActiveCategory(category)
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* FEATURED */}
            {featuredDestination && (
              <section className="destination-featured">
                <div className="destination-featured-inner">
                  <div className="destination-featured-media">
                    <img
                      src={featuredDestination.image}
                      alt={featuredDestination.name}
                      onError={handleImageError}
                    />

                    <div
                      className="destination-featured-overlay"
                      aria-hidden="true"
                    />

                    <div className="destination-featured-badge">
                      <span>À la une</span>

                      <span>
                        {featuredDestination.category ||
                          "Sélection STAY"}
                      </span>
                    </div>
                  </div>

                  <div className="destination-featured-content">
                    <div>
                      <span className="destination-featured-location">
                        {featuredDestination.location}
                      </span>

                      <h2>
                        {featuredDestination.name}
                      </h2>
                    </div>

                    <div className="destination-featured-bottom">
                      {featuredDestination.description && (
                        <p>
                          {featuredDestination.description}
                        </p>
                      )}

                      <div className="destination-featured-price">
                        <span>À partir de</span>

                        <strong>
                          {formatNightlyPrice(
                            featuredDestination.startingPriceFcfa,
                          )}
                        </strong>

                        <span>par nuit</span>
                      </div>

                      <Link
                        to={`/booking?destination=${featuredDestination.id}`}
                        className="destination-featured-link"
                      >
                        <span>Réserver ce séjour</span>

                        <ArrowIcon className="destination-arrow-icon" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* COLLECTION */}
            <section className="destinations-collection">
              <div className="destinations-collection-heading">
                <span>La collection</span>

                <span>
                  {formatAddressCount(
                    filteredDestinations.length,
                  )}
                </span>
              </div>

              {filteredDestinations.length > 0 ? (
                <div className="destinations-list">
                  {filteredDestinations.map(
                    (destination) => (
                      <article
                        key={destination.id}
                        className="destination-row"
                      >
                        <Link
                          to={`/booking?destination=${destination.id}`}
                          className="destination-row-link"
                        >
                          <div className="destination-row-media">
                            <img
                              src={destination.image}
                              alt={destination.name}
                              loading="lazy"
                              onError={handleImageError}
                            />
                          </div>

                          <div className="destination-row-main">
                            <span className="destination-row-location">
                              {destination.location}
                            </span>

                            <h3>
                              {destination.name}
                            </h3>

                            <div className="destination-row-tags">
                              <span>
                                {destination.category ||
                                  "Sélection STAY"}
                              </span>

                              <span>
                                Collection STAY
                              </span>
                            </div>
                          </div>

                          <div className="destination-row-price">
                            <span>À partir de</span>

                            <strong>
                              {formatNightlyPrice(
                                destination.startingPriceFcfa,
                              )}
                            </strong>

                            <span>par nuit</span>
                          </div>

                          <div className="destination-row-action">
                            <ArrowIcon className="destination-arrow-icon" />
                          </div>
                        </Link>
                      </article>
                    ),
                  )}
                </div>
              ) : (
                <div className="destinations-filter-empty">
                  <p>
                    Aucune adresse ne correspond à cette sélection.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveCategory("Toutes")
                    }
                  >
                    Voir toutes les destinations
                  </button>
                </div>
              )}
            </section>

            {/* NOTE */}
            <section className="destinations-note">
              <p>
                Les tarifs affichés sont indicatifs et peuvent varier
                selon les dates et les disponibilités.
              </p>

              <Link
                to="/booking"
                className="destinations-note-link"
              >
                <span>Réserver un séjour</span>

                <ArrowIcon className="destination-arrow-icon" />
              </Link>
            </section>
          </>
        )}
    </main>
  );
}

export default Destinations;
