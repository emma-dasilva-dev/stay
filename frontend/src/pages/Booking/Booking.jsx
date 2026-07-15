import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Booking.css";


const CONTACT = {
  whatsappUrl: "https://wa.me/22940343012",
  callNumber: "+2290140343012",
};


const destinations = [
  {
    id: 1,
    name: "Casa del Papa Resort & Spa",
    location: "Ouidah",
    startingPrice: 65000,
    image:
      "http://192.168.1.129:5000/uploads/destinations/casa-del-papa/main.jpg",
  },
  {
    id: 2,
    name: "Le Village d’Hélène",
    location: "Lac Toho",
    startingPrice: 55000,
    image:
      "http://192.168.1.129:5000/uploads/destinations/village-helene/main.jpg",
  },
  {
    id: 3,
    name: "Sofitel Cotonou Marina",
    location: "Cotonou",
    startingPrice: 155000,
    image:
      "http://192.168.1.129:5000/uploads/destinations/sofitel/main.jpg",
  },
  {
    id: 4,
    name: "Novotel Cotonou Orisha",
    location: "Cotonou",
    startingPrice: 93000,
    image:
      "http://192.168.1.129:5000/uploads/destinations/novotel/main.jpg",
  },
];


function formatFcfa(amount) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }


  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}


function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return 0;
  }


  const arrival = new Date(`${checkIn}T00:00:00`);
  const departure = new Date(`${checkOut}T00:00:00`);


  const difference =
    departure.getTime() - arrival.getTime();


  return difference > 0
    ? Math.ceil(difference / 86400000)
    : 0;
}


