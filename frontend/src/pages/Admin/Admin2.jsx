import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  adminApi,
  authApi,
  clearSession,
  getToken,
} from "../../services/api";
import "./Admin.css";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "Tous les statuts",
  },
  {
    value: "pending",
    label: "En attente",
  },
  {
    value: "contacted",
    label: "Contactée",
  },
  {
    value: "confirmed",
    label: "Confirmée",
  },
  {
    value: "cancelled",
    label: "Annulée",
  },
  {
    value: "completed",
    label: "Terminée",
  },
];

const STATUS_LABELS = {
  pending: "En attente",
  contacted: "Contactée",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

function formatFcfa(amount) {
  if (
    amount === null ||
    amount === undefined
  ) {
    return "À déterminer";
  }

  return `${new Intl.NumberFormat(
    "fr-FR",
  ).format(amount)} FCFA`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }

  const normalizedDate = String(
    dateValue,
  ).slice(0, 10);

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(
      `${normalizedDate}T12:00:00`,
    ),
  );
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(dateValue));
}

function Admin() {
  const navigate = useNavigate();

  const [accessState, setAccessState] =
    useState("checking");

  const [adminUser, setAdminUser] =
    useState(null);

  const [activeView, setActiveView] =
    useState("dashboard");

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    contactedBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalCustomers: 0,
  });

  const [
    dashboardBookings,
    setDashboardBookings,
  ] = useState([]);

  const [bookings, setBookings] =
    useState([]);

  const [
    selectedBooking,
    setSelectedBooking,
  ] = useState(null);

  const [searchInput, setSearchInput] =
    useState("");

  const [activeSearch, setActiveSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [
    isLoadingDashboard,
    setIsLoadingDashboard,
  ] = useState(true);

  const [
    isLoadingBookings,
    setIsLoadingBookings,
  ] = useState(false);

  const [
    isUpdatingStatus,
    setIsUpdatingStatus,
  ] = useState(false);

  const [
    dashboardError,
    setDashboardError,
  ] = useState("");

  const [
    bookingsError,
    setBookingsError,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState({
    type: "",
    text: "",
  });

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  const [customers, setCustomers] =
    useState([]);

  const [allBookings, setAllBookings] =
    useState([]);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null);

  const [
    customerSearchInput,
    setCustomerSearchInput,
  ] = useState("");

  const [
    isLoadingCustomers,
    setIsLoadingCustomers,
  ] = useState(false);

  const [
    hasLoadedCustomers,
    setHasLoadedCustomers,
  ] = useState(false);

  const [
    customersError,
    setCustomersError,
  ] = useState("");

  const handleUnauthorizedSession =
    useCallback(() => {
      clearSession();

      setAdminUser(null);

      setAccessState(
        "unauthenticated",
      );
    }, []);

  const apiRequest = useCallback(
    async (requestFunction) => {
      try {
        return await requestFunction();
      } catch (error) {
        if (error.status === 401) {
          handleUnauthorizedSession();
        } else if (
          error.status === 403
        ) {
          setAccessState(
            "forbidden",
          );
        }

        throw error;
      }
    },
    [
      handleUnauthorizedSession,
    ],
  );

  const verifyAdminAccess =
    useCallback(async () => {
      if (!getToken()) {
        setAccessState(
          "unauthenticated",
        );

        return;
      }

      try {
        const data =
          await authApi.me();

        if (
          data.user.role !== "admin"
        ) {
          setAccessState(
            "forbidden",
          );

          return;
        }

        setAdminUser(data.user);

        setAccessState(
          "authorized",
        );
      } catch {
        handleUnauthorizedSession();
      }
    }, [
      handleUnauthorizedSession,
    ]);

  const loadDashboardStats =
    useCallback(async () => {
      const data =
        await apiRequest(() =>
          adminApi.stats(),
        );

      setStats(data.stats);
    }, [apiRequest]);

  const loadDashboardBookings =
    useCallback(async () => {
      const data =
        await apiRequest(() =>
          adminApi.bookings(),
        );

      setDashboardBookings(
        data.bookings || [],
      );
    }, [apiRequest]);

  const loadDashboard =
    useCallback(
      async (
        showLoader = true,
      ) => {
        if (showLoader) {
          setIsLoadingDashboard(
            true,
          );
        }

        setDashboardError("");

        try {
          await Promise.all([
            loadDashboardStats(),
            loadDashboardBookings(),
          ]);
        } catch (error) {
          setDashboardError(
            error.message ||
              "Impossible de charger le tableau de bord.",
          );
        } finally {
          if (showLoader) {
            setIsLoadingDashboard(
              false,
            );
          }
        }
      },
      [
        loadDashboardBookings,
        loadDashboardStats,
      ],
    );

  const loadReservations =
    useCallback(
      async (
        showLoader = true,
      ) => {
        if (showLoader) {
          setIsLoadingBookings(
            true,
          );
        }

        setBookingsError("");

        try {
          const data =
            await apiRequest(() =>
              adminApi.bookings({
                status:
                  statusFilter,
                search:
                  activeSearch,
              }),
            );

          setBookings(
            data.bookings || [],
          );

          setSelectedBooking(
            (
              currentBooking,
            ) => {
              if (
                !currentBooking
              ) {
                return null;
              }

              return (
                (
                  data.bookings ||
                  []
                ).find(
                  (booking) =>
                    booking.id ===
                    currentBooking.id,
                ) || null
              );
            },
          );
        } catch (error) {
          setBookingsError(
            error.message ||
              "Impossible de charger les réservations.",
          );
        } finally {
          if (showLoader) {
            setIsLoadingBookings(
              false,
            );
          }
        }
      },
      [
        activeSearch,
        apiRequest,
        statusFilter,
      ],
    );

  const loadCustomers =
    useCallback(async () => {
      setIsLoadingCustomers(true);

      setCustomersError("");

      try {
        const [
          customersData,
          bookingsData,
        ] = await Promise.all([
          apiRequest(() =>
            adminApi.customers(),
          ),
          apiRequest(() =>
            adminApi.bookings(),
          ),
        ]);

        setCustomers(
          customersData.customers ||
            [],
        );

        setAllBookings(
          bookingsData.bookings ||
            [],
        );

        setHasLoadedCustomers(true);
      } catch (error) {
        setCustomersError(
          error.message ||
            "Impossible de charger les clients.",
        );
      } finally {
        setIsLoadingCustomers(
          false,
        );
      }
    }, [apiRequest]);

  useEffect(() => {
    verifyAdminAccess();
  }, [verifyAdminAccess]);

  useEffect(() => {
    if (
      accessState !==
      "authorized"
    ) {
      return undefined;
    }

    loadDashboard();

    const refreshInterval =
      window.setInterval(() => {
        loadDashboard(false);

        if (
          activeView ===
          "reservations"
        ) {
          loadReservations(
            false,
          );
        }
      }, 20000);

    return () => {
      window.clearInterval(
        refreshInterval,
      );
    };
  }, [
    accessState,
    activeView,
    loadDashboard,
    loadReservations,
  ]);

  useEffect(() => {
    if (
      accessState !==
        "authorized" ||
      activeView !==
        "reservations"
    ) {
      return;
    }

    loadReservations();
  }, [
    accessState,
    activeView,
    loadReservations,
  ]);

  useEffect(() => {
    if (
      accessState !==
        "authorized" ||
      activeView !==
        "customers" ||
      hasLoadedCustomers
    ) {
      return;
    }

    loadCustomers();
  }, [
    accessState,
    activeView,
    hasLoadedCustomers,
    loadCustomers,
  ]);

  useEffect(() => {
    if (selectedBooking) {
      setSelectedStatus(
        selectedBooking.status,
      );
    }
  }, [selectedBooking]);

  const visibleStats =
    useMemo(
      () => [
        {
          label: "À traiter",
          value:
            stats.pendingBookings,
          helper:
            "Nouvelles demandes",
        },
        {
          label: "Contactées",
          value:
            stats.contactedBookings,
          helper:
            "Suivi en cours",
        },
        {
          label: "Confirmées",
          value:
            stats.confirmedBookings,
          helper:
            "Séjours validés",
        },
        {
          label: "Clients",
          value:
            stats.totalCustomers,
          helper:
            "Comptes enregistrés",
        },
      ],
      [stats],
    );

  const priorityBookings =
    useMemo(
      () =>
        dashboardBookings
          .filter(
            (booking) =>
              booking.status ===
              "pending",
          )
          .slice(0, 4),
      [dashboardBookings],
    );

  const recentBookings =
    useMemo(
      () =>
        dashboardBookings.slice(
          0,
          5,
        ),
      [dashboardBookings],
    );

  const filteredCustomers =
    useMemo(() => {
      const term =
        customerSearchInput
          .trim()
          .toLowerCase();

      if (!term) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          [
            customer.fullName,
            customer.email,
            customer.phone,
          ]
            .filter(Boolean)
            .some((field) =>
              field
                .toLowerCase()
                .includes(term),
            ),
      );
    }, [
      customers,
      customerSearchInput,
    ]);

  const selectedCustomerBookings =
    useMemo(() => {
      if (!selectedCustomer) {
        return [];
      }

      return allBookings.filter(
        (booking) =>
          booking.userId ===
          selectedCustomer.id,
      );
    }, [
      allBookings,
      selectedCustomer,
    ]);

  function handleSearchSubmit(
    event,
  ) {
    event.preventDefault();

    setActiveSearch(
      searchInput.trim(),
    );
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

    setIsMobileMenuOpen(false);
  }

  async function updateBookingStatus() {
    if (
      !selectedBooking ||
      !selectedStatus ||
      selectedStatus ===
        selectedBooking.status
    ) {
      return;
    }

    setIsUpdatingStatus(true);

    setActionMessage({
      type: "",
      text: "",
    });

    try {
      const data =
        await apiRequest(() =>
          adminApi.updateBookingStatus(
            selectedBooking.id,
            selectedStatus,
          ),
        );

      setSelectedBooking(
        data.booking,
      );

      setBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id ===
              data.booking.id
                ? data.booking
                : booking,
          ),
      );

      setDashboardBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id ===
              data.booking.id
                ? data.booking
                : booking,
          ),
      );

      setAllBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id ===
              data.booking.id
                ? data.booking
                : booking,
          ),
      );

      await loadDashboardStats();

      setActionMessage({
        type: "success",
        text:
          "Le statut a été mis à jour.",
      });
    } catch (error) {
      setActionMessage({
        type: "error",
        text:
          error.message ||
          "Impossible de modifier le statut.",
      });
    } finally {
      setIsUpdatingStatus(
        false,
      );
    }
  }

  function handleRefresh() {
    if (
      activeView === "dashboard"
    ) {
      loadDashboard();

      return;
    }

    if (
      activeView ===
      "reservations"
    ) {
      loadReservations();

      return;
    }

    loadCustomers();
  }

  function handleLogout() {
    clearSession();

    navigate("/account", {
      replace: true,
    });
  }

  if (
    accessState === "checking"
  ) {
    return (
      <main className="admin-access-page">
        <div className="admin-access-message">
          <span className="admin-loader" />

          <p>
            Vérification de votre
            accès...
          </p>
        </div>
      </main>
    );
  }

  if (
    accessState ===
    "unauthenticated"
  ) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  if (
    accessState === "forbidden"
  ) {
    return (
      <main className="admin-access-page">
        <div className="admin-access-denied">
          <span>403</span>

          <h1>
            Accès refusé
          </h1>

          <p>
            Cette page est réservée
            à l’administration de
            STAY.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/account",
              )
            }
          >
            Retourner à mon compte
          </button>
        </div>
      </main>
    );
  }

  const isRefreshing =
    activeView === "dashboard"
      ? isLoadingDashboard
      : activeView ===
          "reservations"
        ? isLoadingBookings
        : isLoadingCustomers;

  return (
    <main className="admin-page">
      <div className="admin-mobile-header">
        <div>
          <span className="admin-mobile-logo">
            STAY
          </span>

          <span className="admin-mobile-label">
            Administration
          </span>
        </div>

        <button
          type="button"
          className="admin-menu-toggle"
          aria-label="Ouvrir le menu"
          aria-expanded={
            isMobileMenuOpen
          }
          onClick={() =>
            setIsMobileMenuOpen(
              (current) =>
                !current,
            )
          }
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={`admin-sidebar-backdrop ${
          isMobileMenuOpen
            ? "is-visible"
            : ""
        }`}
        onClick={() =>
          setIsMobileMenuOpen(
            false,
          )
        }
        aria-hidden="true"
      />

      <aside
        className={`admin-sidebar ${
          isMobileMenuOpen
            ? "is-open"
            : ""
        }`}
      >
        <div className="admin-sidebar-brand">
          <span className="admin-logo">
            STAY
          </span>

          <span className="admin-logo-label">
            Administration
          </span>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={
              activeView ===
              "dashboard"
                ? "is-active"
                : ""
            }
            onClick={() =>
              handleViewChange(
                "dashboard",
              )
            }
          >
            Tableau de bord

            <span>01</span>
          </button>

          <button
            type="button"
            className={
              activeView ===
              "reservations"
                ? "is-active"
                : ""
            }
            onClick={() =>
              handleViewChange(
                "reservations",
              )
            }
          >
            Réservations

            <span>02</span>
          </button>

          <button
            type="button"
            className={
              activeView ===
              "customers"
                ? "is-active"
                : ""
            }
            onClick={() =>
              handleViewChange(
                "customers",
              )
            }
          >
            Clients

            <span>03</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div>
            <span>
              Connecté en tant que
            </span>

            <strong>
              {adminUser?.fullName ||
                "Administrateur"}
            </strong>

            <small>
              Super Admin
            </small>
          </div>

          <button
            type="button"
            onClick={handleLogout}
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div className="admin-header-copy">
            <span className="admin-header-eyebrow">
              {activeView ===
                "dashboard" &&
                "TABLEAU DE BORD"}

              {activeView ===
                "reservations" &&
                "RÉSERVATIONS"}

              {activeView ===
                "customers" &&
                "CLIENTS"}
            </span>

            <h1>
              {activeView ===
                "dashboard" && (
                <>
                  Bonjour,
                  <span>
                    {" "}
                    {adminUser?.fullName ||
                      "Administrateur"}
                    .
                  </span>
                </>
              )}

              {activeView ===
                "reservations" &&
                "Réservations"}

              {activeView ===
                "customers" &&
                "Clients"}
            </h1>

            <p>
              {activeView ===
                "dashboard" &&
                "Voici ce qui demande votre attention aujourd’hui."}

              {activeView ===
                "reservations" &&
                "Consultez et gérez toutes les demandes de réservation."}

              {activeView ===
                "customers" &&
                "Retrouvez les clients STAY et leur historique."}
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={
              handleRefresh
            }
            disabled={
              isRefreshing
            }
          >
            {isRefreshing
              ? "Actualisation..."
              : "Actualiser"}
          </button>
        </header>

        {activeView ===
          "dashboard" && (
          <DashboardView
            stats={stats}
            visibleStats={
              visibleStats
            }
            priorityBookings={
              priorityBookings
            }
            recentBookings={
              recentBookings
            }
            isLoading={
              isLoadingDashboard
            }
            error={
              dashboardError
            }
            onReload={
              loadDashboard
            }
            onOpenBooking={
              openBooking
            }
            onViewReservations={() =>
              handleViewChange(
                "reservations",
              )
            }
          />
        )}

        {activeView ===
          "reservations" && (
          <ReservationsView
            bookings={bookings}
            searchInput={
              searchInput
            }
            activeSearch={
              activeSearch
            }
            statusFilter={
              statusFilter
            }
            isLoading={
              isLoadingBookings
            }
            error={bookingsError}
            onSearchInputChange={
              setSearchInput
            }
            onSearchSubmit={
              handleSearchSubmit
            }
            onClearSearch={
              clearSearch
            }
            onStatusChange={
              setStatusFilter
            }
            onReload={
              loadReservations
            }
            onOpenBooking={
              openBooking
            }
          />
        )}

        {activeView ===
          "customers" && (
          <CustomersView
            customers={
              filteredCustomers
            }
            searchInput={
              customerSearchInput
            }
            isLoading={
              isLoadingCustomers
            }
            error={customersError}
            onSearchChange={
              setCustomerSearchInput
            }
            onReload={
              loadCustomers
            }
            onOpenCustomer={
              openCustomer
            }
          />
        )}
      </section>

      <BookingDrawer
        booking={selectedBooking}
        selectedStatus={
          selectedStatus
        }
        actionMessage={
          actionMessage
        }
        isUpdatingStatus={
          isUpdatingStatus
        }
        onStatusChange={
          setSelectedStatus
        }
        onSaveStatus={
          updateBookingStatus
        }
        onClose={
          closeBookingPanel
        }
      />

      <CustomerDrawer
        customer={
          selectedCustomer
        }
        bookings={
          selectedCustomerBookings
        }
        onClose={
          closeCustomerPanel
        }
      />
    </main>
  );
}

