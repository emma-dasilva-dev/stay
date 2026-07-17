import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  authApi,
  bookingsApi,
  clearSession,
  getToken,
  saveSession,
} from "../../services/api";
import "./account.css";

const initialLoginForm = {
  email: "",
  password: "",
};

const initialRegisterForm = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
};

const STATUS_LABELS = {
  pending: "En attente",
  contacted: "Contactée",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

function formatFcfa(amount) {
  if (amount === null || amount === undefined) {
    return "À déterminer";
  }

  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getTravelersLabel(booking) {
  const adults = `${booking.adults} adulte${
    booking.adults > 1 ? "s" : ""
  }`;

  if (!booking.children) {
    return adults;
  }

  return `${adults}, ${booking.children} enfant${
    booking.children > 1 ? "s" : ""
  }`;
}

function Account() {
  const navigate = useNavigate();

  const [activeMode, setActiveMode] = useState("login");

  const [loginForm, setLoginForm] =
    useState(initialLoginForm);

  const [registerForm, setRegisterForm] =
    useState(initialRegisterForm);

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [isCheckingSession, setIsCheckingSession] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isLoadingBookings, setIsLoadingBookings] =
    useState(false);

  const [bookingsError, setBookingsError] =
    useState("");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setBookings([]);
      setBookingsError("");
    }
  }, [user]);

  async function restoreSession() {
    const token = getToken();

    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    try {
      const data = await authApi.me();

      if (data.user.role === "admin") {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      setUser(data.user);
    } catch (error) {
      clearSession();

      setMessage({
        type: "error",
        text:
          error.message ||
          "Votre session a expiré. Veuillez vous reconnecter.",
      });
    } finally {
      setIsCheckingSession(false);
    }
  }

  async function loadBookings() {
    if (!getToken()) {
      return;
    }

    setIsLoadingBookings(true);
    setBookingsError("");

    try {
      const data = await bookingsApi.myBookings();

      setBookings(data.bookings || []);
    } catch (error) {
      setBookingsError(
        error.message ||
          "Impossible de charger vos réservations.",
      );
    } finally {
      setIsLoadingBookings(false);
    }
  }

  function clearMessage() {
    if (!message.text) {
      return;
    }

    setMessage({
      type: "",
      text: "",
    });
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;

    setLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    clearMessage();
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;

    setRegisterForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    clearMessage();
  }

  function changeMode(mode) {
    setActiveMode(mode);

    setMessage({
      type: "",
      text: "",
    });
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (
      !loginForm.email.trim() ||
      !loginForm.password
    ) {
      setMessage({
        type: "error",
        text:
          "Renseignez votre adresse e-mail et votre mot de passe.",
      });

      return;
    }

    setIsSubmitting(true);
    clearMessage();

    try {
      const data = await authApi.login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      saveSession(
        data.token,
        data.user,
      );

      setLoginForm(initialLoginForm);

      if (data.user.role === "admin") {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      setUser(data.user);

      setMessage({
        type: "success",
        text: "Connexion réussie.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.message ||
          "Impossible de vous connecter pour le moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    const fullName =
      registerForm.fullName.trim();

    const phone =
      registerForm.phone.trim();

    const email =
      registerForm.email.trim();

    const password =
      registerForm.password;

    if (!fullName || !email || !password) {
      setMessage({
        type: "error",
        text:
          "Le nom complet, l’adresse e-mail et le mot de passe sont obligatoires.",
      });

      return;
    }

    if (password.length < 8) {
      setMessage({
        type: "error",
        text:
          "Le mot de passe doit contenir au moins 8 caractères.",
      });

      return;
    }

    setIsSubmitting(true);
    clearMessage();

    try {
      const data = await authApi.register({
        fullName,
        phone,
        email,
        password,
      });

      saveSession(
        data.token,
        data.user,
      );

      setUser(data.user);

      setRegisterForm(
        initialRegisterForm,
      );

      setMessage({
        type: "success",
        text:
          "Votre compte STAY a été créé.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.message ||
          "Impossible de créer le compte pour le moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearSession();

    setUser(null);
    setBookings([]);

    setActiveMode("login");

    setMessage({
      type: "success",
      text:
        "Vous avez été déconnecté.",
    });
  }

  if (isCheckingSession) {
    return (
      <main className="account-page account-loading-page">
        <div className="account-loading">
          <span className="account-loader" />

          <span>
            Chargement de votre espace
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      {user ? (
        <AuthenticatedAccount
          user={user}
          bookings={bookings}
          bookingsError={bookingsError}
          isLoadingBookings={
            isLoadingBookings
          }
          message={message}
          onReloadBookings={
            loadBookings
          }
          onLogout={handleLogout}
        />
      ) : (
        <GuestAccount
          activeMode={activeMode}
          loginForm={loginForm}
          registerForm={registerForm}
          message={message}
          isSubmitting={
            isSubmitting
          }
          onModeChange={
            changeMode
          }
          onLoginChange={
            handleLoginChange
          }
          onRegisterChange={
            handleRegisterChange
          }
          onLogin={handleLogin}
          onRegister={
            handleRegister
          }
        />
      )}
    </main>
  );
}

function GuestAccount({
  activeMode,
  loginForm,
  registerForm,
  message,
  isSubmitting,
  onModeChange,
  onLoginChange,
  onRegisterChange,
  onLogin,
  onRegister,
}) {
  const isLogin =
    activeMode === "login";

  return (
    <div className="account-guest">
      {/* =========================================
          EDITORIAL SIDE
      ========================================== */}

      <section className="account-guest-intro">
        <div className="account-intro-meta">
          <span>05 / COMPTE</span>

          <span>
            ESPACE PERSONNEL
          </span>
        </div>

        <div className="account-intro-main">
          <h1>
            Votre espace.
            <span>À vous.</span>
          </h1>

          <p>
            Retrouvez vos demandes,
            suivez leur évolution et gardez
            vos informations au même endroit.
          </p>
        </div>

        <div className="account-intro-footer">
          <span>Réservations</span>

          <span>Suivi</span>

          <span>Profil</span>
        </div>

        <div
          className="account-orbit"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      </section>

      {/* =========================================
          AUTHENTICATION SIDE
      ========================================== */}

      <section className="account-auth-zone">
        <div className="account-auth-inner">
          <div className="account-auth-heading">
            <span>
              {isLogin
                ? "Bienvenue"
                : "Première visite"}
            </span>

            <h2>
              {isLogin
                ? "Se retrouver."
                : "Créer votre espace."}
            </h2>
          </div>

          <div
            className="account-tabs"
            role="tablist"
            aria-label="Authentification"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                isLogin
              }
              className={
                isLogin
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                onModeChange(
                  "login",
                )
              }
            >
              Connexion
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                !isLogin
              }
              className={
                !isLogin
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                onModeChange(
                  "register",
                )
              }
            >
              Créer un compte
            </button>
          </div>

          {message.text && (
            <p
              className={`account-message ${message.type}`}
              role="status"
            >
              {message.text}
            </p>
          )}

          {isLogin ? (
            <form
              className="account-form account-login-form"
              onSubmit={onLogin}
            >
              <div className="account-field">
                <label htmlFor="login-email">
                  Adresse e-mail
                </label>

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                  value={
                    loginForm.email
                  }
                  onChange={
                    onLoginChange
                  }
                />
              </div>

              <div className="account-field">
                <label htmlFor="login-password">
                  Mot de passe
                </label>

                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  value={
                    loginForm.password
                  }
                  onChange={
                    onLoginChange
                  }
                />
              </div>

              <button
                type="submit"
                className="account-primary-button"
                disabled={
                  isSubmitting
                }
              >
                <span>
                  {isSubmitting
                    ? "Connexion..."
                    : "Se connecter"}
                </span>

                <span
                  aria-hidden="true"
                >
                  ↗
                </span>
              </button>

              <button
                type="button"
                className="account-switch-link"
                onClick={() =>
                  onModeChange(
                    "register",
                  )
                }
              >
                Pas encore de compte ?
                <span>
                  Créer un compte
                </span>
              </button>
            </form>
          ) : (
            <form
              className="account-form account-register-form"
              onSubmit={
                onRegister
              }
            >
              <div className="account-field">
                <label htmlFor="register-name">
                  Nom complet
                </label>

                <input
                  id="register-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Votre nom complet"
                  value={
                    registerForm.fullName
                  }
                  onChange={
                    onRegisterChange
                  }
                />
              </div>

              <div className="account-field">
                <label htmlFor="register-phone">
                  Téléphone
                </label>

                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+229..."
                  value={
                    registerForm.phone
                  }
                  onChange={
                    onRegisterChange
                  }
                />
              </div>

              <div className="account-field account-field-wide">
                <label htmlFor="register-email">
                  Adresse e-mail
                </label>

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                  value={
                    registerForm.email
                  }
                  onChange={
                    onRegisterChange
                  }
                />
              </div>

              <div className="account-field account-field-wide">
                <label htmlFor="register-password">
                  Mot de passe
                </label>

                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  value={
                    registerForm.password
                  }
                  onChange={
                    onRegisterChange
                  }
                />
              </div>

              <button
                type="submit"
                className="account-primary-button account-field-wide"
                disabled={
                  isSubmitting
                }
              >
                <span>
                  {isSubmitting
                    ? "Création..."
                    : "Créer mon compte"}
                </span>

                <span
                  aria-hidden="true"
                >
                  ↗
                </span>
              </button>

              <button
                type="button"
                className="account-switch-link account-field-wide"
                onClick={() =>
                  onModeChange(
                    "login",
                  )
                }
              >
                Déjà inscrit ?
                <span>
                  Se connecter
                </span>
              </button>
            </form>
          )}

          <div className="account-auth-note">
            <span>STAY</span>

            <p>
              Vos informations sont utilisées
              uniquement pour gérer votre compte
              et vos demandes de réservation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthenticatedAccount({
  user,
  bookings,
  bookingsError,
  isLoadingBookings,
  message,
  onReloadBookings,
  onLogout,
}) {
  const firstName =
    user.fullName
      ?.trim()
      .split(/\s+/)[0] ||
    "Client";

  return (
    <div className="account-member">
      {/* =========================================
          MEMBER HERO
      ========================================== */}

      <header className="account-member-hero">
        <div className="account-member-meta">
          <span>
            05 / VOTRE ESPACE
          </span>

          <span>
            {String(
              bookings.length,
            ).padStart(2, "0")}{" "}
            demande
            {bookings.length > 1
              ? "s"
              : ""}
          </span>
        </div>

        <div className="account-member-heading">
          <h1>
            Bonjour,
            <span>{firstName}.</span>
          </h1>

          <div className="account-member-actions">
            <Link
              to="/booking"
              className="account-new-booking"
            >
              Nouvelle demande

              <span
                aria-hidden="true"
              >
                ↗
              </span>
            </Link>
          </div>
        </div>
      </header>

      {message.text && (
        <div className="account-global-message">
          <p
            className={`account-message ${message.type}`}
            role="status"
          >
            {message.text}
          </p>
        </div>
      )}

      {/* =========================================
          DASHBOARD
      ========================================== */}

      <div className="account-dashboard">
        <section className="account-bookings">
          <div className="account-section-heading">
            <div>
              <span>
                Réservations
              </span>

              <h2>
                Mes demandes
              </h2>
            </div>

            <span className="booking-count">
              {String(
                bookings.length,
              ).padStart(2, "0")}
            </span>
          </div>

          {isLoadingBookings && (
            <div className="bookings-loading">
              <span className="account-loader" />

              <p>
                Chargement de vos demandes...
              </p>
            </div>
          )}

          {!isLoadingBookings &&
            bookingsError && (
              <div className="bookings-error">
                <span>
                  Une erreur est survenue.
                </span>

                <p>
                  {bookingsError}
                </p>

                <button
                  type="button"
                  onClick={
                    onReloadBookings
                  }
                >
                  Réessayer
                </button>
              </div>
            )}

          {!isLoadingBookings &&
            !bookingsError &&
            bookings.length === 0 && (
              <div className="empty-bookings">
                <span className="empty-bookings-index">
                  00
                </span>

                <div>
                  <h3>
                    Aucun séjour en attente.
                  </h3>

                  <p>
                    Vos futures demandes apparaîtront
                    ici avec leur statut et leurs
                    informations principales.
                  </p>

                  <Link
                    to="/destinations"
                    className="discover-destinations"
                  >
                    Explorer les destinations

                    <span
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </Link>
                </div>
              </div>
            )}

          {!isLoadingBookings &&
            !bookingsError &&
            bookings.length > 0 && (
              <div className="booking-history">
                {bookings.map(
                  (
                    booking,
                    index,
                  ) => (
                    <article
                      key={
                        booking.id
                      }
                      className="booking-history-item"
                    >
                      <div className="booking-history-index">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </div>

                      <div className="booking-history-main">
                        <div className="booking-history-top">
                          <div>
                            <span className="booking-reference">
                              {
                                booking.reference
                              }
                            </span>

                            <h3>
                              {
                                booking.destinationName
                              }
                            </h3>

                            <p>
                              {
                                booking.destinationLocation
                              }
                            </p>
                          </div>

                          <span
                            className={`booking-status ${
                              booking.status ||
                              ""
                            }`}
                          >
                            {STATUS_LABELS[
                              booking
                                .status
                            ] ||
                              booking.status}
                          </span>
                        </div>

                        <div className="booking-history-details">
                          <div>
                            <span>
                              Séjour
                            </span>

                            <strong>
                              {formatDate(
                                booking.checkIn,
                              )}{" "}
                              —{" "}
                              {formatDate(
                                booking.checkOut,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Voyageurs
                            </span>

                            <strong>
                              {getTravelersLabel(
                                booking,
                              )}
                            </strong>
                          </div>

                          <div className="booking-history-price">
                            <span>
                              Estimation
                            </span>

                            <strong>
                              {formatFcfa(
                                booking.estimatedTotalFcfa,
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
        </section>

        {/* =========================================
            PROFILE
        ========================================== */}

        <aside className="account-profile">
          <div className="account-profile-sticky">
            <div className="account-section-heading">
              <div>
                <span>
                  Profil
                </span>

                <h2>
                  Mes informations
                </h2>
              </div>
            </div>

            <div className="profile-monogram">
              <span>
                {firstName
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>

            <dl className="profile-details">
              <div>
                <dt>
                  Nom complet
                </dt>

                <dd>
                  {user.fullName}
                </dd>
              </div>

              <div>
                <dt>
                  Adresse e-mail
                </dt>

                <dd>
                  {user.email}
                </dd>
              </div>

              <div>
                <dt>
                  Téléphone
                </dt>

                <dd>
                  {user.phone ||
                    "Non renseigné"}
                </dd>
              </div>

              <div>
                <dt>
                  Type de compte
                </dt>

                <dd>
                  {user.role ===
                  "admin"
                    ? "Administrateur"
                    : "Client"}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              className="logout-button"
              onClick={
                onLogout
              }
            >
              Se déconnecter

              <span
                aria-hidden="true"
              >
                ↗
              </span>
            </button>
          </div>
        </aside>
      </div>

      <footer className="account-footer">
        <span>STAY</span>

        <span>
          Cotonou · Bénin
        </span>

        <span>
          Espace personnel
        </span>
      </footer>
    </div>
  );
}

export default Account;
