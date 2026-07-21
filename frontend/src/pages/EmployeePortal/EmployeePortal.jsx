import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../../components/Logo/Logo";

import {
  clearEmployeeSession,
  employeeAuthApi,
  getEmployeeToken,
  saveEmployeeSession,
  updateStoredEmployee,
} from "../../services/api";

import "./EmployeePortal.css";


function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className="staff-login-arrow"
    >
      <path d="M5 15L15 5" />
      <path d="M7 5H15V13" />
    </svg>
  );
}


function EmployeePortal() {
  const navigate =
    useNavigate();


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    pin,
    setPin,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    isCheckingSession,
    setIsCheckingSession,
  ] = useState(true);


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  /*
  =========================================================
  RESTORE EMPLOYEE SESSION
  =========================================================
  */

  useEffect(() => {
    let isMounted = true;


    async function checkExistingSession() {
      if (
        !getEmployeeToken()
      ) {
        if (isMounted) {
          setIsCheckingSession(
            false,
          );
        }

        return;
      }


      try {
        const data =
          await employeeAuthApi.me();


        if (!isMounted) {
          return;
        }


        updateStoredEmployee(
          data.employee,
        );


        navigate(
          "/staff/dashboard",
          {
            replace: true,
          },
        );
      } catch {
        clearEmployeeSession();


        if (isMounted) {
          setIsCheckingSession(
            false,
          );
        }
      }
    }


    checkExistingSession();


    return () => {
      isMounted = false;
    };
  }, [navigate]);


  /*
  =========================================================
  LOGIN
  =========================================================
  */

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();


    setError("");

    setIsSubmitting(
      true,
    );


    try {
      const data =
        await employeeAuthApi.login(
          {
            email:
              email.trim(),

            pin,
          },
        );


      saveEmployeeSession(
        data.token,
        data.employee,
      );


      navigate(
        "/staff/dashboard",
        {
          replace: true,
        },
      );
    } catch (
      requestError
    ) {
      setError(
        requestError.message ||
          "Connexion impossible. Vérifiez vos informations.",
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }


  /*
  =========================================================
  LOADING
  =========================================================
  */

  if (
    isCheckingSession
  ) {
    return (
      <main className="staff-login-loading">
        <span
          className="staff-login-loader"
          aria-hidden="true"
        />
      </main>
    );
  }


  /*
  =========================================================
  PAGE
  =========================================================
  */

  return (
    <main className="staff-login-page">

      <div className="staff-login-shell">

        {/* ===============================================
            MAIN CARD
        ================================================ */}

        <div className="staff-login-card">

          {/* =============================================
              ABSTRACT BRAND PANEL
          ============================================== */}

          <section className="staff-login-brand-panel">

            <Link
              to="/"
              className="staff-login-logo-link"
              aria-label="Retourner à l'accueil STAY"
            >
              <Logo />
            </Link>


            <div
              className="staff-login-art"
              aria-hidden="true"
            >
              <span className="staff-art-grid" />

              <span className="staff-art-orbit staff-art-orbit-one" />

              <span className="staff-art-orbit staff-art-orbit-two" />

              <span className="staff-art-plane staff-art-plane-one" />

              <span className="staff-art-plane staff-art-plane-two" />

              <span className="staff-art-line staff-art-line-one" />

              <span className="staff-art-line staff-art-line-two" />

              <span className="staff-art-glow" />

              <span className="staff-art-point" />
            </div>


            <div className="staff-login-brand-content">
              <span>
                STAY
              </span>

              <h2>
                Espace réservé,
                <strong>
                  à l&apos;équipe.
                </strong>
              </h2>
            </div>

          </section>


          {/* =============================================
              LOGIN PANEL
          ============================================== */}

          <section className="staff-login-access-panel">

            <div className="staff-login-content">

              <form
                className="staff-login-form"
                onSubmit={
                  handleSubmit
                }
              >

                <header className="staff-login-form-header">

                  <span className="staff-login-eyebrow">
                    Espace équipe
                  </span>


                  <h1>
                    Bienvenue.
                  </h1>


                  <p>
                    Connectez-vous avec votre adresse professionnelle et votre code PIN personnel.
                  </p>

                </header>


                {/* EMAIL */}

                <div className="staff-login-field">

                  <label
                    htmlFor="employee-email"
                  >
                    Adresse e-mail
                  </label>


                  <input
                    id="employee-email"
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event,
                    ) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    autoComplete="username"
                    placeholder="nom@stay.bj"
                    autoFocus
                    required
                  />

                </div>


                {/* PIN */}

                <div className="staff-login-field">

                  <label
                    htmlFor="employee-pin"
                  >
                    Code PIN
                  </label>


                  <input
                    id="employee-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={
                      6
                    }
                    value={
                      pin
                    }
                    onChange={(
                      event,
                    ) => {
                      const numericPin =
                        event.target.value
                          .replace(
                            /\D/g,
                            "",
                          )
                          .slice(
                            0,
                            6,
                          );


                      setPin(
                        numericPin,
                      );
                    }}
                    autoComplete="current-password"
                    placeholder="••••••"
                    required
                  />

                </div>


                {/* ERROR */}

                {error && (
                  <p
                    className="staff-login-error"
                    role="alert"
                  >
                    {
                      error
                    }
                  </p>
                )}


                {/* SUBMIT */}

                <button
                  type="submit"
                  className="staff-login-submit"
                  disabled={
                    isSubmitting
                  }
                >

                  <span>
                    {isSubmitting
                      ? "Connexion..."
                      : "Se connecter"}
                  </span>


                  <ArrowIcon />

                </button>

              </form>

            </div>

          </section>

        </div>


        {/* ===============================================
            BACK LINK
        ================================================ */}

        <Link
          to="/"
          className="staff-login-back-link"
        >
          <span
            aria-hidden="true"
          >
            ←
          </span>

          Retour à STAY
        </Link>

      </div>

    </main>
  );
}


export default EmployeePortal;
