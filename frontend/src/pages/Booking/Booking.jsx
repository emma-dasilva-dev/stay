import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { bookingsApi } from "../../services/api";
import { useDestinations } from "../../hooks/useDestinations";
import "./Booking.css";


const CONTACT = {
  whatsappUrl: "https://wa.me/22940343012",
  callNumber: "+2290140343012",
};


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


function ChevronIcon({
  direction = "right",
  className = "",
}) {
  const isLeft = direction === "left";

  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          isLeft
            ? "M12.5 5L7.5 10L12.5 15"
            : "M7.5 5L12.5 10L7.5 15"
        }
      />
    </svg>
  );
}


function formatFcfa(amount) {
  return new Intl.NumberFormat(
    "fr-FR",
  ).format(amount || 0);
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(`${dateValue}T12:00:00`),
  );
}


function calculateNights(
  checkIn,
  checkOut,
) {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const arrival = new Date(
    `${checkIn}T00:00:00`,
  );

  const departure = new Date(
    `${checkOut}T00:00:00`,
  );

  const difference =
    departure.getTime() -
    arrival.getTime();

  return difference > 0
    ? Math.ceil(
        difference / 86400000,
      )
    : 0;
}


function formatGuestCount(count) {
  return `${count} voyageur${
    count > 1 ? "s" : ""
  }`;
}


function handleImageError(event) {
  const image =
    event.currentTarget;

  const container =
    image.parentElement;

  if (container) {
    container.classList.add(
      "is-image-missing",
    );
  }

  image.style.display = "none";
}


