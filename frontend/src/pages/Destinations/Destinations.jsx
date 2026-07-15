import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./destinations.css";


const destinations = [
  {
    id: 1,
    name: "Casa del Papa Resort",
    location: "Ouidah",
    nightlyPrice: "65 000 FCFA",
    description:
      "Un refuge paisible entre l’océan et la lagune, pensé pour ralentir et se retrouver.",
    image:
      "http://192.168.1.129:5000/uploads/destinations/casa-del-papa/main.jpg",
  },
  {
    id: 2,
    name: "Le Village d’Hélène",
    location: "Lac Toho",
    nightlyPrice: "55 000 FCFA",
    description:
      "Une adresse calme au bord du lac, entourée de nature et propice à la déconnexion.",
    image:
      "http://192.168.1.129:5000/uploads/destinations/village-helene/main.jpg",
  },
  {
    id: 3,
    name: "Sofitel Cotonou Marina",
    location: "Cotonou",
    nightlyPrice: "155 000 FCFA",
    description:
      "Une expérience contemporaine entre confort haut de gamme, spa et proximité de l’océan.",
    image:
      "http://192.168.1.129:5000/uploads/destinations/sofitel/main.jpg",
  },
  {
    id: 4,
    name: "Novotel Cotonou Orisha",
    location: "Cotonou",
    nightlyPrice: "93 000 FCFA",
    description:
      "Un séjour moderne et accessible, idéal pour découvrir Cotonou en toute simplicité.",
    image:
      "http://192.168.1.129:5000/uploads/destinations/novotel/main.jpg",
  },
];


function Destinations() {
  const [activeDestinationId, setActiveDestinationId] =
    useState(null);


  const [activeSlideIndex, setActiveSlideIndex] = useState(0);


  const carouselRef = useRef(null);

  const selectedDesktopDestination =
  destinations.find(
    (destination) =>
      destination.id === activeDestinationId,
  ) ?? destinations[0];



  const toggleDestination = (destinationId) => {
    setActiveDestinationId((currentId) =>
      currentId === destinationId ? null : destinationId,
    );
  };


  const handleCarouselScroll = () => {
    const carousel = carouselRef.current;


    if (!carousel) {
      return;
    }


    const firstCard = carousel.querySelector(
      ".destination-card",
    );


    if (!firstCard) {
      return;
    }


    const cardWidth = firstCard.offsetWidth;


    const carouselStyles =
      window.getComputedStyle(carousel);


    const gap =
      parseFloat(carouselStyles.columnGap) ||
      parseFloat(carouselStyles.gap) ||
      0;


    const newIndex = Math.round(
      carousel.scrollLeft / (cardWidth + gap),
    );


    const safeIndex = Math.max(
      0,
      Math.min(newIndex, destinations.length - 1),
    );


    setActiveSlideIndex(safeIndex);
  };

  return (
    <section className="destinations-page">
      <header className="destinations-header">
        <h1>
          <span className="type-line" aria-hidden="true">
            |
          </span>
          Découvrez votre séjour
        </h1>


        <p className="destinations-subtitle">
          Survolez une image ou touchez-la pour en savoir plus.
        </p>
      </header>
      <div className="destinations-desktop-layout">
  <div className="desktop-destination-list">
    {destinations.map((destination) => {
      const isSelected =
        selectedDesktopDestination.id ===
        destination.id;


      return (
        <button
          key={destination.id}
          type="button"
          className={`desktop-destination-item ${
            isSelected ? "is-active" : ""
          }`}
          onMouseEnter={() =>
            setActiveDestinationId(destination.id)
          }
          onFocus={() =>
            setActiveDestinationId(destination.id)
          }
          onClick={() =>
            setActiveDestinationId(destination.id)
          }
        >
          <span className="desktop-destination-name">
            {destination.name}
          </span>


          <span className="desktop-destination-location">
            {destination.location}
          </span>
        </button>
      );
    })}
  </div>


  <article className="desktop-destination-feature">
    <div className="desktop-destination-image">
      <img
        src={selectedDesktopDestination.image}
        alt={selectedDesktopDestination.name}
      />


      <div className="desktop-destination-overlay">
        <p>
          {selectedDesktopDestination.description}
        </p>
      </div>
    </div>


    <div className="desktop-destination-details">
      <div>
        <h2>
          {selectedDesktopDestination.name}
        </h2>


        <p>
          {selectedDesktopDestination.location}
        </p>
      </div>


      <div className="desktop-destination-meta">
        <span>
          À partir de{" "}
          {selectedDesktopDestination.nightlyPrice}
          {" "} / nuit
        </span>


        <Link
          to={`/booking?destination=${selectedDesktopDestination.id}`}
          className="desktop-destination-book"
        >
          Réserver ce séjour
        </Link>
      </div>
    </div>
  </article>
</div>


      <div
  className="destinations-content destinations-carousel"
  ref={carouselRef}
  onScroll={handleCarouselScroll}
> 
        {destinations.map((destination) => {
          const isActive =
            activeDestinationId === destination.id;


          return (
            <article
              key={destination.id}
              className={`destination-card ${
                isActive ? "is-active" : ""
              }`}
            >
              <div
                className="destination-image-wrap"
                role="button"
                tabIndex={0}
                aria-expanded={isActive}
                aria-label={`Afficher les informations sur ${destination.name}`}
                onClick={() =>
                  toggleDestination(destination.id)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    toggleDestination(destination.id);
                  }
                }}
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                />


                <div className="destination-overlay">
                  <p>{destination.description}</p>


                  <Link
                    to={`/booking?destination=${destination.id}`}
                    className="overlay-book-link"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    Réserver ce séjour
                  </Link>
                </div>
              </div>


              <div className="destination-card-info">
                <div className="destination-card-heading">
                  <div>
                    <h2>{destination.name}</h2>
                  </div>


                  <span className="destination-location">
                    {destination.location}
                  </span>
                </div>


                <p className="destination-price">
                  À partir de {destination.nightlyPrice} / nuit
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <p className="price-note">
        * Les tarifs affichés sont donnés à titre indicatif.
      </p>
    </section>
  );
}


export default Destinations;
