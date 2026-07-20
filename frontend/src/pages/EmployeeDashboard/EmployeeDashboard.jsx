import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Logo from "../../components/Logo/logo";

import {
  clearEmployeeSession,
  employeeAuthApi,
  employeeWorkspaceApi,
  getEmployeeToken,
  getStoredEmployee,
  updateStoredEmployee,
} from "../../services/api";

import "./EmployeeDashboard.css";

const ROLE_LABELS = {
  manager: "Manager",
  reservation_agent:
    "Agent de réservation",
};

const STATUS_LABELS = {
  pending: "En attente",
  contacted: "Contactée",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

const BOOKING_STATUSES = [
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

const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    label: "Tableau de bord",
  },
  {
    id: "reservations",
    label: "Réservations",
  },
  {
    id: "clients",
    label: "Clients",
  },
  {
    id: "profile",
    label: "Mon profil",
  },
];

function formatDate(value) {
  if (!value) {
    return "—";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    const [
      year,
      month,
      day,
    ] = value
      .slice(0, 10)
      .split("-")
      .map(Number);

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    ).format(
      new Date(
        year,
        month - 1,
        day,
      ),
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatPrice(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return (
    new Intl.NumberFormat(
      "fr-FR",
    ).format(
      Number(value),
    ) + " FCFA"
  );
}

function EmployeeDashboard() {
  const navigate =
    useNavigate();

  const [
    employee,
    setEmployee,
  ] =
    useState(
      getStoredEmployee(),
    );

  const [
    activeSection,
    setActiveSection,
  ] =
    useState(
      "dashboard",
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    bookings,
    setBookings,
  ] =
    useState([]);

  const [
    customers,
    setCustomers,
  ] =
    useState([]);

  const [
    bookingsLoading,
    setBookingsLoading,
  ] =
    useState(false);

  const [
    customersLoading,
    setCustomersLoading,
  ] =
    useState(false);

  const [
    bookingsError,
    setBookingsError,
  ] =
    useState("");

  const [
    customersError,
    setCustomersError,
  ] =
    useState("");

  const [
    selectedBooking,
    setSelectedBooking,
  ] =
    useState(null);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] =
    useState(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeDashboard() {
      if (
        !getEmployeeToken()
      ) {
        navigate(
          "/staff",
          {
            replace: true,
          },
        );

        return;
      }

      try {
        const data =
          await employeeAuthApi.me();

        if (!isMounted) {
          return;
        }

        setEmployee(
          data.employee,
        );

        updateStoredEmployee(
          data.employee,
        );

        setIsLoading(false);

        loadBookings();
        loadCustomers();
      } catch {
        clearEmployeeSession();

        navigate(
          "/staff",
          {
            replace: true,
          },
        );
      }
    }

    initializeDashboard();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    const drawerIsOpen =
      Boolean(
        selectedBooking ||
          selectedCustomer,
      );

    if (!drawerIsOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    selectedBooking,
    selectedCustomer,
  ]);

  async function loadBookings() {
    setBookingsLoading(true);
    setBookingsError("");

    try {
      const data =
        await employeeWorkspaceApi
          .bookings();

      setBookings(
        data.bookings || [],
      );
    } catch (
      requestError
    ) {
      if (
        requestError.status ===
        401
      ) {
        clearEmployeeSession();

        navigate(
          "/staff",
          {
            replace: true,
          },
        );

        return;
      }

      setBookingsError(
        requestError.message ||
          "Impossible de charger les réservations.",
      );
    } finally {
      setBookingsLoading(false);
    }
  }

  async function loadCustomers() {
    setCustomersLoading(true);
    setCustomersError("");

    try {
      const data =
        await employeeWorkspaceApi
          .customers();

      setCustomers(
        data.customers || [],
      );
    } catch (
      requestError
    ) {
      if (
        requestError.status ===
        401
      ) {
        clearEmployeeSession();

        navigate(
          "/staff",
          {
            replace: true,
          },
        );

        return;
      }

      setCustomersError(
        requestError.message ||
          "Impossible de charger les clients.",
      );
    } finally {
      setCustomersLoading(false);
    }
  }

  const firstName =
    useMemo(() => {
      if (
        !employee?.fullName
      ) {
        return "";
      }

      return employee
        .fullName
        .trim()
        .split(/\s+/)[0];
    }, [employee]);

  async function handleLogout() {
    try {
      await employeeAuthApi
        .logout();
    } catch {
      /*
       * Clear local session even if backend
       * logout temporarily fails.
       */
    } finally {
      clearEmployeeSession();

      navigate(
        "/staff",
        {
          replace: true,
        },
      );
    }
  }

  function handleBookingUpdated(
    updatedBooking,
  ) {
    setBookings(
      (
        currentBookings,
      ) =>
        currentBookings.map(
          (booking) =>
            booking.id ===
            updatedBooking.id
              ? updatedBooking
              : booking,
        ),
    );

    setSelectedBooking(
      updatedBooking,
    );
  }

  if (
    isLoading ||
    !employee
  ) {
    return (
      <main className="employee-dashboard-loading">
        <span className="employee-dashboard-loader" />
      </main>
    );
  }

  return (
    <main className="employee-dashboard-page">
      <aside className="employee-dashboard-sidebar">
        <div className="employee-sidebar-top">
          <div className="employee-dashboard-logo">
            <Logo />
          </div>

          <span className="employee-dashboard-area-label">
            ESPACE ÉQUIPE
          </span>
        </div>

        <nav
          className="employee-dashboard-navigation"
          aria-label="Navigation employé"
        >
          {NAVIGATION_ITEMS.map(
            (item) => (
              <button
                key={
                  item.id
                }
                type="button"
                className={
                  activeSection ===
                  item.id
                    ? "employee-nav-item employee-nav-item-active"
                    : "employee-nav-item"
                }
                onClick={() => {
                  setActiveSection(
                    item.id,
                  );

                  setSelectedBooking(
                    null,
                  );

                  setSelectedCustomer(
                    null,
                  );
                }}
              >
                {
                  item.label
                }
              </button>
            ),
          )}
        </nav>

        <div className="employee-sidebar-footer">
          <div className="employee-sidebar-user">
            <span>
              {ROLE_LABELS[
                employee.role
              ] ||
                employee.role}
            </span>

            <strong>
              {
                employee.fullName
              }
            </strong>
          </div>

          <button
            type="button"
            className="employee-logout-button"
            onClick={
              handleLogout
            }
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <section className="employee-dashboard-main">
        <header className="employee-dashboard-header">
          <span className="employee-dashboard-header-label">
            STAY · ESPACE EMPLOYÉ
          </span>

          <div className="employee-dashboard-header-user">
            <span>
              {
                employee.fullName
              }
            </span>

            <strong>
              {ROLE_LABELS[
                employee.role
              ] ||
                employee.role}
            </strong>
          </div>
        </header>

        <div className="employee-dashboard-content">
          {activeSection ===
            "dashboard" && (
            <DashboardOverview
              firstName={
                firstName
              }
              bookings={
                bookings
              }
              onNavigate={
                setActiveSection
              }
            />
          )}

          {activeSection ===
            "reservations" && (
            <ReservationsSection
              bookings={
                bookings
              }
              isLoading={
                bookingsLoading
              }
              error={
                bookingsError
              }
              onRetry={
                loadBookings
              }
              onSelectBooking={
                setSelectedBooking
              }
            />
          )}

          {activeSection ===
            "clients" && (
            <ClientsSection
              customers={
                customers
              }
              bookings={
                bookings
              }
              isLoading={
                customersLoading
              }
              error={
                customersError
              }
              onRetry={
                loadCustomers
              }
              onSelectCustomer={
                setSelectedCustomer
              }
            />
          )}

          {activeSection ===
            "profile" && (
            <ProfileSection
              employee={
                employee
              }
            />
          )}
        </div>
      </section>

      {selectedBooking && (
        <BookingDrawer
          key={
            selectedBooking.id
          }
          booking={
            selectedBooking
          }
          onClose={() =>
            setSelectedBooking(
              null,
            )
          }
          onBookingUpdated={
            handleBookingUpdated
          }
        />
      )}

      {selectedCustomer && (
        <CustomerDrawer
          customer={
            selectedCustomer
          }
          bookings={bookings.filter(
            (booking) =>
              Number(
                booking.userId,
              ) ===
              Number(
                selectedCustomer.id,
              ),
          )}
          onClose={() =>
            setSelectedCustomer(
              null,
            )
          }
          onSelectBooking={(
            booking,
          ) => {
            setSelectedCustomer(
              null,
            );

            setSelectedBooking(
              booking,
            );
          }}
        />
      )}
    </main>
  );
}

function DashboardOverview({
  firstName,
  bookings,
  onNavigate,
}) {
  const pendingCount =
    bookings.filter(
      (booking) =>
        booking.status ===
        "pending",
    ).length;

  return (
    <section className="employee-section">
      <div className="employee-page-heading">
        <span className="employee-section-eyebrow">
          TABLEAU DE BORD
        </span>

        <h1>
          Bonjour
          {firstName
            ? `, ${firstName}`
            : ""}
          .
        </h1>

        <p>
          Bienvenue dans votre espace de travail STAY.
          {pendingCount > 0 &&
            ` ${pendingCount} réservation${
              pendingCount > 1
                ? "s"
                : ""
            } en attente.`}
        </p>
      </div>

      <section className="employee-quick-access">
        <div className="employee-block-heading">
          <span>
            ACCÈS RAPIDES
          </span>

          <h2>
            Votre espace de travail
          </h2>
        </div>

        <div className="employee-access-list">
          <button
            type="button"
            onClick={() =>
              onNavigate(
                "reservations",
              )
            }
          >
            <div>
              <span>01</span>

              <strong>
                Réservations
              </strong>
            </div>

            <span className="employee-access-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate(
                "clients",
              )
            }
          >
            <div>
              <span>02</span>

              <strong>
                Clients
              </strong>
            </div>

            <span className="employee-access-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate(
                "profile",
              )
            }
          >
            <div>
              <span>03</span>

              <strong>
                Mon profil
              </strong>
            </div>

            <span className="employee-access-arrow">
              →
            </span>
          </button>
        </div>
      </section>
    </section>
  );
}