function Booking() {
  const [searchParams] =
    useSearchParams();

  const destinationScrollerRef =
    useRef(null);

  const detailsSectionRef =
    useRef(null);

  const {
    destinations,
    isLoading:
      isLoadingDestinations,
    error: destinationsError,
    reload:
      reloadDestinations,
  } = useDestinations();


  const destinationFromUrl =
    searchParams.get(
      "destination",
    );


  const [
    formData,
    setFormData,
  ] = useState({
    destinationId: "",
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    fullName: "",
    phone: "",
    email: "",
    specialRequest: "",
  });


  const [
    errors,
    setErrors,
  ] = useState({});


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  const [
    showDetails,
    setShowDetails,
  ] = useState(false);


  const [
    submissionMessage,
    setSubmissionMessage,
  ] = useState({
    type: "",
    text: "",
  });


  /*
  =========================================================
  INITIAL DESTINATION
  =========================================================
  */

  useEffect(() => {
    if (
      destinations.length ===
        0 ||
      formData.destinationId
    ) {
      return;
    }

    const matchesUrl =
      destinations.some(
        (destination) =>
          destination.id ===
          Number(
            destinationFromUrl,
          ),
      );

    setFormData(
      (currentData) => ({
        ...currentData,

        destinationId:
          matchesUrl
            ? String(
                destinationFromUrl,
              )
            : String(
                destinations[0].id,
              ),
      }),
    );
  }, [
    destinations,
    destinationFromUrl,
    formData.destinationId,
  ]);


  /*
  =========================================================
  DERIVED DATA
  =========================================================
  */

  const selectedDestination =
    useMemo(() => {
      return destinations.find(
        (destination) =>
          destination.id ===
          Number(
            formData.destinationId,
          ),
      );
    }, [
      destinations,
      formData.destinationId,
    ]);


  const numberOfNights =
    useMemo(() => {
      return calculateNights(
        formData.checkIn,
        formData.checkOut,
      );
    }, [
      formData.checkIn,
      formData.checkOut,
    ]);


  const estimatedTotal =
    selectedDestination
      ? numberOfNights > 0
        ? selectedDestination.startingPriceFcfa *
          numberOfNights
        : selectedDestination.startingPriceFcfa
      : 0;


  const totalGuests =
    Number(
      formData.adults,
    ) +
    Number(
      formData.children,
    );


  const today = new Date()
    .toISOString()
    .split("T")[0];


  /*
  =========================================================
  FORM HANDLERS
  =========================================================
  */

  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (currentData) => ({
        ...currentData,

        [name]:
          name === "adults" ||
          name === "children"
            ? Number(value)
            : value,
      }),
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,

        [name]: "",
        dates: "",
      }),
    );

    if (
      submissionMessage.text
    ) {
      setSubmissionMessage({
        type: "",
        text: "",
      });
    }
  };


  const handleDestinationSelect = (
    destinationId,
  ) => {
    setFormData(
      (currentData) => ({
        ...currentData,

        destinationId:
          String(
            destinationId,
          ),
      }),
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,

        destinationId: "",
      }),
    );

    if (
      submissionMessage.text
    ) {
      setSubmissionMessage({
        type: "",
        text: "",
      });
    }
  };


  /*
  =========================================================
  DESTINATION CAROUSEL
  =========================================================
  */

  const scrollDestinations = (
    direction,
  ) => {
    const scroller =
      destinationScrollerRef.current;

    if (!scroller) {
      return;
    }

    const scrollDistance =
      Math.max(
        scroller.clientWidth *
          0.72,
        320,
      );

    scroller.scrollBy({
      left:
        direction === "left"
          ? -scrollDistance
          : scrollDistance,

      behavior: "smooth",
    });
  };


  const handleDestinationWheel = (
    event,
  ) => {
    const scroller =
      destinationScrollerRef.current;

    if (!scroller) {
      return;
    }

    if (
      Math.abs(
        event.deltaY,
      ) >
      Math.abs(
        event.deltaX,
      )
    ) {
      event.preventDefault();

      scroller.scrollLeft +=
        event.deltaY;
    }
  };


  /*
  =========================================================
  VALIDATION
  =========================================================
  */

  const buildStayErrors = () => {
    const nextErrors = {};

    if (
      !formData.destinationId
    ) {
      nextErrors.destinationId =
        "Veuillez choisir une destination.";
    }

    if (!formData.checkIn) {
      nextErrors.checkIn =
        "Veuillez choisir une date d’arrivée.";
    }

    if (!formData.checkOut) {
      nextErrors.checkOut =
        "Veuillez choisir une date de départ.";
    }

    if (
      formData.checkIn &&
      formData.checkOut &&
      numberOfNights < 1
    ) {
      nextErrors.dates =
        "La date de départ doit être postérieure à la date d’arrivée.";
    }

    if (
      formData.adults < 1
    ) {
      nextErrors.adults =
        "Au moins un adulte est requis.";
    }

    return nextErrors;
  };


  const validateStayStep =
    () => {
      const nextErrors =
        buildStayErrors();

      setErrors(
        nextErrors,
      );

      return (
        Object.keys(
          nextErrors,
        ).length === 0
      );
    };


  const validateForm = () => {
    const nextErrors =
      buildStayErrors();

    if (
      !formData.fullName.trim()
    ) {
      nextErrors.fullName =
        "Veuillez renseigner votre nom.";
    }

    if (
      !formData.phone.trim()
    ) {
      nextErrors.phone =
        "Veuillez renseigner un numéro de téléphone.";
    }

    if (
      !formData.email.trim()
    ) {
      nextErrors.email =
        "Veuillez renseigner une adresse e-mail.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email,
      )
    ) {
      nextErrors.email =
        "Veuillez saisir une adresse e-mail valide.";
    }

    setErrors(
      nextErrors,
    );

    return (
      Object.keys(
        nextErrors,
      ).length === 0
    );
  };


  /*
  =========================================================
  CONTINUE TO CONTACT DETAILS
  =========================================================
  */

  const handleContinue = () => {
    if (
      !validateStayStep()
    ) {
      return;
    }

    setShowDetails(true);

    window.requestAnimationFrame(
      () => {
        detailsSectionRef.current?.scrollIntoView(
          {
            behavior: "smooth",
            block: "start",
          },
        );
      },
    );
  };


  /*
  =========================================================
  BOOKING API
  =========================================================
  */

  const saveBookingRequest =
    async (
      contactMethod,
    ) => {
      const data =
        await bookingsApi.create(
          {
            destinationId:
              Number(
                formData.destinationId,
              ),

            fullName:
              formData.fullName.trim(),

            email:
              formData.email.trim(),

            phone:
              formData.phone.trim(),

            checkIn:
              formData.checkIn,

            checkOut:
              formData.checkOut,

            adults:
              Number(
                formData.adults,
              ),

            children:
              Number(
                formData.children,
              ),

            specialRequest:
              formData.specialRequest.trim(),

            contactMethod,
          },
        );

      return data.booking;
    };


  /*
  =========================================================
  WHATSAPP MESSAGE
  =========================================================
  */

  const createWhatsAppMessage =
    (
      bookingReference,
    ) => {
      const specialRequest =
        formData.specialRequest.trim() ||
        "Aucune demande particulière";

      const childrenText =
        formData.children > 0
          ? `${
              formData.children
            } enfant${
              formData.children >
              1
                ? "s"
                : ""
            }`
          : "aucun enfant";

      return [
        "Bonjour STAY,",
        "",

        `Référence : ${bookingReference}`,
        "",

        `Je souhaite faire une demande de réservation pour ${selectedDestination.name}.`,
        "",

        `Destination : ${selectedDestination.name}`,

        `Lieu : ${selectedDestination.location}`,

        `Arrivée : ${formatDate(
          formData.checkIn,
        )}`,

        `Départ : ${formatDate(
          formData.checkOut,
        )}`,

        `Durée : ${numberOfNights} nuitée${
          numberOfNights > 1
            ? "s"
            : ""
        }`,

        `Voyageurs : ${formData.adults} adulte${
          formData.adults > 1
            ? "s"
            : ""
        }, ${childrenText}`,

        `Nom : ${formData.fullName.trim()}`,

        `Téléphone : ${formData.phone.trim()}`,

        `Adresse e-mail : ${formData.email.trim()}`,

        `Demande particulière : ${specialRequest}`,

        "",

        "Pouvez-vous me confirmer la disponibilité et le tarif final ?",
      ].join("\n");
    };


  const handleWhatsApp =
    async () => {
      if (
        !validateForm() ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(true);

      setSubmissionMessage({
        type: "",
        text: "",
      });

      try {
        const booking =
          await saveBookingRequest(
            "whatsapp",
          );

        const message =
          encodeURIComponent(
            createWhatsAppMessage(
              booking.reference,
            ),
          );

        setSubmissionMessage({
          type: "success",

          text:
            `Demande ${booking.reference} enregistrée.`,
        });

        window.open(
          `${CONTACT.whatsappUrl}?text=${message}`,
          "_blank",
          "noopener,noreferrer",
        );
      } catch (error) {
        setSubmissionMessage({
          type: "error",

          text:
            error.message ||
            "Impossible d’enregistrer votre demande.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };


  /*
  =========================================================
  PAGE STATES
  =========================================================
  */

  if (
    isLoadingDestinations
  ) {
    return (
      <main className="booking-page booking-page-state">
        <div className="booking-state">
          <span
            className="booking-state-loader"
            aria-hidden="true"
          />

          <p>
            Chargement des
            destinations...
          </p>
        </div>
      </main>
    );
  }


  if (
    destinationsError
  ) {
    return (
      <main className="booking-page booking-page-state">
        <div className="booking-state">
          <p>
            {destinationsError}
          </p>

          <button
            type="button"
            onClick={
              reloadDestinations
            }
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }


  if (
    !selectedDestination
  ) {
    return (
      <main className="booking-page booking-page-state">
        <div className="booking-state">
          <p>
            Aucune destination
            n’est disponible pour
            le moment.
          </p>
        </div>
      </main>
    );
  }


  /*
  =========================================================
  PAGE
  =========================================================
  */

  return (
    <main className="booking-page">

      {/* ===================================================
          HERO
      ==================================================== */}

      <section className="booking-hero">
        <div
          key={
            selectedDestination.id
          }
          className="booking-hero-media"
        >
          <img
            src={
              selectedDestination.image
            }
            alt={
              selectedDestination.name
            }
            onError={
              handleImageError
            }
          />

          <div
            className="booking-hero-overlay"
            aria-hidden="true"
          />

        

          <div className="booking-hero-copy">
            <span className="booking-hero-location">
              {
                selectedDestination.location
              }
            </span>

            <h1>
              {
                selectedDestination.name
              }
            </h1>

            <p>
              Dès{" "}
              {formatFcfa(
                selectedDestination.startingPriceFcfa,
              )}{" "}
              FCFA / nuit
            </p>
          </div>
        </div>


        {/* ===============================================
            FLOATING SEARCH BAR
        ================================================ */}

        <div className="booking-search-panel">
          <form
            className="booking-search-form"
            onSubmit={(event) => {
              event.preventDefault();

              handleContinue();
            }}
            noValidate
          >

            {/* DESTINATION */}

            <div className="booking-search-segment booking-search-segment--destination">
              <label
                htmlFor="bookingDestination"
              >
                Destination
              </label>

              <select
                id="bookingDestination"
                name="destinationId"
                value={
                  formData.destinationId
                }
                onChange={
                  handleChange
                }
              >
                {destinations.map(
                  (
                    destination,
                  ) => (
                    <option
                      key={
                        destination.id
                      }
                      value={
                        destination.id
                      }
                    >
                      {
                        destination.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>


            {/* ARRIVAL */}

            <div className="booking-search-segment">
              <label
                htmlFor="checkIn"
              >
                Arrivée
              </label>

              <input
                id="checkIn"
                name="checkIn"
                type="date"
                min={today}
                value={
                  formData.checkIn
                }
                onChange={
                  handleChange
                }
              />
            </div>


            {/* DEPARTURE */}

            <div className="booking-search-segment">
              <label
                htmlFor="checkOut"
              >
                Départ
              </label>

              <input
                id="checkOut"
                name="checkOut"
                type="date"
                min={
                  formData.checkIn ||
                  today
                }
                value={
                  formData.checkOut
                }
                onChange={
                  handleChange
                }
              />
            </div>


            {/* GUESTS */}

            <details className="booking-guests-picker">
              <summary>
                <span>
                  Voyageurs
                </span>

                <strong>
                  {formatGuestCount(
                    totalGuests,
                  )}
                </strong>
              </summary>

              <div className="booking-guests-dropdown">

                <label
                  className="booking-guest-row"
                  htmlFor="adults"
                >
                  <span>
                    <strong>
                      Adultes
                    </strong>

                    <small>
                      18 ans et plus
                    </small>
                  </span>

                  <select
                    id="adults"
                    name="adults"
                    value={
                      formData.adults
                    }
                    onChange={
                      handleChange
                    }
                  >
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                      6,
                      7,
                      8,
                    ].map(
                      (
                        number,
                      ) => (
                        <option
                          key={
                            number
                          }
                          value={
                            number
                          }
                        >
                          {
                            number
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>


                <label
                  className="booking-guest-row"
                  htmlFor="children"
                >
                  <span>
                    <strong>
                      Enfants
                    </strong>

                    <small>
                      Moins de 18 ans
                    </small>
                  </span>

                  <select
                    id="children"
                    name="children"
                    value={
                      formData.children
                    }
                    onChange={
                      handleChange
                    }
                  >
                    {[
                      0,
                      1,
                      2,
                      3,
                      4,
                      5,
                      6,
                    ].map(
                      (
                        number,
                      ) => (
                        <option
                          key={
                            number
                          }
                          value={
                            number
                          }
                        >
                          {
                            number
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

              </div>
            </details>


            {/* CONTINUE */}

            <div className="booking-search-action-wrap">
              <button
                type="submit"
                className="booking-search-action"
                aria-label="Continuer la réservation"
              >
                <span className="booking-search-action-label">
                  Continuer
                </span>

                <ArrowIcon className="booking-search-arrow" />
              </button>
            </div>

          </form>


          {(errors.destinationId ||
            errors.checkIn ||
            errors.checkOut ||
            errors.dates ||
            errors.adults) && (
            <div
              className="booking-search-errors"
              role="alert"
            >
              {errors.destinationId && (
                <span>
                  {
                    errors.destinationId
                  }
                </span>
              )}

              {errors.checkIn && (
                <span>
                  {
                    errors.checkIn
                  }
                </span>
              )}

              {errors.checkOut && (
                <span>
                  {
                    errors.checkOut
                  }
                </span>
              )}

              {errors.dates && (
                <span>
                  {
                    errors.dates
                  }
                </span>
              )}

              {errors.adults && (
                <span>
                  {
                    errors.adults
                  }
                </span>
              )}
            </div>
          )}
        </div>
      </section>


      {/* ===================================================
          DESTINATIONS
      ==================================================== */}

      <section className="booking-stays">
        <header className="booking-stays-header">
          <div>
            <span className="booking-section-label">
              Collection STAY
            </span>

            <h2>
              Séjours disponibles
            </h2>
          </div>

          <div className="booking-carousel-controls">
            <button
              type="button"
              aria-label="Voir les destinations précédentes"
              onClick={() =>
                scrollDestinations(
                  "left",
                )
              }
            >
              <ChevronIcon direction="left" />
            </button>

            <button
              type="button"
              aria-label="Voir les destinations suivantes"
              onClick={() =>
                scrollDestinations(
                  "right",
                )
              }
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        </header>


        <div
          ref={
            destinationScrollerRef
          }
          className="booking-stays-scroller"
          onWheel={
            handleDestinationWheel
          }
        >
          {destinations.map(
            (
              destination,
            ) => {
              const isSelected =
                Number(
                  formData.destinationId,
                ) ===
                destination.id;

              return (
                <button
                  key={
                    destination.id
                  }
                  type="button"
                  className={
                    isSelected
                      ? "booking-stay-card is-selected"
                      : "booking-stay-card"
                  }
                  aria-pressed={
                    isSelected
                  }
                  onClick={() =>
                    handleDestinationSelect(
                      destination.id,
                    )
                  }
                >
                  <span className="booking-stay-image">
                    <img
                      src={
                        destination.image
                      }
                      alt=""
                      loading="lazy"
                      onError={
                        handleImageError
                      }
                    />

                    <span
                      className="booking-stay-image-overlay"
                      aria-hidden="true"
                    />

                    {isSelected && (
                      <span className="booking-stay-selected">
                        Sélectionné
                      </span>
                    )}
                  </span>


                  <span className="booking-stay-content">
                    <span className="booking-stay-location">
                      {
                        destination.location
                      }
                    </span>

                    <strong>
                      {
                        destination.name
                      }
                    </strong>

                    <span className="booking-stay-bottom">
                      <small>
                        À partir de
                      </small>

                      <span>
                        {formatFcfa(
                          destination.startingPriceFcfa,
                        )}{" "}
                        FCFA
                      </span>
                    </span>
                  </span>
                </button>
              );
            },
          )}
        </div>
      </section>


      {/* ===================================================
          CONTACT DETAILS
      ==================================================== */}

      {showDetails && (
        <section
          ref={
            detailsSectionRef
          }
          className="booking-details"
        >
          <div className="booking-details-inner">

            {/* SUMMARY */}

            <aside className="booking-request-summary">
              <div className="booking-summary-top">
                <span className="booking-section-label booking-section-label--light">
                  Votre demande
                </span>

                <h2>
                  {
                    selectedDestination.name
                  }
                </h2>

                <p>
                  {
                    selectedDestination.location
                  }
                </p>
              </div>


              <div className="booking-summary-list">

                <div className="booking-summary-row">
                  <span>
                    Arrivée
                  </span>

                  <strong>
                    {formatDate(
                      formData.checkIn,
                    )}
                  </strong>
                </div>


                <div className="booking-summary-row">
                  <span>
                    Départ
                  </span>

                  <strong>
                    {formatDate(
                      formData.checkOut,
                    )}
                  </strong>
                </div>


                <div className="booking-summary-row">
                  <span>
                    Durée
                  </span>

                  <strong>
                    {numberOfNights}{" "}
                    nuit
                    {numberOfNights >
                    1
                      ? "s"
                      : ""}
                  </strong>
                </div>


                <div className="booking-summary-row">
                  <span>
                    Voyageurs
                  </span>

                  <strong>
                    {
                      totalGuests
                    }
                  </strong>
                </div>

              </div>


              <div className="booking-summary-total">
                <span>
                  Estimation
                </span>

                <strong>
                  {numberOfNights > 0
                    ? `${formatFcfa(
                        estimatedTotal,
                      )} FCFA`
                    : `Dès ${formatFcfa(
                        selectedDestination.startingPriceFcfa,
                      )} FCFA`}
                </strong>

                <small>
                  Tarif indicatif
                </small>
              </div>
            </aside>


            {/* CONTACT FORM */}

            <div className="booking-contact-area">
              <header className="booking-contact-header">
                <span className="booking-section-label">
                  Coordonnées
                </span>

                <h2>
                  Finaliser votre demande.
                </h2>
              </header>


              <form
                className="booking-contact-form"
                onSubmit={(event) => {
                  event.preventDefault();

                  handleWhatsApp();
                }}
                noValidate
              >

                <div className="booking-contact-grid">

                  {/* NAME */}

                  <div className="booking-contact-field booking-contact-field--wide">
                    <label
                      htmlFor="fullName"
                    >
                      Nom complet
                    </label>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Votre nom complet"
                      value={
                        formData.fullName
                      }
                      onChange={
                        handleChange
                      }
                    />

                    {errors.fullName && (
                      <span className="booking-field-error">
                        {
                          errors.fullName
                        }
                      </span>
                    )}
                  </div>


                  {/* PHONE */}

                  <div className="booking-contact-field">
                    <label
                      htmlFor="phone"
                    >
                      Téléphone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+229..."
                      value={
                        formData.phone
                      }
                      onChange={
                        handleChange
                      }
                    />

                    {errors.phone && (
                      <span className="booking-field-error">
                        {
                          errors.phone
                        }
                      </span>
                    )}
                  </div>


                  {/* EMAIL */}

                  <div className="booking-contact-field">
                    <label
                      htmlFor="email"
                    >
                      E-mail
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nom@exemple.com"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                    />

                    {errors.email && (
                      <span className="booking-field-error">
                        {
                          errors.email
                        }
                      </span>
                    )}
                  </div>


                  {/* REQUEST */}

                  <div className="booking-contact-field booking-contact-field--wide">
                    <label
                      htmlFor="specialRequest"
                    >
                      Demande particulière
                      <span>
                        {" "}
                        · facultatif
                      </span>
                    </label>

                    <textarea
                      id="specialRequest"
                      name="specialRequest"
                      rows="3"
                      placeholder="Transport, arrivée tardive, préférence particulière..."
                      value={
                        formData.specialRequest
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                </div>


                <div className="booking-contact-actions">
                  <button
                    type="submit"
                    className="booking-primary-action"
                    disabled={
                      isSubmitting
                    }
                  >
                    <span>
                      {isSubmitting
                        ? "Enregistrement..."
                        : "Continuer sur WhatsApp"}
                    </span>

                    <ArrowIcon className="booking-action-icon" />
                  </button>

                  <a
                    className="booking-call-action"
                    href={`tel:${CONTACT.callNumber}`}
                  >
                    Appeler STAY
                  </a>
                </div>


                <p className="booking-disclaimer">
                  Tarif indicatif. STAY confirme la disponibilité et le montant final avant toute réservation définitive.
                </p>


                {submissionMessage.text && (
                  <p
                    className={`booking-submit-message ${submissionMessage.type}`}
                    role="status"
                  >
                    {
                      submissionMessage.text
                    }
                  </p>
                )}

              </form>
            </div>

          </div>
        </section>
      )}

    </main>
  );
}


export default Booking; 