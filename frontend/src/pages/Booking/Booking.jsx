import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { bookingsApi } from "../../services/api";
import { useDestinations } from "../../hooks/useDestinations";
import "./Booking.css";


const CONTACT = {
  whatsappUrl: "https://wa.me/22940343012",
  callNumber: "+2290140343012",
};


function formatFcfa(amount) {
  return new Intl.NumberFormat("fr-FR").format(amount || 0);
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


  const difference = departure.getTime() - arrival.getTime();


  return difference > 0
    ? Math.ceil(difference / 86400000)
    : 0;
}


function Booking() {
  const [searchParams] = useSearchParams();


  const {
    destinations,
    isLoading: isLoadingDestinations,
    error: destinationsError,
    reload: reloadDestinations,
  } = useDestinations();


  const destinationFromUrl = searchParams.get("destination");


  const [formData, setFormData] = useState({
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


  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [submissionMessage, setSubmissionMessage] = useState({
    type: "",
    text: "",
  });


  useEffect(() => {
    if (destinations.length === 0 || formData.destinationId) {
      return;
    }


    const matchesUrl = destinations.some(
      (destination) =>
        destination.id === Number(destinationFromUrl),
    );


    setFormData((currentData) => ({
      ...currentData,
      destinationId: matchesUrl
        ? String(destinationFromUrl)
        : String(destinations[0].id),
    }));
  }, [
    destinations,
    destinationFromUrl,
    formData.destinationId,
  ]);


  const selectedDestination = useMemo(() => {
    return destinations.find(
      (destination) =>
        destination.id === Number(formData.destinationId),
    );
  }, [destinations, formData.destinationId]);


  const numberOfNights = useMemo(() => {
    return calculateNights(
      formData.checkIn,
      formData.checkOut,
    );
  }, [formData.checkIn, formData.checkOut]);


  const estimatedTotal = selectedDestination
    ? numberOfNights > 0
      ? selectedDestination.startingPriceFcfa *
        numberOfNights
      : selectedDestination.startingPriceFcfa
    : 0;


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


  const saveBookingRequest = async (contactMethod) => {
    const data = await bookingsApi.create({
      destinationId: Number(formData.destinationId),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      adults: Number(formData.adults),
      children: Number(formData.children),
      specialRequest: formData.specialRequest.trim(),
      contactMethod,
    });


    return data.booking;
  };


  const createWhatsAppMessage = (bookingReference) => {
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
        createWhatsAppMessage(booking.reference),
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


      window.location.href =
        `tel:${CONTACT.callNumber}`;
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


  if (isLoadingDestinations) {
    return (
      <main className="booking-page booking-page-state">
        <div className="booking-state">
          <span className="booking-state-loader" />
          <p>Chargement des destinations...</p>
        </div>
      </main>
    );
  }


  if (destinationsError) {
    return (
      <main className="booking-page booking-page-state">
        <div className="booking-state">
          <p>{destinationsError}</p>


          <button
            type="button"
            onClick={reloadDestinations}
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }


  if (!selectedDestination) {
    return (
      <main className="booking-page booking-page-state">
        <div className="booking-state">
          <p>
            Aucune destination n’est disponible pour le moment.
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="booking-page">
      <div className="booking-shell">
        {/* =========================================
            LEFT SIDE
        ========================================== */}


       <section className="booking-visual">
  <span className="booking-page-index">
    03 / RÉSERVATION
  </span>

  <div className="booking-editorial">
    <h1>
      Réserver
      <span>autrement.</span>
    </h1>
  </div>



          <div className="booking-visual-image">
            <img
              src={selectedDestination.image}
              alt={selectedDestination.name}
            />


            <div className="booking-visual-gradient" />


            <div className="booking-image-content">
              <div>
                <span>Votre destination</span>


                <h2>{selectedDestination.name}</h2>


                <p>{selectedDestination.location}</p>
              </div>


              <div className="booking-image-price">
                <span>À partir de</span>


                <strong>
                  {formatFcfa(
                    selectedDestination.startingPriceFcfa,
                  )}{" "}
                  FCFA
                </strong>


                <small>/ nuit</small>
              </div>
            </div>
          </div>
        </section>



{/* =========================================
    RIGHT SIDE
========================================== */}


<section className="booking-panel">
  <div className="booking-panel-header">
    <h2>Votre séjour.</h2>
  </div>



          {/* =========================================
              DESTINATION SELECTOR
          ========================================== */}


          <div className="booking-destination-block">
            <div className="booking-section-heading">
              <span>01</span>


              <div>
                <h3>Destination</h3>
              </div>
            </div>


            <div className="booking-destination-selector">
              {destinations.map((destination) => {
                const isSelected =
                  Number(formData.destinationId) ===
                  destination.id;


                return (
                  <button
                    key={destination.id}
                    type="button"
                    className={
                      isSelected
                        ? "booking-destination-option is-selected"
                        : "booking-destination-option"
                    }
                    onClick={() =>
                      handleDestinationSelect(
                        destination.id,
                      )
                    }
                    aria-pressed={isSelected}
                  >
                    <img
                      src={destination.image}
                      alt=""
                    />


                    <span>
                      {destination.name}
                    </span>
                  </button>
                );
              })}
            </div>


            {errors.destinationId && (
              <span className="field-error">
                {errors.destinationId}
              </span>
            )}
          </div>


          <form
            className="booking-form"
            onSubmit={(event) =>
              event.preventDefault()
            }
            noValidate
          >
            {/* =========================================
                STAY DETAILS
            ========================================== */}


            <section className="booking-form-section">
              <div className="booking-section-heading">
                <span>02</span>


               <div>
  <h3>Dates & voyageurs</h3>
</div>
              </div>


              <div className="booking-form-grid">
                <div className="booking-field">
                  <label htmlFor="checkIn">
                    Arrivée
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


                <div className="booking-field">
                  <label htmlFor="checkOut">
                    Départ
                  </label>


                  <input
                    id="checkOut"
                    name="checkOut"
                    type="date"
                    min={formData.checkIn || today}
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


                <div className="booking-field">
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


                <div className="booking-field">
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
              </div>
            </section>


            {/* =========================================
                CONTACT DETAILS
            ========================================== */}


            <section className="booking-form-section">
              <div className="booking-section-heading">
                <span>03</span>


                <div>
                  <h3>Coordonnées</h3>
                </div>
              </div>


              <div className="booking-form-grid">
                <div className="booking-field booking-field-wide">
                  <label htmlFor="fullName">
                    Nom complet
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


                <div className="booking-field">
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


                <div className="booking-field">
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


                <div className="booking-field booking-field-wide">
                  <label htmlFor="specialRequest">
                    Demande particulière
                    <span> — facultatif</span>
                  </label>


                  <textarea
                    id="specialRequest"
                    name="specialRequest"
                    rows="3"
                    placeholder="Transport, arrivée tardive, préférence particulière..."
                    value={formData.specialRequest}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>


            {/* =========================================
                LIVE SUMMARY
            ========================================== */}


            <section className="booking-summary">
              <div className="booking-summary-heading">
                <span>Résumé</span>


                <span>
                  {selectedDestination.name}
                </span>
              </div>


              <div className="booking-summary-grid">
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
                  <span>Voyageurs</span>


                  <strong>
                    {formData.adults +
                      formData.children}
                  </strong>
                </div>


                <div className="booking-summary-total">
                  <span>Estimation</span>


                  <strong>
                    {numberOfNights > 0
                      ? `${formatFcfa(
                          estimatedTotal,
                        )} FCFA`
                      : `Dès ${formatFcfa(
                          selectedDestination.startingPriceFcfa,
                        )} FCFA`}
                  </strong>
                </div>
              </div>
            </section>


            <p className="booking-disclaimer">
              Les tarifs sont indicatifs. STAY confirmera
              la disponibilité et le montant final avant
              toute réservation définitive.
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
                className="booking-primary-action"
                onClick={handleWhatsApp}
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? "Enregistrement..."
                    : "Continuer sur WhatsApp"}
                </span>


                <span aria-hidden="true">↗</span>
              </button>


              <button
                type="button"
                className="booking-secondary-action"
                onClick={handleCall}
                disabled={isSubmitting}
              >
                ou appeler STAY
              </button>
            </div>
          </form>
        </section>
      </div>
    </main> 
  );
}


export default Booking;