function Booking() {
  const [searchParams] = useSearchParams();


  const destinationFromUrl =
    searchParams.get("destination");


  const initialDestinationId = destinations.some(
    (destination) =>
      destination.id === Number(destinationFromUrl),
  )
    ? destinationFromUrl
    : "1";


  const [formData, setFormData] = useState({
    destinationId: initialDestinationId,
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    fullName: "",
    phone: "",
    email: "",
    specialRequest: "",
  });


  const [errors, setErrors] = useState({});


  const [isSubmitting, setIsSubmitting] =
    useState(false);


  const [submissionMessage, setSubmissionMessage] =
    useState({
      type: "",
      text: "",
    });


  const selectedDestination = useMemo(() => {
    return (
      destinations.find(
        (destination) =>
          destination.id ===
          Number(formData.destinationId),
      ) ?? destinations[0]
    );
  }, [formData.destinationId]);


  const numberOfNights = useMemo(() => {
    return calculateNights(
      formData.checkIn,
      formData.checkOut,
    );
  }, [formData.checkIn, formData.checkOut]);


  const estimatedTotal =
    numberOfNights > 0
      ? selectedDestination.startingPrice *
        numberOfNights
      : selectedDestination.startingPrice;


  const today = new Date()
    .toISOString()
    .split("T")[0];


  const handleChange = (event) => {
    const { name, value } = event.target;


    setFormData((currentData) => ({
      ...currentData,
      [name]:
        name === "adults" || name === "children"
          ? Number(value)
          : value,
    }));


    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      dates: "",
    }));


    if (submissionMessage.text) {
      setSubmissionMessage({
        type: "",
        text: "",
      });
    }
  };


  const handleDestinationSelect = (destinationId) => {
    setFormData((currentData) => ({
      ...currentData,
      destinationId: String(destinationId),
    }));


    setErrors((currentErrors) => ({
      ...currentErrors,
      destinationId: "",
    }));


    if (submissionMessage.text) {
      setSubmissionMessage({
        type: "",
        text: "",
      });
    }
  };


  const validateForm = () => {
    const nextErrors = {};


    if (!formData.destinationId) {
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


    if (formData.adults < 1) {
      nextErrors.adults =
        "Au moins un adulte est requis.";
    }


    if (!formData.fullName.trim()) {
      nextErrors.fullName =
        "Veuillez renseigner le nom du réservant.";
    }


    if (!formData.phone.trim()) {
      nextErrors.phone =
        "Veuillez renseigner un numéro de téléphone.";
    }


    if (!formData.email.trim()) {
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


    setErrors(nextErrors);


    return Object.keys(nextErrors).length === 0;
  };


  const saveBookingRequest = async (
    contactMethod,
  ) => {
    const token = localStorage.getItem(
      "stay_access_token",
    );


    const response = await fetch(
      "http://localhost:5000/api/bookings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          destinationId: Number(
            formData.destinationId,
          ),
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          adults: Number(formData.adults),
          children: Number(formData.children),
          specialRequest:
            formData.specialRequest.trim(),
          contactMethod,
        }),
      },
    );


    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.message ||
          "Impossible d’enregistrer votre demande.",
      );
    }


    return data.booking;
  };


  const createWhatsAppMessage = (
    bookingReference,
  ) => {
    const specialRequest =
      formData.specialRequest.trim() ||
      "Aucune demande particulière";


    const childrenText =
      formData.children > 0
        ? `${formData.children} enfant${
            formData.children > 1 ? "s" : ""
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
      `Arrivée : ${formatDate(formData.checkIn)}`,
      `Départ : ${formatDate(formData.checkOut)}`,
      `Durée : ${numberOfNights} nuitée${
        numberOfNights > 1 ? "s" : ""
      }`,
      `Voyageurs : ${formData.adults} adulte${
        formData.adults > 1 ? "s" : ""
      }, ${childrenText}`,
      `Nom : ${formData.fullName.trim()}`,
      `Téléphone : ${formData.phone.trim()}`,
      `Adresse e-mail : ${formData.email.trim()}`,
      `Demande particulière : ${specialRequest}`,
      "",
      "Pouvez-vous me confirmer la disponibilité et le tarif final ?",
    ].join("\n");
  };


  const handleWhatsApp = async () => {
    if (!validateForm() || isSubmitting) {
      return;
    }


    setIsSubmitting(true);


    setSubmissionMessage({
      type: "",
      text: "",
    });


    try {
      const booking =
        await saveBookingRequest("whatsapp");


      const message = encodeURIComponent(
        createWhatsAppMessage(
          booking.reference,
        ),
      );


      setSubmissionMessage({
        type: "success",
        text: `Demande ${booking.reference} enregistrée.`,
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


  const handleCall = async () => {
    if (!validateForm() || isSubmitting) {
      return;
    }


    setIsSubmitting(true);


    setSubmissionMessage({
      type: "",
      text: "",
    });


    try {
      const booking =
        await saveBookingRequest("call");


      setSubmissionMessage({
        type: "success",
        text: `Demande ${booking.reference} enregistrée.`,
      });


      window.location.href = `tel:${CONTACT.callNumber}`;
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


  return (
    <section className="booking-page">
      <div
        className="booking-background"
        style={{
          backgroundImage: `url("${selectedDestination.image}")`,
        }}
      />


      <div className="booking-overlay" />


      {/* =====================================================
          MOBILE + TABLET
      ===================================================== */}


      <div className="booking-mobile-layout">
        <header className="booking-mobile-header">
          <span className="booking-mobile-eyebrow">
            Réservation
          </span>


          <h1>Finalisez votre séjour</h1>


          <p>
            Choisissez votre destination et préparez
            votre demande de réservation.
          </p>
        </header>


        <div className="booking-destination-selector">
          {destinations.map((destination) => {
            const isSelected =
              Number(formData.destinationId) ===
              destination.id;


            return (
              <button
                key={destination.id}
                type="button"
                className={`booking-destination-option ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() =>
                  handleDestinationSelect(
                    destination.id,
                  )
                }
                aria-pressed={isSelected}
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                />


                <span>{destination.name}</span>
              </button>
            );
          })}
        </div>


        <article className="booking-selected-destination">
          <div className="booking-selected-image">
            <img
              src={selectedDestination.image}
              alt={selectedDestination.name}
            />
          </div>


          <div className="booking-selected-info">
            <div>
              <span className="booking-selected-label">
                Votre destination
              </span>


              <h2>
                {selectedDestination.name}
              </h2>


              <p>
                {selectedDestination.location}
              </p>
            </div>


            <div className="booking-selected-price">
              <span>À partir de</span>


              <strong>
                {formatFcfa(
                  selectedDestination.startingPrice,
                )}{" "}
                FCFA
              </strong>


              <small>/ nuit</small>
            </div>
          </div>
        </article>


        <form
          className="booking-mobile-form"
          onSubmit={(event) =>
            event.preventDefault()
          }
          noValidate
        >
          <section className="booking-mobile-section">
            <div className="booking-mobile-section-heading">
              <span>Votre séjour</span>


              <p>
                Indiquez vos dates et le nombre de
                voyageurs.
              </p>
            </div>


            <div className="booking-trip-grid">
              <div className="booking-mobile-field">
                <label htmlFor="mobileCheckIn">
                  Arrivée
                </label>


                <input
                  id="mobileCheckIn"
                  name="checkIn"
                  type="date"
                  min={today}
                  value={formData.checkIn}
                  onChange={handleChange}
                />


                {errors.checkIn && (
                  <span className="field-error">
                    {errors.checkIn}
                  </span>
                )}
              </div>


              <div className="booking-mobile-field">
                <label htmlFor="mobileCheckOut">
                  Départ
                </label>


                <input
                  id="mobileCheckOut"
                  name="checkOut"
                  type="date"
                  min={
                    formData.checkIn || today
                  }
                  value={formData.checkOut}
                  onChange={handleChange}
                />


                {errors.checkOut && (
                  <span className="field-error">
                    {errors.checkOut}
                  </span>
                )}
              </div>


              {errors.dates && (
                <p className="form-wide-error">
                  {errors.dates}
                </p>
              )}


              <div className="booking-mobile-field">
                <label htmlFor="mobileAdults">
                  Adultes
                </label>


                <select
                  id="mobileAdults"
                  name="adults"
                  value={formData.adults}
                  onChange={handleChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(
                    (number) => (
                      <option
                        key={number}
                        value={number}
                      >
                        {number}
                      </option>
                    ),
                  )}
                </select>


                {errors.adults && (
                  <span className="field-error">
                    {errors.adults}
                  </span>
                )}
              </div>


              <div className="booking-mobile-field">
                <label htmlFor="mobileChildren">
                  Enfants
                </label>


                <select
                  id="mobileChildren"
                  name="children"
                  value={formData.children}
                  onChange={handleChange}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(
                    (number) => (
                      <option
                        key={number}
                        value={number}
                      >
                        {number}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </section>


          <section className="booking-mobile-section">
            <div className="booking-mobile-section-heading">
              <span>Vos coordonnées</span>


              <p>
                Ces informations permettront à STAY de
                vous recontacter.
              </p>
            </div>


            <div className="booking-mobile-contact-grid">
              <div className="booking-mobile-field booking-mobile-field-wide">
                <label htmlFor="mobileFullName">
                  Nom complet
                </label>


                <input
                  id="mobileFullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Votre nom complet"
                  value={formData.fullName}
                  onChange={handleChange}
                />


                {errors.fullName && (
                  <span className="field-error">
                    {errors.fullName}
                  </span>
                )}
              </div>


              <div className="booking-mobile-field">
                <label htmlFor="mobilePhone">
                  Téléphone
                </label>


                <input
                  id="mobilePhone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+229..."
                  value={formData.phone}
                  onChange={handleChange}
                />


                {errors.phone && (
                  <span className="field-error">
                    {errors.phone}
                  </span>
                )}
              </div>


              <div className="booking-mobile-field">
                <label htmlFor="mobileEmail">
                  Adresse e-mail
                </label>


                <input
                  id="mobileEmail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                  value={formData.email}
                  onChange={handleChange}
                />


                {errors.email && (
                  <span className="field-error">
                    {errors.email}
                  </span>
                )}
              </div>


              <div className="booking-mobile-field booking-mobile-field-wide">
                <label htmlFor="mobileSpecialRequest">
                  Demande particulière
                  <span> — facultatif</span>
                </label>


                <textarea
                  id="mobileSpecialRequest"
                  name="specialRequest"
                  rows="3"
                  placeholder="Transport, arrivée tardive, chambre particulière..."
                  value={
                    formData.specialRequest
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>


          <section className="booking-mobile-summary">
            <div>
              <span>Durée</span>


              <strong>
                {numberOfNights > 0
                  ? `${numberOfNights} nuitée${
                      numberOfNights > 1
                        ? "s"
                        : ""
                    }`
                  : "À déterminer"}
              </strong>
            </div>


            <div>
              <span>Estimation</span>


              <strong>
                {numberOfNights > 0
                  ? `${formatFcfa(
                      estimatedTotal,
                    )} FCFA`
                  : `À partir de ${formatFcfa(
                      selectedDestination.startingPrice,
                    )} FCFA`}
              </strong>
            </div>
          </section>


          <p className="booking-disclaimer">
            Les tarifs sont indicatifs. STAY confirmera
            la disponibilité et le montant final.
          </p>


          {submissionMessage.text && (
            <p
              className={`booking-submit-message ${submissionMessage.type}`}
              role="status"
            >
              {submissionMessage.text}
            </p>
          )}


          <div className="booking-mobile-actions">
            <button
              type="button"
              className="booking-mobile-whatsapp"
              onClick={handleWhatsApp}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Enregistrement..."
                : "Continuer sur WhatsApp"}
            </button>


            <button
              type="button"
              className="booking-mobile-call"
              onClick={handleCall}
              disabled={isSubmitting}
            >
              ou appeler STAY
            </button>
          </div>
        </form>
      </div>


      {/* =====================================================
          DESKTOP — EXISTING DESIGN
      ===================================================== */}


      <div className="booking-desktop-layout">
        <header className="booking-header">
          <h1>
            <span aria-hidden="true">|</span>
            Réservez votre séjour
          </h1>
        </header>


        <div className="booking-content">
          <div
  className="destination-preview"
  style={{
    "--booking-preview-image": `url("${selectedDestination.image}")`,
  }}
>
            <span className="preview-label">
              Votre destination
            </span>


            <h2>
              {selectedDestination.name}
            </h2>


            <p>
              {selectedDestination.location}
            </p>


            <div className="preview-price">
              <span>À partir de</span>


              <strong>
                {formatFcfa(
                  selectedDestination.startingPrice,
                )}{" "}
                FCFA / nuit
              </strong>
            </div>
          </div>


          <form
            className="booking-form"
            onSubmit={(event) =>
              event.preventDefault()
            }
            noValidate
          >
            <div className="form-heading">
              <span>Votre demande</span>


              <p>
                Renseignez les informations
                nécessaires pour préparer votre
                séjour.
              </p>
            </div>


            <div className="form-grid">
              <div className="form-field form-field-wide">
                <label htmlFor="destinationId">
                  Destination
                </label>


                <select
                  id="destinationId"
                  name="destinationId"
                  value={
                    formData.destinationId
                  }
                  onChange={handleChange}
                >
                  {destinations.map(
                    (destination) => (
                      <option
                        key={destination.id}
                        value={destination.id}
                      >
                        {destination.name}
                      </option>
                    ),
                  )}
                </select>


                {errors.destinationId && (
                  <span className="field-error">
                    {errors.destinationId}
                  </span>
                )}
              </div>


              <div className="form-field">
                <label htmlFor="checkIn">
                  Date d’arrivée
                </label>


                <input
                  id="checkIn"
                  name="checkIn"
                  type="date"
                  min={today}
                  value={formData.checkIn}
                  onChange={handleChange}
                />


                {errors.checkIn && (
                  <span className="field-error">
                    {errors.checkIn}
                  </span>
                )}
              </div>


              <div className="form-field">
                <label htmlFor="checkOut">
                  Date de départ
                </label>


                <input
                  id="checkOut"
                  name="checkOut"
                  type="date"
                  min={
                    formData.checkIn || today
                  }
                  value={formData.checkOut}
                  onChange={handleChange}
                />


                {errors.checkOut && (
                  <span className="field-error">
                    {errors.checkOut}
                  </span>
                )}
              </div>


              {errors.dates && (
                <p className="form-wide-error">
                  {errors.dates}
                </p>
              )}


              <div className="form-field">
                <label htmlFor="adults">
                  Adultes
                </label>


                <select
                  id="adults"
                  name="adults"
                  value={formData.adults}
                  onChange={handleChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(
                    (number) => (
                      <option
                        key={number}
                        value={number}
                      >
                        {number}
                      </option>
                    ),
                  )}
                </select>


                {errors.adults && (
                  <span className="field-error">
                    {errors.adults}
                  </span>
                )}
              </div>


              <div className="form-field">
                <label htmlFor="children">
                  Enfants
                </label>


                <select
                  id="children"
                  name="children"
                  value={formData.children}
                  onChange={handleChange}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(
                    (number) => (
                      <option
                        key={number}
                        value={number}
                      >
                        {number}
                      </option>
                    ),
                  )}
                </select>
              </div>


              <div className="form-field form-field-wide">
                <label htmlFor="fullName">
                  Nom complet du réservant
                </label>


                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Votre nom complet"
                  value={formData.fullName}
                  onChange={handleChange}
                />


                {errors.fullName && (
                  <span className="field-error">
                    {errors.fullName}
                  </span>
                )}
              </div>


              <div className="form-field">
                <label htmlFor="phone">
                  Téléphone
                </label>


                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+229..."
                  value={formData.phone}
                  onChange={handleChange}
                />


                {errors.phone && (
                  <span className="field-error">
                    {errors.phone}
                  </span>
                )}
              </div>


              <div className="form-field">
                <label htmlFor="email">
                  Adresse e-mail
                </label>


                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                  value={formData.email}
                  onChange={handleChange}
                />


                {errors.email && (
                  <span className="field-error">
                    {errors.email}
                  </span>
                )}
              </div>
            </div>


            <div className="booking-summary-line">
              <div>
                <span>Durée</span>


                <strong>
                  {numberOfNights > 0
                    ? `${numberOfNights} nuitée${
                        numberOfNights > 1
                          ? "s"
                          : ""
                      }`
                    : "À déterminer"}
                </strong>
              </div>


              <div>
                <span>Estimation</span>


                <strong>
                  {numberOfNights > 0
                    ? `${formatFcfa(
                        estimatedTotal,
                      )} FCFA`
                    : `À partir de ${formatFcfa(
                        selectedDestination.startingPrice,
                      )} FCFA`}
                </strong>
              </div>
            </div>


            <p className="booking-disclaimer">
              Les tarifs sont indicatifs. STAY
              confirmera la disponibilité et le
              montant final.
            </p>


            {submissionMessage.text && (
              <p
                className={`booking-submit-message ${submissionMessage.type}`}
                role="status"
              >
                {submissionMessage.text}
              </p>
            )}


            <div className="booking-actions">
              <button
                type="button"
                className="whatsapp-button"
                onClick={handleWhatsApp}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Enregistrement..."
                  : "Réserver sur WhatsApp"}
              </button>


              <button
                type="button"
                className="call-link"
                onClick={handleCall}
                disabled={isSubmitting}
              >
                ou appeler STAY
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}


export default Booking;