function DashboardView({
  stats,
  visibleStats,
  priorityBookings,
  recentBookings,
  isLoading,
  error,
  onReload,
  onOpenBooking,
  onViewReservations,
}) {
  if (error) {
    return (
      <div className="admin-global-error">
        <p>{error}</p>

        <button
          type="button"
          onClick={() =>
            onReload()
          }
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="admin-dashboard-meta">
        <span>
          {stats.totalBookings}{" "}
          réservation
          {stats.totalBookings !== 1
            ? "s"
            : ""}{" "}
          enregistrée
          {stats.totalBookings !== 1
            ? "s"
            : ""}
        </span>
      </section>

      <section className="admin-stats">
        {visibleStats.map(
          (stat, index) => (
            <article
              key={stat.label}
              className="admin-stat-card"
            >
              <span className="admin-stat-index">
                {String(
                  index + 1,
                ).padStart(
                  2,
                  "0",
                )}
              </span>

              <div>
                <span>
                  {stat.label}
                </span>

                <strong>
                  {stat.value}
                </strong>

                <p>
                  {stat.helper}
                </p>
              </div>
            </article>
          ),
        )}
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-dashboard-section">
          <div className="admin-section-heading">
            <div>
              <span>
                Priorité
              </span>

              <h2>
                À traiter maintenant
              </h2>
            </div>

            <span className="admin-results-count">
              {
                priorityBookings.length
              }{" "}
              demande
              {priorityBookings.length !==
              1
                ? "s"
                : ""}
            </span>
          </div>

          {isLoading ? (
            <AdminLoadingState text="Chargement des demandes..." />
          ) : priorityBookings.length ===
            0 ? (
            <div className="admin-empty-state">
              <span>00</span>

              <div>
                <h3>
                  Rien d’urgent pour le
                  moment.
                </h3>

                <p>
                  Toutes les nouvelles
                  demandes ont été
                  traitées.
                </p>
              </div>
            </div>
          ) : (
            <div className="admin-priority-list">
              {priorityBookings.map(
                (
                  booking,
                  index,
                ) => (
                  <BookingRow
                    key={
                      booking.id
                    }
                    booking={
                      booking
                    }
                    index={
                      index
                    }
                    onOpen={
                      onOpenBooking
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>

        <aside className="admin-dashboard-summary">
          <div className="admin-section-heading">
            <div>
              <span>
                Activité
              </span>

              <h2>
                Dernières demandes
              </h2>
            </div>
          </div>

          <div className="admin-recent-list">
            {recentBookings
              .slice(0, 4)
              .map(
                (booking) => (
                  <button
                    key={
                      booking.id
                    }
                    type="button"
                    onClick={() =>
                      onOpenBooking(
                        booking,
                      )
                    }
                  >
                    <div>
                      <strong>
                        {
                          booking
                            .customer
                            .fullName
                        }
                      </strong>

                      <span>
                        {
                          booking
                            .destination
                            .name
                        }
                      </span>
                    </div>

                    <span
                      className={`admin-status-badge ${booking.status}`}
                    >
                      {STATUS_LABELS[
                        booking
                          .status
                      ] ||
                        booking.status}
                    </span>
                  </button>
                ),
              )}
          </div>

          <button
            type="button"
            className="admin-text-link"
            onClick={
              onViewReservations
            }
          >
            Voir toutes les
            réservations
            <span>↗</span>
          </button>
        </aside>
      </div>
    </>
  );
}

function ReservationsView({
  bookings,
  searchInput,
  activeSearch,
  statusFilter,
  isLoading,
  error,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  onStatusChange,
  onReload,
  onOpenBooking,
}) {
  return (
    <section className="admin-content-section">
      <div className="admin-section-heading">
        <div>
          <span>Gestion</span>

          <h2>
            Toutes les réservations
          </h2>
        </div>

        <span className="admin-results-count">
          {bookings.length} résultat
          {bookings.length !== 1
            ? "s"
            : ""}
        </span>
      </div>

      <div className="admin-booking-tools">
        <form
          className="admin-search"
          onSubmit={
            onSearchSubmit
          }
        >
          <input
            type="search"
            placeholder="Référence, client, hôtel..."
            value={searchInput}
            onChange={(event) =>
              onSearchInputChange(
                event.target.value,
              )
            }
          />

          {activeSearch && (
            <button
              type="button"
              className="admin-clear-search"
              onClick={
                onClearSearch
              }
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
            onStatusChange(
              event.target.value,
            )
          }
        >
          {STATUS_OPTIONS.map(
            (status) => (
              <option
                key={
                  status.value ||
                  "all"
                }
                value={
                  status.value
                }
              >
                {status.label}
              </option>
            ),
          )}
        </select>
      </div>

      {error && (
        <div className="admin-global-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              onReload()
            }
          >
            Réessayer
          </button>
        </div>
      )}

      {isLoading ? (
        <AdminLoadingState text="Chargement des réservations..." />
      ) : bookings.length === 0 ? (
        <div className="admin-large-empty-state">
          <span>00</span>

          <h3>
            Aucune réservation
            trouvée.
          </h3>

          <p>
            Modifiez votre recherche
            ou le filtre sélectionné.
          </p>
        </div>
      ) : (
        <BookingCollection
          bookings={bookings}
          onOpenBooking={
            onOpenBooking
          }
        />
      )}
    </section>
  );
}

function CustomersView({
  customers,
  searchInput,
  isLoading,
  error,
  onSearchChange,
  onReload,
  onOpenCustomer,
}) {
  return (
    <section className="admin-content-section">
      <div className="admin-section-heading">
        <div>
          <span>
            Base clients
          </span>

          <h2>
            Clients enregistrés
          </h2>
        </div>

        <span className="admin-results-count">
          {customers.length} client
          {customers.length !== 1
            ? "s"
            : ""}
        </span>
      </div>

      <div className="admin-customer-tools">
        <input
          type="search"
          className="admin-customer-search"
          placeholder="Nom, e-mail, téléphone..."
          value={searchInput}
          onChange={(event) =>
            onSearchChange(
              event.target.value,
            )
          }
        />
      </div>

      {error && (
        <div className="admin-global-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={onReload}
          >
            Réessayer
          </button>
        </div>
      )}

      {isLoading ? (
        <AdminLoadingState text="Chargement des clients..." />
      ) : customers.length === 0 ? (
        <div className="admin-large-empty-state">
          <span>00</span>

          <h3>
            Aucun client trouvé.
          </h3>

          <p>
            Modifiez votre recherche.
          </p>
        </div>
      ) : (
        <CustomerCollection
          customers={customers}
          onOpenCustomer={
            onOpenCustomer
          }
        />
      )}
    </section>
  );
}

function BookingCollection({
  bookings,
  onOpenBooking,
}) {
  return (
    <div className="admin-collection">
      <div className="admin-desktop-table">
        <table className="admin-bookings-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Destination</th>
              <th>Arrivée</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {bookings.map(
              (booking) => (
                <tr
                  key={booking.id}
                >
                  <td>
                    <span className="admin-reference">
                      {
                        booking.reference
                      }
                    </span>
                  </td>

                  <td>
                    <strong>
                      {
                        booking
                          .customer
                          .fullName
                      }
                    </strong>

                    <span>
                      {
                        booking
                          .customer
                          .email
                      }
                    </span>
                  </td>

                  <td>
                    <strong>
                      {
                        booking
                          .destination
                          .name
                      }
                    </strong>

                    <span>
                      {
                        booking
                          .destination
                          .location
                      }
                    </span>
                  </td>

                  <td>
                    <strong>
                      {formatDate(
                        booking.checkIn,
                      )}
                    </strong>

                    <span>
                      {booking.adults +
                        booking.children}{" "}
                      voyageur
                      {booking.adults +
                        booking.children >
                      1
                        ? "s"
                        : ""}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-status-badge ${booking.status}`}
                    >
                      {STATUS_LABELS[
                        booking
                          .status
                      ] ||
                        booking.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="admin-view-button"
                      onClick={() =>
                        onOpenBooking(
                          booking,
                        )
                      }
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-mobile-cards">
        {bookings.map(
          (booking, index) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              index={index}
              onOpen={
                onOpenBooking
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

function BookingRow({
  booking,
  index,
  onOpen,
}) {
  return (
    <article className="admin-booking-row">
      <span className="admin-booking-index">
        {String(index + 1).padStart(
          2,
          "0",
        )}
      </span>

      <div className="admin-booking-row-main">
        <div className="admin-booking-row-top">
          <div>
            <span className="admin-reference">
              {booking.reference}
            </span>

            <h3>
              {
                booking.destination
                  .name
              }
            </h3>

            <p>
              {
                booking.customer
                  .fullName
              }
            </p>
          </div>

          <span
            className={`admin-status-badge ${booking.status}`}
          >
            {STATUS_LABELS[
              booking.status
            ] || booking.status}
          </span>
        </div>

        <div className="admin-booking-row-bottom">
          <span>
            {formatDate(
              booking.checkIn,
            )}
          </span>

          <button
            type="button"
            onClick={() =>
              onOpen(booking)
            }
          >
            Ouvrir
            <span>↗</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function CustomerCollection({
  customers,
  onOpenCustomer,
}) {
  return (
    <div className="admin-collection">
      <div className="admin-desktop-table">
        <table className="admin-customers-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Inscription</th>
              <th>Réservations</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {customers.map(
              (customer) => (
                <tr
                  key={customer.id}
                >
                  <td>
                    <strong>
                      {
                        customer.fullName
                      }
                    </strong>

                    <span>
                      {
                        customer.email
                      }
                    </span>
                  </td>

                  <td>
                    {customer.phone ||
                      "Non renseigné"}
                  </td>

                  <td>
                    {formatDate(
                      customer.createdAt,
                    )}
                  </td>

                  <td>
                    <span className="admin-customer-count">
                      {
                        customer.bookingCount
                      }
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="admin-view-button"
                      onClick={() =>
                        onOpenCustomer(
                          customer,
                        )
                      }
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-mobile-cards">
        {customers.map(
          (customer, index) => (
            <article
              key={customer.id}
              className="admin-customer-card"
            >
              <span className="admin-booking-index">
                {String(
                  index + 1,
                ).padStart(
                  2,
                  "0",
                )}
              </span>

              <div>
                <strong>
                  {
                    customer.fullName
                  }
                </strong>

                <span>
                  {customer.email}
                </span>

                <p>
                  {
                    customer.bookingCount
                  }{" "}
                  réservation
                  {customer.bookingCount !==
                  1
                    ? "s"
                    : ""}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    onOpenCustomer(
                      customer,
                    )
                  }
                >
                  Voir le profil
                  <span>↗</span>
                </button>
              </div>
            </article>
          ),
        )}
      </div>
    </div>
  );
}

function AdminLoadingState({
  text,
}) {
  return (
    <div className="admin-table-state">
      <span className="admin-loader" />

      <p>{text}</p>
    </div>
  );
}

function BookingDrawer({
  booking,
  selectedStatus,
  actionMessage,
  isUpdatingStatus,
  onStatusChange,
  onSaveStatus,
  onClose,
}) {
  return (
    <>
      <div
        className={`admin-drawer-backdrop ${
          booking
            ? "is-visible"
            : ""
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`admin-booking-drawer ${
          booking
            ? "is-open"
            : ""
        }`}
        aria-hidden={!booking}
      >
        {booking && (
          <>
            <header className="admin-drawer-header">
              <div>
                <span>
                  Détails de la
                  demande
                </span>

                <h2>
                  {booking.reference}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            <div className="admin-drawer-content">
              <section>
                <span className="admin-detail-label">
                  Client
                </span>

                <h3>
                  {
                    booking.customer
                      .fullName
                  }
                </h3>

                <dl className="admin-detail-list">
                  <div>
                    <dt>
                      Adresse e-mail
                    </dt>

                    <dd>
                      {
                        booking
                          .customer
                          .email
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Téléphone
                    </dt>

                    <dd>
                      {
                        booking
                          .customer
                          .phone
                      }
                    </dd>
                  </div>
                </dl>

                <div className="admin-customer-actions">
                  <a
                    href={`mailto:${booking.customer.email}`}
                  >
                    E-mail
                  </a>

                  {booking.customer
                    .phone && (
                    <>
                      <a
                        href={`tel:${booking.customer.phone}`}
                      >
                        Appeler
                      </a>

                      <a
                        href={`https://wa.me/${booking.customer.phone.replace(
                          /\D/g,
                          "",
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </section>

              <section>
                <span className="admin-detail-label">
                  Séjour
                </span>

                <h3>
                  {
                    booking.destination
                      .name
                  }
                </h3>

                <p className="admin-detail-location">
                  {
                    booking.destination
                      .location
                  }
                </p>

                <dl className="admin-detail-list two-columns">
                  <div>
                    <dt>Arrivée</dt>

                    <dd>
                      {formatDate(
                        booking.checkIn,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Départ</dt>

                    <dd>
                      {formatDate(
                        booking.checkOut,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Adultes</dt>

                    <dd>
                      {
                        booking.adults
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Enfants</dt>

                    <dd>
                      {
                        booking.children
                      }
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <span className="admin-detail-label">
                  Demande
                </span>

                <dl className="admin-detail-list">
                  <div>
                    <dt>
                      Estimation
                    </dt>

                    <dd>
                      {formatFcfa(
                        booking.estimatedTotalFcfa,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Méthode de
                      contact
                    </dt>

                    <dd>
                      {booking.contactMethod ===
                      "whatsapp"
                        ? "WhatsApp"
                        : "Appel"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Créée le
                    </dt>

                    <dd>
                      {formatDateTime(
                        booking.createdAt,
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="admin-special-request">
                  <span>
                    Demande
                    particulière
                  </span>

                  <p>
                    {booking.specialRequest ||
                      "Aucune demande particulière."}
                  </p>
                </div>
              </section>

              <section className="admin-status-editor">
                <label htmlFor="booking-status">
                  Statut de la
                  réservation
                </label>

                <select
                  id="booking-status"
                  value={
                    selectedStatus
                  }
                  onChange={(event) =>
                    onStatusChange(
                      event.target
                        .value,
                    )
                  }
                >
                  {STATUS_OPTIONS.filter(
                    (status) =>
                      status.value,
                  ).map(
                    (status) => (
                      <option
                        key={
                          status.value
                        }
                        value={
                          status.value
                        }
                      >
                        {
                          status.label
                        }
                      </option>
                    ),
                  )}
                </select>

                {actionMessage.text && (
                  <p
                    className={`admin-action-message ${actionMessage.type}`}
                  >
                    {
                      actionMessage.text
                    }
                  </p>
                )}

                <button
                  type="button"
                  className="admin-save-status"
                  onClick={
                    onSaveStatus
                  }
                  disabled={
                    isUpdatingStatus ||
                    selectedStatus ===
                      booking.status
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
    </>
  );
}

function CustomerDrawer({
  customer,
  bookings,
  onClose,
}) {
  return (
    <>
      <div
        className={`admin-drawer-backdrop ${
          customer
            ? "is-visible"
            : ""
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`admin-booking-drawer ${
          customer
            ? "is-open"
            : ""
        }`}
        aria-hidden={!customer}
      >
        {customer && (
          <>
            <header className="admin-drawer-header">
              <div>
                <span>
                  Profil client
                </span>

                <h2>
                  {
                    customer.fullName
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            <div className="admin-drawer-content">
              <section>
                <span className="admin-detail-label">
                  Coordonnées
                </span>

                <dl className="admin-detail-list">
                  <div>
                    <dt>
                      Adresse e-mail
                    </dt>

                    <dd>
                      {
                        customer.email
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Téléphone
                    </dt>

                    <dd>
                      {customer.phone ||
                        "Non renseigné"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Compte créé le
                    </dt>

                    <dd>
                      {formatDate(
                        customer.createdAt,
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="admin-customer-actions">
                  <a
                    href={`mailto:${customer.email}`}
                  >
                    Envoyer un e-mail
                  </a>

                  {customer.phone && (
                    <>
                      <a
                        href={`tel:${customer.phone}`}
                      >
                        Appeler
                      </a>

                      <a
                        href={`https://wa.me/${customer.phone.replace(
                          /\D/g,
                          "",
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </section>

              <section className="admin-status-editor">
                <span className="admin-detail-label">
                  Historique des
                  réservations (
                  {bookings.length})
                </span>

                {bookings.length ===
                0 ? (
                  <p className="admin-customer-empty">
                    Aucune réservation
                    enregistrée pour ce
                    client.
                  </p>
                ) : (
                  <ul className="admin-customer-history">
                    {bookings.map(
                      (booking) => (
                        <li
                          key={
                            booking.id
                          }
                        >
                          <div className="admin-history-top">
                            <span className="admin-reference">
                              {
                                booking.reference
                              }
                            </span>

                            <span
                              className={`admin-status-badge ${booking.status}`}
                            >
                              {STATUS_LABELS[
                                booking
                                  .status
                              ] ||
                                booking.status}
                            </span>
                          </div>

                          <strong>
                            {
                              booking
                                .destination
                                .name
                            }
                          </strong>

                          <span className="admin-history-meta">
                            {formatDate(
                              booking.checkIn,
                            )}{" "}
                            ·{" "}
                            {formatFcfa(
                              booking.estimatedTotalFcfa,
                            )}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default Admin;
