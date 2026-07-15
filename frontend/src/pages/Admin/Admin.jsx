import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./Admin.css";

const API_URL = "http://localhost:5000/api";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "contacted", label: "Contactée" },
  { value: "confirmed", label: "Confirmée" },
  { value: "cancelled", label: "Annulée" },
  { value: "completed", label: "Terminée" },
];

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

  const normalizedDate = String(dateValue).slice(0, 10);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${normalizedDate}T12:00:00`));
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function Admin() {
  const navigate = useNavigate();

  const [accessState, setAccessState] = useState("checking");
  const [adminUser, setAdminUser] = useState(null);

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    contactedBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalCustomers: 0,
  });

  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [dashboardError, setDashboardError] = useState("");
  const [actionMessage, setActionMessage] = useState({
    type: "",
    text: "",
  });

  const [selectedStatus, setSelectedStatus] = useState("");

  const [activeView, setActiveView] = useState("overview");

  const [customers, setCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [customerSearchInput, setCustomerSearchInput] = useState("");

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [hasLoadedCustomers, setHasLoadedCustomers] = useState(false);
  const [customersError, setCustomersError] = useState("");

  const getToken = useCallback(() => {
    return localStorage.getItem("stay_access_token");
  }, []);

  const handleUnauthorizedSession = useCallback(() => {
    localStorage.removeItem("stay_access_token");
    localStorage.removeItem("stay_user");

    setAdminUser(null);
    setAccessState("unauthenticated");
  }, []);

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const token = getToken();

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...(options.body
            ? {
                "Content-Type": "application/json",
              }
            : {}),
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorizedSession();
        throw new Error(data.message || "Votre session a expiré.");
      }

      if (response.status === 403) {
        setAccessState("forbidden");
        throw new Error(data.message || "Accès administrateur refusé.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue.");
      }

      return data;
    },
    [getToken, handleUnauthorizedSession],
  );

  const verifyAdminAccess = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setAccessState("unauthenticated");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Votre session n’est plus valide.");
      }

      if (data.user.role !== "admin") {
        setAccessState("forbidden");
        return;
      }

      setAdminUser(data.user);
      setAccessState("authorized");
    } catch (error) {
      handleUnauthorizedSession();
    }
  }, [getToken, handleUnauthorizedSession]);

  const loadDashboardStats = useCallback(async () => {
    const data = await apiRequest("/admin/stats");
    setStats(data.stats);
  }, [apiRequest]);

  const loadBookings = useCallback(async () => {
    const query = new URLSearchParams();

    if (statusFilter) {
      query.set("status", statusFilter);
    }

    if (activeSearch) {
      query.set("search", activeSearch);
    }

    const queryString = query.toString();
    const endpoint = queryString
      ? `/admin/bookings?${queryString}`
      : "/admin/bookings";

    const data = await apiRequest(endpoint);

    setBookings(data.bookings || []);

    setSelectedBooking((currentBooking) => {
      if (!currentBooking) {
        return null;
      }

      return (
        data.bookings.find((booking) => booking.id === currentBooking.id) ||
        null
      );
    });
  }, [activeSearch, apiRequest, statusFilter]);

  const loadDashboard = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoadingDashboard(true);
      }

      setDashboardError("");

      try {
        await Promise.all([loadDashboardStats(), loadBookings()]);
      } catch (error) {
        setDashboardError(
          error.message || "Impossible de charger le tableau de bord.",
        );
      } finally {
        if (showLoader) {
          setIsLoadingDashboard(false);
        }
      }
    },
    [loadBookings, loadDashboardStats],
  );

  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    setCustomersError("");

    try {
      const [customersData, bookingsData] = await Promise.all([
        apiRequest("/admin/customers"),
        apiRequest("/admin/bookings"),
      ]);

      setCustomers(customersData.customers || []);
      setAllBookings(bookingsData.bookings || []);
      setHasLoadedCustomers(true);
    } catch (error) {
      setCustomersError(
        error.message || "Impossible de charger les clients.",
      );
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    verifyAdminAccess();
  }, [verifyAdminAccess]);

  useEffect(() => {
    if (accessState !== "authorized") {
      return undefined;
    }

    loadDashboard();

    const refreshInterval = window.setInterval(() => {
      loadDashboard(false);
    }, 20000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [accessState, loadDashboard]);

  useEffect(() => {
    if (accessState !== "authorized") {
      return;
    }

    if (activeView !== "customers" || hasLoadedCustomers) {
      return;
    }

    loadCustomers();
  }, [accessState, activeView, hasLoadedCustomers, loadCustomers]);

  useEffect(() => {
    if (selectedBooking) {
      setSelectedStatus(selectedBooking.status);
    }
  }, [selectedBooking]);

  const visibleStats = useMemo(
    () => [
      {
        label: "Réservations",
        value: stats.totalBookings,
        helper: "Toutes les demandes",
      },
      {
        label: "En attente",
        value: stats.pendingBookings,
        helper: "À traiter",
      },
      {
        label: "Confirmées",
        value: stats.confirmedBookings,
        helper: "Séjours validés",
      },
      {
        label: "Clients",
        value: stats.totalCustomers,
        helper: "Comptes enregistrés",
      },
    ],
    [stats],
  );

  const filteredCustomers = useMemo(() => {
    const term = customerSearchInput.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.fullName, customer.email, customer.phone]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [customers, customerSearchInput]);

  const selectedCustomerBookings = useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return allBookings.filter(
      (booking) => booking.userId === selectedCustomer.id,
    );
  }, [allBookings, selectedCustomer]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setActiveSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setActiveSearch("");
  }

  function openBooking(booking) {
    setSelectedBooking(booking);
    setActionMessage({
      type: "",
      text: "",
    });
  }

  function closeBookingPanel() {
    setSelectedBooking(null);
    setActionMessage({
      type: "",
      text: "",
    });
  }

  function openCustomer(customer) {
    setSelectedCustomer(customer);
  }

  function closeCustomerPanel() {
    setSelectedCustomer(null);
  }

  function handleViewChange(view) {
    setActiveView(view);
    setSelectedBooking(null);
    setSelectedCustomer(null);
  }

  async function updateBookingStatus() {
    if (
      !selectedBooking ||
      !selectedStatus ||
      selectedStatus === selectedBooking.status
    ) {
      return;
    }

    setIsUpdatingStatus(true);
    setActionMessage({
      type: "",
      text: "",
    });

    try {
      const data = await apiRequest(
        `/admin/bookings/${selectedBooking.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: selectedStatus,
          }),
        },
      );

      setSelectedBooking(data.booking);

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === data.booking.id ? data.booking : booking,
        ),
      );

      setAllBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === data.booking.id ? data.booking : booking,
        ),
      );

      await loadDashboardStats();

      setActionMessage({
        type: "success",
        text: "Le statut a été mis à jour.",
      });
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error.message || "Impossible de modifier le statut.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("stay_access_token");
    localStorage.removeItem("stay_user");
    navigate("/account", { replace: true });
  }

  if (accessState === "checking") {
    return (
      <main className="admin-access-page">
        <div className="admin-access-message">
          <span className="admin-loader"></span>
          <p>Vérification de votre accès...</p>
        </div>
      </main>
    );
  }

  if (accessState === "unauthenticated") {
    return <Navigate to="/account" replace />;
  }

  if (accessState === "forbidden") {
    return (
      <main className="admin-access-page">
        <div className="admin-access-denied">
          <span>403</span>

          <h1>Accès refusé</h1>

          <p>
            Cette page est exclusivement réservée aux administrateurs de STAY.
          </p>

          <button type="button" onClick={() => navigate("/account")}>
            Retourner à mon compte
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div>
          <span className="admin-logo">STAY</span>
          <span className="admin-logo-label">Administration</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={activeView === "overview" ? "is-active" : ""}
            onClick={() => handleViewChange("overview")}
          >
            Vue d’ensemble
          </button>

          <button
            type="button"
            className={activeView === "reservations" ? "is-active" : ""}
            onClick={() => handleViewChange("reservations")}
          >
            Réservations
          </button>

          <button
            type="button"
            className={activeView === "customers" ? "is-active" : ""}
            onClick={() => handleViewChange("customers")}
          >
            Clients
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div>
            <span>Connecté en tant que</span>
            <strong>{adminUser?.fullName || "Administrateur"}</strong>
          </div>

          <button type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-header-eyebrow">
  {activeView === "overview" && "Tableau de bord"}
  {activeView === "reservations" &&
    "Gestion des réservations"}
  {activeView === "customers" &&
    "Gestion des clients"}
</span>

<h1>
  {activeView === "overview" && (
    <>
      Bonjour,{" "}
      {adminUser?.fullName?.split(" ")[0] ||
        "Administrateur"}
      .
    </>
  )}

  {activeView === "reservations" &&
    "Réservations"}

  {activeView === "customers" &&
    "Clients"}
</h1>

<p>
  {activeView === "overview" &&
    "Suivez l’activité générale de la plateforme STAY."}

  {activeView === "reservations" &&
    "Consultez, recherchez et mettez à jour les demandes de réservation."}

  {activeView === "customers" &&
    "Consultez les comptes clients et leur historique de réservation."}
</p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() =>
              activeView === "customers" ? loadCustomers() : loadDashboard()
            }
            disabled={
              activeView === "customers"
                ? isLoadingCustomers
                : isLoadingDashboard
            }
          >
            {(activeView === "customers"
              ? isLoadingCustomers
              : isLoadingDashboard)
              ? "Actualisation..."
              : "Actualiser"}
          </button>
        </header>

        {dashboardError && activeView !== "customers" && (
          <div className="admin-global-error">
            <p>{dashboardError}</p>

            <button type="button" onClick={() => loadDashboard()}>
              Réessayer
            </button>
          </div>
        )}

        {activeView === "overview" && (
          <section className="admin-stats">
            {visibleStats.map((stat) => (
              <article key={stat.label} className="admin-stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <p>{stat.helper}</p>
              </article>
            ))}
          </section>
        )}

        {(activeView === "overview" ||
  activeView === "reservations") && (
          <section className="admin-bookings-section">
            <div className="admin-section-heading">
              <div>
                <span>Gestion</span>
                <h2>
  {activeView === "overview"
    ? "Réservations récentes"
    : "Toutes les réservations"}
</h2>
              </div>

              <span className="admin-results-count">
                {bookings.length} résultat
                {bookings.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="admin-booking-tools">
              <form className="admin-search" onSubmit={handleSearchSubmit}>
                <input
                  type="search"
                  placeholder="Référence, client, hôtel..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />

                {activeSearch && (
                  <button
                    type="button"
                    className="admin-clear-search"
                    onClick={clearSearch}
                  >
                    Effacer
                  </button>
                )}

                <button type="submit">Rechercher</button>
              </form>

              <select
                className="admin-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value || "all"} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            {activeView === "reservations" && (
  <div className="admin-booking-tools">
    <form
      className="admin-search"
      onSubmit={handleSearchSubmit}
    >
      <input
        type="search"
        placeholder="Référence, client, hôtel..."
        value={searchInput}
        onChange={(event) =>
          setSearchInput(event.target.value)
        }
      />


      {activeSearch && (
        <button
          type="button"
          className="admin-clear-search"
          onClick={clearSearch}
        >
          Effacer
        </button>
      )}


      <button type="submit">
        Rechercher
      </button>
    </form>


    <select
      className="admin-status-filter"
      value={statusFilter}
      onChange={(event) =>
        setStatusFilter(event.target.value)
      }
    >
      {STATUS_OPTIONS.map((status) => (
        <option
          key={status.value || "all"}
          value={status.value}
        >
          {status.label}
        </option>
      ))}
    </select>
  </div>
)}

            <div className="admin-table-wrapper">
              {isLoadingDashboard ? (
                <div className="admin-table-state">
                  <span className="admin-loader"></span>
                  <p>Chargement des réservations...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="admin-table-state">
                  <h3>Aucune réservation trouvée</h3>
                  <p>Modifiez la recherche ou le filtre utilisé.</p>
                </div>
              ) : (
                <table className="admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Client</th>
                      <th>Destination</th>
                      <th>Arrivée</th>
                      <th>Statut</th>
                      <th aria-label="Actions"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {(
  activeView === "overview"
    ? bookings.slice(0, 5)
    : bookings
).map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <span className="admin-reference">
                            {booking.reference}
                          </span>
                        </td>

                        <td>
                          <strong>{booking.customer.fullName}</strong>
                          <span>{booking.customer.email}</span>
                        </td>

                        <td>
                          <strong>{booking.destination.name}</strong>
                          <span>{booking.destination.location}</span>
                        </td>

                        <td>
                          <strong>{formatDate(booking.checkIn)}</strong>
                          <span>
                            {booking.adults + booking.children} voyageur
                            {booking.adults + booking.children > 1 ? "s" : ""}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-status-badge ${booking.status}`}
                          >
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-view-button"
                            onClick={() => openBooking(booking)}
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeView === "customers" && (
          <section className="admin-customers-section">
            <div className="admin-section-heading">
              <div>
                <span>Base clients</span>
                <h2>Clients enregistrés</h2>
              </div>

              <span className="admin-results-count">
                {filteredCustomers.length} client
                {filteredCustomers.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="admin-customer-tools">
              <input
                type="search"
                className="admin-customer-search"
                placeholder="Nom, e-mail, téléphone..."
                value={customerSearchInput}
                onChange={(event) =>
                  setCustomerSearchInput(event.target.value)
                }
              />
            </div>

            {customersError && (
              <div className="admin-global-error">
                <p>{customersError}</p>

                <button type="button" onClick={loadCustomers}>
                  Réessayer
                </button>
              </div>
            )}

            <div className="admin-table-wrapper">
              {isLoadingCustomers ? (
                <div className="admin-table-state">
                  <span className="admin-loader"></span>
                  <p>Chargement des clients...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="admin-table-state">
                  <h3>Aucun client trouvé</h3>
                  <p>Modifiez votre recherche.</p>
                </div>
              ) : (
                <table className="admin-customers-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Téléphone</th>
                      <th>Inscription</th>
                      <th>Réservations</th>
                      <th aria-label="Actions"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <strong>{customer.fullName}</strong>
                          <span>{customer.email}</span>
                        </td>

                        <td>{customer.phone || "Non renseigné"}</td>

                        <td>{formatDate(customer.createdAt)}</td>

                        <td>
                          <span className="admin-customer-count">
                            {customer.bookingCount}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-view-button"
                            onClick={() => openCustomer(customer)}
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </section>

      <div
        className={`admin-drawer-backdrop ${
          selectedBooking ? "is-visible" : ""
        }`}
        onClick={closeBookingPanel}
        aria-hidden="true"
      />

      <aside
        className={`admin-booking-drawer ${selectedBooking ? "is-open" : ""}`}
        aria-hidden={!selectedBooking}
      >
        {selectedBooking && (
          <>
            <header className="admin-drawer-header">
              <div>
                <span>Détails de la demande</span>
                <h2>{selectedBooking.reference}</h2>
              </div>

              <button
                type="button"
                onClick={closeBookingPanel}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            <div className="admin-drawer-content">
              <section>
                <span className="admin-detail-label">Client</span>

                <h3>{selectedBooking.customer.fullName}</h3>

                <dl className="admin-detail-list">
                  <div>
                    <dt>Adresse e-mail</dt>
                    <dd>{selectedBooking.customer.email}</dd>
                  </div>

                  <div>
                    <dt>Téléphone</dt>
                    <dd>{selectedBooking.customer.phone}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <span className="admin-detail-label">Séjour</span>

                <h3>{selectedBooking.destination.name}</h3>

                <p className="admin-detail-location">
                  {selectedBooking.destination.location}
                </p>

                <dl className="admin-detail-list two-columns">
                  <div>
                    <dt>Arrivée</dt>
                    <dd>{formatDate(selectedBooking.checkIn)}</dd>
                  </div>

                  <div>
                    <dt>Départ</dt>
                    <dd>{formatDate(selectedBooking.checkOut)}</dd>
                  </div>

                  <div>
                    <dt>Adultes</dt>
                    <dd>{selectedBooking.adults}</dd>
                  </div>

                  <div>
                    <dt>Enfants</dt>
                    <dd>{selectedBooking.children}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <span className="admin-detail-label">Demande</span>

                <dl className="admin-detail-list">
                  <div>
                    <dt>Estimation</dt>
                    <dd>{formatFcfa(selectedBooking.estimatedTotalFcfa)}</dd>
                  </div>

                  <div>
                    <dt>Méthode de contact</dt>
                    <dd>
                      {selectedBooking.contactMethod === "whatsapp"
                        ? "WhatsApp"
                        : "Appel"}
                    </dd>
                  </div>

                  <div>
                    <dt>Créée le</dt>
                    <dd>{formatDateTime(selectedBooking.createdAt)}</dd>
                  </div>
                </dl>

                <div className="admin-special-request">
                  <span>Demande particulière</span>
                  <p>
                    {selectedBooking.specialRequest ||
                      "Aucune demande particulière."}
                  </p>
                </div>
              </section>

              <section className="admin-status-editor">
                <label htmlFor="booking-status">
                  Statut de la réservation
                </label>

                <select
                  id="booking-status"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                >
                  {STATUS_OPTIONS.filter((status) => status.value).map(
                    (status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ),
                  )}
                </select>

                {actionMessage.text && (
                  <p className={`admin-action-message ${actionMessage.type}`}>
                    {actionMessage.text}
                  </p>
                )}

                <button
                  type="button"
                  className="admin-save-status"
                  onClick={updateBookingStatus}
                  disabled={
                    isUpdatingStatus ||
                    selectedStatus === selectedBooking.status
                  }
                >
                  {isUpdatingStatus
                    ? "Enregistrement..."
                    : "Enregistrer le statut"}
                </button>
              </section>
            </div>
          </>
        )}
      </aside>

      <div
        className={`admin-drawer-backdrop ${
          selectedCustomer ? "is-visible" : ""
        }`}
        onClick={closeCustomerPanel}
        aria-hidden="true"
      />

      <aside
        className={`admin-booking-drawer admin-customer-drawer ${
          selectedCustomer ? "is-open" : ""
        }`}
        aria-hidden={!selectedCustomer}
      >
        {selectedCustomer && (
          <>
            <header className="admin-drawer-header">
              <div>
                <span>Profil client</span>
                <h2>{selectedCustomer.fullName}</h2>
              </div>

              <button
                type="button"
                onClick={closeCustomerPanel}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            <div className="admin-drawer-content">
              <section>
                <span className="admin-detail-label">Coordonnées</span>

                <dl className="admin-detail-list">
                  <div>
                    <dt>Adresse e-mail</dt>
                    <dd>{selectedCustomer.email}</dd>
                  </div>

                  <div>
                    <dt>Téléphone</dt>
                    <dd>{selectedCustomer.phone || "Non renseigné"}</dd>
                  </div>

                  <div>
                    <dt>Compte créé le</dt>
                    <dd>{formatDate(selectedCustomer.createdAt)}</dd>
                  </div>
                </dl>
                <div className="admin-customer-actions">
  <a href={`mailto:${selectedCustomer.email}`}>
    Envoyer un e-mail
  </a>


  {selectedCustomer.phone && (
    <a href={`tel:${selectedCustomer.phone}`}>
      Appeler
    </a>
  )}


  {selectedCustomer.phone && (
    <a
      href={`https://wa.me/${selectedCustomer.phone.replace(
        /\D/g,
        "",
      )}`}
      target="_blank"
      rel="noreferrer"
    >
      WhatsApp
    </a>
  )}
</div>

              </section>

              <section className="admin-status-editor">
                <span className="admin-detail-label">
                  Historique des réservations (
                  {selectedCustomerBookings.length})
                </span>

                {selectedCustomerBookings.length === 0 ? (
                  <p className="admin-customer-empty">
                    Aucune réservation enregistrée pour ce client.
                  </p>
                ) : (
                  <ul className="admin-customer-history">
                    {selectedCustomerBookings.map((booking) => (
                      <li key={booking.id}>
                        <div className="admin-history-top">
                          <span className="admin-reference">
                            {booking.reference}
                          </span>

                          <span
                            className={`admin-status-badge ${booking.status}`}
                          >
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </div>

                        <strong>{booking.destination.name}</strong>

                        <span className="admin-history-meta">
                          {formatDate(booking.checkIn)} ·{" "}
                          {formatFcfa(booking.estimatedTotalFcfa)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}

export default Admin;