function ReservationsSection({
  bookings,
  isLoading,
  error,
  onRetry,
  onSelectBooking,
}) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("");

  const filteredBookings =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {
          const matchesStatus =
            !statusFilter ||
            booking.status ===
              statusFilter;

          if (
            !matchesStatus
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const searchableText =
            [
              booking.reference,
              booking.customer
                ?.fullName,
              booking.customer
                ?.email,
              booking.customer
                ?.phone,
              booking.destination
                ?.name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      bookings,
      search,
      statusFilter,
    ]);

  return (
    <section className="employee-section">
      <div className="employee-page-heading">
        <span className="employee-section-eyebrow">
          GESTION
        </span>

        <h1>
          Réservations
        </h1>

        <p>
          Consultez les demandes, ouvrez les détails et
          mettez leur statut à jour.
        </p>
      </div>

      <div className="employee-toolbar">
        <input
          type="search"
          value={
            search
          }
          onChange={(
            event,
          ) =>
            setSearch(
              event.target
                .value,
            )
          }
          placeholder="Rechercher une réservation..."
        />

        <select
          value={
            statusFilter
          }
          onChange={(
            event,
          ) =>
            setStatusFilter(
              event.target
                .value,
            )
          }
        >
          <option value="">
            Tous les statuts
          </option>

          {BOOKING_STATUSES.map(
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
      </div>

      {isLoading && (
        <StateMessage
          message="Chargement des réservations..."
        />
      )}

      {!isLoading &&
        error && (
          <ErrorState
            message={
              error
            }
            onRetry={
              onRetry
            }
          />
        )}

      {!isLoading &&
        !error &&
        filteredBookings.length ===
          0 && (
          <StateMessage
            message="Aucune réservation trouvée."
          />
        )}

      {!isLoading &&
        !error &&
        filteredBookings.length >
          0 && (
          <div className="employee-table-wrapper">
            <table className="employee-data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Destination</th>
                  <th>Arrivée</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map(
                  (booking) => (
                    <tr
                      key={
                        booking.id
                      }
                      onClick={() =>
                        onSelectBooking(
                          booking,
                        )
                      }
                    >
                      <td>
                        <strong>
                          {
                            booking.reference
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          booking.customer
                            ?.fullName ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          booking.destination
                            ?.name ||
                          "—"
                        }
                      </td>

                      <td>
                        {formatDate(
                          booking.checkIn,
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            booking.status
                          }
                        />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}

function ClientsSection({
  customers,
  bookings,
  isLoading,
  error,
  onRetry,
  onSelectCustomer,
}) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const filteredCustomers =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (
        !normalizedSearch
      ) {
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
            .join(" ")
            .toLowerCase()
            .includes(
              normalizedSearch,
            ),
      );
    }, [
      customers,
      search,
    ]);

  return (
    <section className="employee-section">
      <div className="employee-page-heading">
        <span className="employee-section-eyebrow">
          RELATION CLIENT
        </span>

        <h1>
          Clients
        </h1>

        <p>
          Consultez les comptes clients et leur historique
          de réservations.
        </p>
      </div>

      <div className="employee-toolbar employee-toolbar-single">
        <input
          type="search"
          value={
            search
          }
          onChange={(
            event,
          ) =>
            setSearch(
              event.target
                .value,
            )
          }
          placeholder="Rechercher un client..."
        />
      </div>

      {isLoading && (
        <StateMessage
          message="Chargement des clients..."
        />
      )}

      {!isLoading &&
        error && (
          <ErrorState
            message={
              error
            }
            onRetry={
              onRetry
            }
          />
        )}

      {!isLoading &&
        !error &&
        filteredCustomers.length ===
          0 && (
          <StateMessage
            message="Aucun client trouvé."
          />
        )}

      {!isLoading &&
        !error &&
        filteredCustomers.length >
          0 && (
          <div className="employee-table-wrapper">
            <table className="employee-data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>E-mail</th>
                  <th>Téléphone</th>
                  <th>Réservations</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => {
                    const actualBookingCount =
                      bookings.filter(
                        (
                          booking,
                        ) =>
                          Number(
                            booking.userId,
                          ) ===
                          Number(
                            customer.id,
                          ),
                      ).length;

                    return (
                      <tr
                        key={
                          customer.id
                        }
                        onClick={() =>
                          onSelectCustomer(
                            customer,
                          )
                        }
                      >
                        <td>
                          <strong>
                            {
                              customer.fullName
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            customer.email
                          }
                        </td>

                        <td>
                          {customer.phone ||
                            "—"}
                        </td>

                        <td>
                          {
                            actualBookingCount
                          }
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}

function ProfileSection({
  employee,
}) {
  return (
    <section className="employee-section">
      <div className="employee-page-heading">
        <span className="employee-section-eyebrow">
          COMPTE
        </span>

        <h1>
          Mon profil
        </h1>

        <p>
          Les informations associées à votre compte employé
          STAY.
        </p>
      </div>

      <div className="employee-profile-card">
        <div className="employee-profile-row">
          <span>
            Nom complet
          </span>

          <strong>
            {
              employee.fullName
            }
          </strong>
        </div>

        <div className="employee-profile-row">
          <span>
            Adresse e-mail
          </span>

          <strong>
            {
              employee.email
            }
          </strong>
        </div>

        <div className="employee-profile-row">
          <span>
            Téléphone
          </span>

          <strong>
            {employee.phone ||
              "—"}
          </strong>
        </div>

        <div className="employee-profile-row">
          <span>
            Rôle
          </span>

          <strong>
            {ROLE_LABELS[
              employee.role
            ] ||
              employee.role}
          </strong>
        </div>

        <div className="employee-profile-row">
          <span>
            Statut
          </span>

          <strong>
            Actif
          </strong>
        </div>
      </div>
    </section>
  );
}

function BookingDrawer({
  booking,
  onClose,
  onBookingUpdated,
}) {
  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState(
      booking.status,
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function handleStatusUpdate() {
    if (
      selectedStatus ===
      booking.status
    ) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const data =
        await employeeWorkspaceApi
          .updateBookingStatus(
            booking.id,
            selectedStatus,
          );

      onBookingUpdated(
        data.booking,
      );
    } catch (
      requestError
    ) {
      setError(
        requestError.message ||
          "Impossible de modifier le statut.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer
      title="Détails de la réservation"
      onClose={
        onClose
      }
    >
      <div className="employee-drawer-reference">
        <span>
          RÉFÉRENCE
        </span>

        <strong>
          {
            booking.reference
          }
        </strong>

        <StatusBadge
          status={
            booking.status
          }
        />
      </div>

      <DrawerSection title="Client">
        <DetailRow
          label="Nom"
          value={
            booking.customer
              ?.fullName
          }
        />

        <DetailRow
          label="E-mail"
          value={
            booking.customer
              ?.email
          }
        />

        <DetailRow
          label="Téléphone"
          value={
            booking.customer
              ?.phone
          }
        />

        <ContactActions
          email={
            booking.customer
              ?.email
          }
          phone={
            booking.customer
              ?.phone
          }
        />
      </DrawerSection>

      <DrawerSection title="Séjour">
        <DetailRow
          label="Destination"
          value={
            booking.destination
              ?.name
          }
        />

        <DetailRow
          label="Localisation"
          value={
            booking.destination
              ?.location
          }
        />

        <DetailRow
          label="Arrivée"
          value={formatDate(
            booking.checkIn,
          )}
        />

        <DetailRow
          label="Départ"
          value={formatDate(
            booking.checkOut,
          )}
        />

        <DetailRow
          label="Adultes"
          value={
            booking.adults
          }
        />

        <DetailRow
          label="Enfants"
          value={
            booking.children
          }
        />

        <DetailRow
          label="Estimation"
          value={formatPrice(
            booking.estimatedTotalFcfa,
          )}
        />

        <DetailRow
          label="Contact"
          value={
            booking.contactMethod
          }
        />
      </DrawerSection>

      {booking.specialRequest && (
        <DrawerSection
          title="Demande spéciale"
        >
          <p className="employee-special-request">
            {
              booking.specialRequest
            }
          </p>
        </DrawerSection>
      )}

      <DrawerSection title="Modifier le statut">
        <div className="employee-status-options">
          {BOOKING_STATUSES.map(
            (status) => (
              <button
                key={
                  status.value
                }
                type="button"
                className={
                  selectedStatus ===
                  status.value
                    ? "employee-status-option employee-status-option-active"
                    : "employee-status-option"
                }
                onClick={() =>
                  setSelectedStatus(
                    status.value,
                  )
                }
              >
                {selectedStatus ===
                  status.value && (
                  <span>✓</span>
                )}

                {
                  status.label
                }
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="employee-status-save"
          onClick={
            handleStatusUpdate
          }
          disabled={
            isSaving ||
            selectedStatus ===
              booking.status
          }
        >
          {isSaving
            ? "Enregistrement..."
            : selectedStatus ===
                booking.status
              ? "Statut actuel"
              : "Enregistrer le changement"}
        </button>

        {error && (
          <p className="employee-inline-error">
            {error}
          </p>
        )}
      </DrawerSection>
    </Drawer>
  );
}

function CustomerDrawer({
  customer,
  bookings,
  onClose,
  onSelectBooking,
}) {
  return (
    <Drawer
      title="Fiche client"
      onClose={
        onClose
      }
    >
      <div className="employee-drawer-reference">
        <span>
          CLIENT
        </span>

        <strong>
          {
            customer.fullName
          }
        </strong>
      </div>

      <DrawerSection title="Informations">
        <DetailRow
          label="E-mail"
          value={
            customer.email
          }
        />

        <DetailRow
          label="Téléphone"
          value={
            customer.phone
          }
        />

        <DetailRow
          label="Inscription"
          value={formatDate(
            customer.createdAt,
          )}
        />

        <ContactActions
          email={
            customer.email
          }
          phone={
            customer.phone
          }
        />
      </DrawerSection>

      <DrawerSection
        title={`Historique des réservations (${bookings.length})`}
      >
        {bookings.length ===
        0 ? (
          <p className="employee-drawer-empty">
            Aucune réservation enregistrée pour ce client.
          </p>
        ) : (
          <div className="employee-customer-bookings">
            {bookings.map(
              (booking) => (
                <button
                  key={
                    booking.id
                  }
                  type="button"
                  onClick={() =>
                    onSelectBooking(
                      booking,
                    )
                  }
                >
                  <div>
                    <strong>
                      {
                        booking.reference
                      }
                    </strong>

                    <span>
                      {booking.destination
                        ?.name ||
                        "Destination"}
                    </span>
                  </div>

                  <StatusBadge
                    status={
                      booking.status
                    }
                  />
                </button>
              ),
            )}
          </div>
        )}
      </DrawerSection>
    </Drawer>
  );
}

function ContactActions({
  email,
  phone,
}) {
  const normalizedPhone =
    phone
      ? String(phone).replace(
          /\D/g,
          "",
        )
      : "";

  if (
    !email &&
    !phone
  ) {
    return null;
  }

  return (
    <div className="employee-contact-actions">
      {email && (
        <a
          href={`mailto:${email}`}
        >
          E-mail
        </a>
      )}

      {phone && (
        <a
          href={`tel:${phone}`}
        >
          Appeler
        </a>
      )}

      {normalizedPhone && (
        <a
          href={`https://wa.me/${normalizedPhone}`}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}

function Drawer({
  title,
  onClose,
  children,
}) {
  return (
    <div
      className="employee-drawer-backdrop"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside
        className="employee-drawer"
        aria-label={
          title
        }
      >
        <header className="employee-drawer-header">
          <span>
            {title}
          </span>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="employee-drawer-content">
          {children}
        </div>
      </aside>
    </div>
  );
}

function DrawerSection({
  title,
  children,
}) {
  return (
    <section className="employee-drawer-section">
      <h3>
        {title}
      </h3>

      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="employee-detail-row">
      <span>
        {label}
      </span>

      <strong>
        {value ??
          "—"}
      </strong>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <span
      className={`employee-status-badge employee-status-${status}`}
    >
      {STATUS_LABELS[
        status
      ] ||
        status}
    </span>
  );
}

function StateMessage({
  message,
}) {
  return (
    <div className="employee-state-message">
      {message}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}) {
  return (
    <div className="employee-state-message employee-state-error">
      <p>
        {message}
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
      >
        Réessayer
      </button>
    </div>
  );
}

export default EmployeeDashboard;
