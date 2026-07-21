import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Logo from "../../components/Logo/Logo";

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


/* =========================================================
   FORMATTERS
========================================================= */


function formatDate(value) {
  if (!value) {
    return "—";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(
      value,
    )
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

  return `${new Intl.NumberFormat(
    "fr-FR",
  ).format(
    Number(value),
  )} FCFA`;
}


function formatContactMethod(
  value,
) {
  const labels = {
    whatsapp: "WhatsApp",
    call: "Téléphone",
    phone: "Téléphone",
  };

  return (
    labels[value] ||
    value ||
    "—"
  );
}


function formatTravelers(
  booking,
) {
  const adults =
    Number(
      booking.adults,
    ) || 0;

  const children =
    Number(
      booking.children,
    ) || 0;

  const adultLabel =
    `${adults} adulte${
      adults > 1
        ? "s"
        : ""
    }`;

  if (!children) {
    return adultLabel;
  }

  return `${adultLabel}, ${children} enfant${
    children > 1
      ? "s"
      : ""
  }`;
}


function getInitials(
  fullName,
) {
  if (!fullName) {
    return "ST";
  }

  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
}


function normalizePhoneForWhatsApp(
  phone,
) {
  if (!phone) {
    return "";
  }

  let digits =
    String(phone).replace(
      /\D/g,
      "",
    );

  if (!digits) {
    return "";
  }

  if (
    digits.startsWith(
      "00",
    )
  ) {
    digits =
      digits.slice(2);
  }

  if (
    digits.startsWith(
      "229",
    )
  ) {
    return digits;
  }

  if (
    digits.length === 8
  ) {
    return `22901${digits}`;
  }

  if (
    digits.startsWith(
      "0",
    )
  ) {
    return `229${digits}`;
  }

  return digits;
}


function bookingBelongsToCustomer(
  booking,
  customerId,
) {
  const bookingCustomerId =
    booking.userId ??
    booking.customer?.id;

  return (
    Number(
      bookingCustomerId,
    ) ===
    Number(
      customerId,
    )
  );
}


function handleInteractiveRowKeyDown(
  event,
  action,
) {
  if (
    event.key ===
      "Enter" ||
    event.key ===
      " "
  ) {
    event.preventDefault();

    action();
  }
}


/* =========================================================
   MAIN DASHBOARD
========================================================= */


function EmployeeDashboard() {
  const navigate =
    useNavigate();


  const [
    employee,
    setEmployee,
  ] = useState(
    getStoredEmployee(),
  );


  const [
    activeSection,
    setActiveSection,
  ] = useState(
    "dashboard",
  );


  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    bookings,
    setBookings,
  ] = useState([]);


  const [
    customers,
    setCustomers,
  ] = useState([]);


  const [
    bookingsLoading,
    setBookingsLoading,
  ] = useState(false);


  const [
    customersLoading,
    setCustomersLoading,
  ] = useState(false);


  const [
    bookingsError,
    setBookingsError,
  ] = useState("");


  const [
    customersError,
    setCustomersError,
  ] = useState("");


  const [
    selectedBooking,
    setSelectedBooking,
  ] = useState(null);


  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null);


  /* =======================================================
     INITIAL SESSION CHECK
  ======================================================= */

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


        setIsLoading(
          false,
        );


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


  /* =======================================================
     LOCK PAGE WHEN DRAWER IS OPEN
  ======================================================= */

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
      document.body.style
        .overflow;


    document.body.style
      .overflow =
      "hidden";


    return () => {
      document.body.style
        .overflow =
        previousOverflow;
    };
  }, [
    selectedBooking,
    selectedCustomer,
  ]);


  /* =======================================================
     DATA
  ======================================================= */

  async function loadBookings() {
    setBookingsLoading(
      true,
    );

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
          401 ||
        requestError.status ===
          403
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
      setBookingsLoading(
        false,
      );
    }
  }


  async function loadCustomers() {
    setCustomersLoading(
      true,
    );

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
          401 ||
        requestError.status ===
          403
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
      setCustomersLoading(
        false,
      );
    }
  }


  /* =======================================================
     NAVIGATION
  ======================================================= */

  function handleSectionChange(
    section,
  ) {
    setActiveSection(
      section,
    );

    setSelectedBooking(
      null,
    );

    setSelectedCustomer(
      null,
    );
  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout() {
    try {
      await employeeAuthApi
        .logout();
    } catch {
      /*
       * Always clear the local
       * employee session.
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


  /* =======================================================
     BOOKING UPDATE
  ======================================================= */

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


  const currentSectionLabel =
    NAVIGATION_ITEMS.find(
      (item) =>
        item.id ===
        activeSection,
    )?.label ||
    "Espace équipe";


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    isLoading ||
    !employee
  ) {
    return (
      <main className="employee-dashboard-loading">
        <span
          className="employee-dashboard-loader"
          aria-hidden="true"
        />
      </main>
    );
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="employee-dashboard-page">

      {/* ===================================================
          SIDEBAR
      ==================================================== */}

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
                onClick={() =>
                  handleSectionChange(
                    item.id,
                  )
                }
              >
                <span>
                  {
                    item.label
                  }
                </span>

                <span
                  className="employee-nav-indicator"
                  aria-hidden="true"
                />
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


      {/* ===================================================
          MAIN
      ==================================================== */}

      <section className="employee-dashboard-main">

        <header className="employee-dashboard-header">

          <span className="employee-dashboard-header-label">
            STAY ·{" "}
            {currentSectionLabel.toUpperCase()}
          </span>


          <div className="employee-dashboard-header-right">

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


            <button
              type="button"
              className="employee-header-logout"
              onClick={
                handleLogout
              }
            >
              Quitter
            </button>

          </div>

        </header>


        <div className="employee-dashboard-content">

          {activeSection ===
            "dashboard" && (

            <DashboardOverview
              employeeName={
                employee.fullName
              }
              employeeRole={
                ROLE_LABELS[
                  employee.role
                ] ||
                employee.role
              }
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
              onNavigate={
                handleSectionChange
              }
              onSelectBooking={
                setSelectedBooking
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


      {/* ===================================================
          BOOKING DRAWER
      ==================================================== */}

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


      {/* ===================================================
          CUSTOMER DRAWER
      ==================================================== */}

      {selectedCustomer && (

        <CustomerDrawer
          customer={
            selectedCustomer
          }
          bookings={
            bookings.filter(
              (booking) =>
                bookingBelongsToCustomer(
                  booking,
                  selectedCustomer.id,
                ),
            )
          }
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


/* =========================================================
   DASHBOARD OVERVIEW
========================================================= */


function DashboardOverview({
  employeeName,
  employeeRole,
  bookings,
  isLoading,
  error,
  onRetry,
  onNavigate,
  onSelectBooking,
}) {
  const pendingBookings =
    useMemo(
      () =>
        bookings.filter(
          (booking) =>
            booking.status ===
            "pending",
        ),
      [bookings],
    );


  const confirmedCount =
    useMemo(
      () =>
        bookings.filter(
          (booking) =>
            booking.status ===
            "confirmed",
        ).length,
      [bookings],
    );


  const dashboardStats = [
    {
      label: "À traiter",
      value:
        pendingBookings.length,
      helper:
        "Demandes en attente",
    },
    {
      label: "Confirmées",
      value:
        confirmedCount,
      helper:
        "Séjours validés",
    },
    {
      label: "Réservations",
      value:
        bookings.length,
      helper:
        "Total enregistré",
    },
  ];


  const priorityBookings =
    pendingBookings.slice(
      0,
      4,
    );


  return (
    <section className="employee-section employee-dashboard-overview">

      {/* HEADING */}

      <div className="employee-page-heading employee-dashboard-heading">

        <div className="employee-heading-topline">

          <span className="employee-section-eyebrow">
            TABLEAU DE BORD
          </span>


          <span className="employee-role-chip">
            {
              employeeRole
            }
          </span>

        </div>


        <h1>
          Bonjour,{" "}
          <span>
            {
              employeeName
            }.
          </span>
        </h1>


        <p>
          Voici ce qui demande votre attention aujourd&apos;hui.
        </p>

      </div>


      {/* STATS */}

      <section className="employee-overview-stats">

        {dashboardStats.map(
          (stat) => (

            <article
              key={
                stat.label
              }
              className="employee-overview-stat"
            >
              <span>
                {
                  stat.label
                }
              </span>

              <strong>
                {
                  stat.value
                }
              </strong>

              <p>
                {
                  stat.helper
                }
              </p>
            </article>

          ),
        )}

      </section>


      {/* MAIN GRID */}

      <div className="employee-dashboard-work-grid">

        {/* PRIORITIES */}

        <section className="employee-priority-panel">

          <div className="employee-panel-heading">

            <div>
              <span>
                PRIORITÉ
              </span>

              <h2>
                À traiter maintenant
              </h2>
            </div>


            <button
              type="button"
              onClick={() =>
                onNavigate(
                  "reservations",
                )
              }
            >
              Voir tout
              <span
                aria-hidden="true"
              >
                ↗
              </span>
            </button>

          </div>


          {isLoading && (

            <StateMessage
              message="Chargement des demandes..."
              compact
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
              compact
            />

          )}


          {!isLoading &&
            !error &&
            priorityBookings.length ===
              0 && (

            <div className="employee-priority-empty">

              <span>
                00
              </span>

              <div>
                <strong>
                  Rien d&apos;urgent.
                </strong>

                <p>
                  Toutes les nouvelles demandes ont été traitées.
                </p>
              </div>

            </div>

          )}


          {!isLoading &&
            !error &&
            priorityBookings.length >
              0 && (

            <div className="employee-priority-list">

              {priorityBookings.map(
                (
                  booking,
                  index,
                ) => (

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

                  <span className="employee-priority-index">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>


                  <div className="employee-priority-main">

                    <span className="employee-priority-reference">
                      {
                        booking.reference
                      }
                    </span>


                    <strong>
                      {booking.destination
                        ?.name ||
                        "Destination"}
                    </strong>


                    <p>
                      {booking.customer
                        ?.fullName ||
                        "Client"}
                      {" · "}
                      {formatDate(
                        booking.checkIn,
                      )}
                    </p>

                  </div>


                  <span className="employee-priority-arrow">
                    ↗
                  </span>

                </button>

              ))}

            </div>

          )}

        </section>


        {/* QUICK ACCESS */}

        <aside className="employee-quick-access employee-quick-access-compact">

          <div className="employee-panel-heading employee-quick-heading">

            <div>
              <span>
                NAVIGATION
              </span>

              <h2>
                Accès rapides
              </h2>
            </div>

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
              <strong>
                Réservations
              </strong>

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
              <strong>
                Clients
              </strong>

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
              <strong>
                Mon profil
              </strong>

              <span className="employee-access-arrow">
                →
              </span>
            </button>

          </div>

        </aside>

      </div>

    </section>
  );
}


/* =========================================================
   RESERVATIONS
========================================================= */


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
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");


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


          return searchableText
            .includes(
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
          Consultez les demandes, ouvrez les détails et mettez leur statut à jour.
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
              event.target.value,
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
              event.target.value,
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
                <th>
                  Référence
                </th>

                <th>
                  Client
                </th>

                <th>
                  Destination
                </th>

                <th>
                  Arrivée
                </th>

                <th>
                  Statut
                </th>

                <th
                  aria-label="Action"
                />
              </tr>
            </thead>


            <tbody>

              {filteredBookings.map(
                (booking) => (

                <tr
                  key={
                    booking.id
                  }
                  role="button"
                  tabIndex={
                    0
                  }
                  onClick={() =>
                    onSelectBooking(
                      booking,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) =>
                    handleInteractiveRowKeyDown(
                      event,
                      () =>
                        onSelectBooking(
                          booking,
                        ),
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
                    {booking.customer
                      ?.fullName ||
                      "—"}
                  </td>


                  <td>
                    {booking.destination
                      ?.name ||
                      "—"}
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


                  <td className="employee-table-arrow">
                    ↗
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </section>
  );
}


/* =========================================================
   CLIENTS
========================================================= */


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
  ] = useState("");


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
          Consultez les comptes clients et leur historique de réservations.
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
              event.target.value,
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
                <th>
                  Client
                </th>

                <th>
                  E-mail
                </th>

                <th>
                  Téléphone
                </th>

                <th>
                  Réservations
                </th>

                <th
                  aria-label="Action"
                />
              </tr>
            </thead>


            <tbody>

              {filteredCustomers.map(
                (customer) => {

                  const actualBookingCount =
                    bookings.filter(
                      (booking) =>
                        bookingBelongsToCustomer(
                          booking,
                          customer.id,
                        ),
                    ).length;


                  return (

                    <tr
                      key={
                        customer.id
                      }
                      role="button"
                      tabIndex={
                        0
                      }
                      onClick={() =>
                        onSelectCustomer(
                          customer,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) =>
                        handleInteractiveRowKeyDown(
                          event,
                          () =>
                            onSelectCustomer(
                              customer,
                            ),
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
                        <span className="employee-booking-count">
                          {
                            actualBookingCount
                          }
                        </span>
                      </td>


                      <td className="employee-table-arrow">
                        ↗
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


/* =========================================================
   PROFILE
========================================================= */


function ProfileSection({
  employee,
}) {
  const roleLabel =
    ROLE_LABELS[
      employee.role
    ] ||
    employee.role;


  const isActive =
    employee.status !==
    "inactive";


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
          Les informations associées à votre compte employé STAY.
        </p>

      </div>


      <div className="employee-profile-card">

        <div className="employee-profile-hero">

          <div className="employee-profile-monogram">
            {
              getInitials(
                employee.fullName,
              )
            }
          </div>


          <div className="employee-profile-identity">

            <h2>
              {
                employee.fullName
              }
            </h2>


            <p>
              {
                roleLabel
              }
            </p>

          </div>


          <span
            className={`employee-profile-status ${
              isActive
                ? "is-active"
                : "is-inactive"
            }`}
          >
            <span
              aria-hidden="true"
            />

            {isActive
              ? "Actif"
              : "Inactif"}
          </span>

        </div>


        <dl className="employee-profile-details">

          <div className="employee-profile-row">
            <dt>
              Nom complet
            </dt>

            <dd>
              {
                employee.fullName
              }
            </dd>
          </div>


          <div className="employee-profile-row">
            <dt>
              Adresse e-mail
            </dt>

            <dd>
              {
                employee.email
              }
            </dd>
          </div>


          <div className="employee-profile-row">
            <dt>
              Téléphone
            </dt>

            <dd>
              {employee.phone ||
                "—"}
            </dd>
          </div>


          <div className="employee-profile-row">
            <dt>
              Rôle
            </dt>

            <dd>
              {
                roleLabel
              }
            </dd>
          </div>

        </dl>

      </div>

    </section>
  );
}


/* =========================================================
   BOOKING DRAWER
========================================================= */


function BookingDrawer({
  booking,
  onClose,
  onBookingUpdated,
}) {
  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState(
    booking.status,
  );


  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  async function handleStatusUpdate() {
    if (
      selectedStatus ===
      booking.status
    ) {
      return;
    }


    setIsSaving(
      true,
    );

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
      setIsSaving(
        false,
      );
    }
  }


  return (
    <Drawer
      title="Réservation"
      onClose={
        onClose
      }
    >

      <div className="employee-booking-summary">

        <div className="employee-booking-summary-top">

          <span>
            {
              booking.reference
            }
          </span>


          <StatusBadge
            status={
              booking.status
            }
          />

        </div>


        <h2>
          {booking.destination
            ?.name ||
            "Séjour STAY"}
        </h2>


        <p>
          {formatDate(
            booking.checkIn,
          )}
          {" → "}
          {formatDate(
            booking.checkOut,
          )}
        </p>

      </div>


      <DrawerSection title="Client">

        <div className="employee-drawer-client-name">

          <div className="employee-mini-monogram">
            {getInitials(
              booking.customer
                ?.fullName,
            )}
          </div>


          <div>
            <strong>
              {booking.customer
                ?.fullName ||
                "Client"}
            </strong>

            <span>
              {booking.customer
                ?.email ||
                "Aucune adresse e-mail"}
            </span>
          </div>

        </div>


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
          label="Voyageurs"
          value={formatTravelers(
            booking,
          )}
        />


        <DetailRow
          label="Estimation"
          value={formatPrice(
            booking.estimatedTotalFcfa,
          )}
        />


        <DetailRow
          label="Contact"
          value={formatContactMethod(
            booking.contactMethod,
          )}
        />

      </DrawerSection>


      {booking.specialRequest && (

        <DrawerSection title="Demande spéciale">

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

                <span
                  aria-hidden="true"
                >
                  ✓
                </span>

              )}


              {
                status.label
              }

            </button>

          ))}

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
            {
              error
            }
          </p>

        )}

      </DrawerSection>

    </Drawer>
  );
}


/* =========================================================
   CUSTOMER DRAWER
========================================================= */


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

      <div className="employee-customer-summary">

        <div className="employee-customer-monogram">
          {getInitials(
            customer.fullName,
          )}
        </div>


        <h2>
          {
            customer.fullName
          }
        </h2>


        <p>
          Client STAY
        </p>


        <span className="employee-customer-booking-total">
          {bookings.length} réservation
          {bookings.length !== 1
            ? "s"
            : ""}
        </span>

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
          label="Inscrit depuis"
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

                <div className="employee-customer-booking-main">

                  <strong>
                    {booking.destination
                      ?.name ||
                      "Destination"}
                  </strong>


                  <span>
                    {
                      booking.reference
                    }
                  </span>


                  <small>
                    {formatDate(
                      booking.checkIn,
                    )}
                    {" → "}
                    {formatDate(
                      booking.checkOut,
                    )}
                  </small>

                </div>


                <div className="employee-customer-booking-side">

                  <StatusBadge
                    status={
                      booking.status
                    }
                  />


                  <span className="employee-customer-booking-arrow">
                    ↗
                  </span>

                </div>

              </button>

            ))}

          </div>

        )}

      </DrawerSection>

    </Drawer>
  );
}


/* =========================================================
   CONTACT ACTIONS
========================================================= */


function ContactActions({
  email,
  phone,
}) {
  const normalizedPhone =
    normalizePhoneForWhatsApp(
      phone,
    );


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


/* =========================================================
   DRAWER
========================================================= */


function Drawer({
  title,
  onClose,
  children,
}) {
  useEffect(() => {

    function handleEscape(
      event,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }


    window.addEventListener(
      "keydown",
      handleEscape,
    );


    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };

  }, [onClose]);


  return (
    <div
      className="employee-drawer-backdrop"
      role="presentation"
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
        role="dialog"
        aria-modal="true"
        aria-label={
          title
        }
      >

        <header className="employee-drawer-header">

          <span>
            {
              title
            }
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
          {
            children
          }
        </div>

      </aside>

    </div>
  );
}


/* =========================================================
   DRAWER HELPERS
========================================================= */


function DrawerSection({
  title,
  children,
}) {
  return (
    <section className="employee-drawer-section">

      <h3>
        {
          title
        }
      </h3>


      {
        children
      }

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
        {
          label
        }
      </span>


      <strong>
        {value ??
          "—"}
      </strong>

    </div>
  );
}


/* =========================================================
   STATUS
========================================================= */


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


/* =========================================================
   STATES
========================================================= */


function StateMessage({
  message,
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "employee-state-message employee-state-message-compact"
          : "employee-state-message"
      }
    >
      {
        message
      }
    </div>
  );
}


function ErrorState({
  message,
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "employee-state-message employee-state-error employee-state-message-compact"
          : "employee-state-message employee-state-error"
      }
    >

      <p>
        {
          message
        }
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
