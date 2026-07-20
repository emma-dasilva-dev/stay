import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../../components/Logo/logo";
import {
  clearEmployeeSession,
  employeeAuthApi,
  getEmployeeToken,
  saveEmployeeSession,
  updateStoredEmployee,
} from "../../services/api";

import "./EmployeePortal.css";

function EmployeePortal() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      if (!getEmployeeToken()) {
        if (isMounted) {
          setIsCheckingSession(false);
        }

        return;
      }

      try {
        const data = await employeeAuthApi.me();

        if (!isMounted) {
          return;
        }

        updateStoredEmployee(data.employee);

        navigate("/staff/dashboard", {
          replace: true,
        });
      } catch {
        clearEmployeeSession();

        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const data = await employeeAuthApi.login({
        email: email.trim(),
        pin,
      });

      saveEmployeeSession(data.token, data.employee);

      navigate("/staff/dashboard", {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          "Connexion impossible. Vérifiez vos informations.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="staff-login-loading">
        <span className="staff-login-loader" />
      </main>
    );
  }

  return (
    <main className="staff-login-page">
      <section className="staff-login-brand-panel">
        <Link
          to="/"
          className="staff-login-logo-link"
          aria-label="Retourner à l'accueil STAY"
        >
          <Logo />
        </Link>

        <div className="staff-login-brand-content">
          <span className="staff-login-eyebrow">
            ESPACE ÉQUIPE
          </span>

          <h2>
            Votre espace
            <br />
            de travail STAY.
          </h2>

          <p>
            Un accès sécurisé réservé aux membres autorisés
            de l'équipe.
          </p>
        </div>

        <span className="staff-login-brand-footer">
          STAY · ACCÈS PROFESSIONNEL
        </span>
      </section>

      <section className="staff-login-access-panel">
        <header className="staff-login-header">
          <span>ACCÈS EMPLOYÉ</span>

          <Link to="/" className="staff-login-back-link">
            ← Retour à l'accueil
          </Link>
        </header>

        <div className="staff-login-content">
          <form
            className="staff-login-form"
            onSubmit={handleSubmit}
          >
            <span className="staff-login-step">
              CONNEXION
            </span>

            <h1>Bienvenue.</h1>

            <p className="staff-login-description">
              Connectez-vous avec votre adresse e-mail
              professionnelle et votre code PIN personnel.
            </p>

            <div className="staff-login-field">
              <label htmlFor="employee-email">
                Adresse e-mail
              </label>

              <input
                id="employee-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="username"
                placeholder="nom@stay.bj"
                autoFocus
                required
              />
            </div>

            <div className="staff-login-field">
              <label htmlFor="employee-pin">
                Code PIN
              </label>

              <input
                id="employee-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={pin}
                onChange={(event) => {
                  const numericPin = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setPin(numericPin);
                }}
                autoComplete="current-password"
                placeholder="••••••"
                required
              />
            </div>

            {error && (
              <p
                className="staff-login-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="staff-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Connexion..."
                : "Se connecter"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default EmployeePortal;
