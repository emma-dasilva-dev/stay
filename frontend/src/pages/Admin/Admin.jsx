import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo/logo";
import { adminApi, authApi, clearSession, getToken } from "../../services/api";
import "./Admin.css";

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

const EMPLOYEE_ROLE_LABELS = {
  manager: "Manager",
  reservation_agent: "Agent de réservation",
};

const NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "reservations", label: "Réservations" },
  { id: "customers", label: "Clients" },
  { id: "team", label: "Équipe" },
  { id: "completed", label: "Terminées" },
];

const INITIAL_EMPLOYEE_FORM = {
  fullName: "",
  email: "",
  phone: "",
  role: "reservation_agent",
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
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function matchesBookingSearch(booking, searchValue) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    booking.reference,
    booking.customer?.fullName,
    booking.customer?.email,
    booking.customer?.phone,
    booking.destination?.name,
    booking.destination?.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

async function copyTextToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporaryInput = document.createElement("textarea");

  temporaryInput.value = value;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";

  document.body.appendChild(temporaryInput);

  temporaryInput.select();

  const copied = document.execCommand("copy");

  document.body.removeChild(temporaryInput);

  if (!copied) {
    throw new Error("Copy failed");
  }
}

function Admin() {
  const navigate = useNavigate();

  const [accessState, setAccessState] = useState("checking");
  const [adminUser, setAdminUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    contactedBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalCustomers: 0,
  });

  const [dashboardBookings, setDashboardBookings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [completedSearchInput, setCompletedSearchInput] = useState("");

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [dashboardError, setDashboardError] = useState("");
  const [bookingsError, setBookingsError] = useState("");
  const [completedError, setCompletedError] = useState("");

  const [actionMessage, setActionMessage] = useState({
    type: "",
    text: "",
  });

  const [selectedStatus, setSelectedStatus] = useState("");

  const [customers, setCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [hasLoadedCustomers, setHasLoadedCustomers] = useState(false);
  const [customersError, setCustomersError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [hasLoadedEmployees, setHasLoadedEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);

  const [employeeForm, setEmployeeForm] = useState(
    INITIAL_EMPLOYEE_FORM,
  );

  const [employeeMessage, setEmployeeMessage] = useState({
    type: "",
    text: "",
  });

  const [temporaryPin, setTemporaryPin] = useState("");
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);

  const [
    isUpdatingEmployeeStatus,
    setIsUpdatingEmployeeStatus,
  ] = useState(false);

  const handleUnauthorizedSession = useCallback(() => {
    clearSession();
    setAdminUser(null);
    setAccessState("unauthenticated");
  }, []);

  const apiRequest = useCallback(
    async (requestFunction) => {
      try {
        return await requestFunction();
      } catch (error) {
        if (error.status === 401) {
          handleUnauthorizedSession();
        } else if (error.status === 403) {
          setAccessState("forbidden");
        }

        throw error;
      }
    },
    [handleUnauthorizedSession],
  );

  const verifyAdminAccess = useCallback(async () => {
    if (!getToken()) {
      setAccessState("unauthenticated");
      return;
    }

    try {
      const data = await authApi.me();

      if (data.user.role !== "admin") {
        setAccessState("forbidden");
        return;
      }

      setAdminUser(data.user);
      setAccessState("authorized");
    } catch {
      handleUnauthorizedSession();
    }
  }, [handleUnauthorizedSession]);

  const loadDashboardStats = useCallback(async () => {
    const data = await apiRequest(() => adminApi.stats());

    setStats(data.stats);
  }, [apiRequest]);

  const loadDashboardBookings = useCallback(async () => {
    const data = await apiRequest(() => adminApi.bookings());

    setDashboardBookings(data.bookings || []);
  }, [apiRequest]);

  const loadDashboard = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoadingDashboard(true);
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
          setIsLoadingDashboard(false);
        }
      }
    },
    [loadDashboardBookings, loadDashboardStats],
  );

  const loadReservations = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoadingBookings(true);
      }

      setBookingsError("");

      try {
        const data = await apiRequest(() =>
          adminApi.bookings({
            status: statusFilter,
            search: activeSearch,
          }),
        );

        setBookings(data.bookings || []);
      } catch (error) {
        setBookingsError(
          error.message ||
            "Impossible de charger les réservations.",
        );
      } finally {
        if (showLoader) {
          setIsLoadingBookings(false);
        }
      }
    },
    [activeSearch, apiRequest, statusFilter],
  );

  const loadCompletedReservations = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoadingCompleted(true);
      }

      setCompletedError("");

      try {
        const data = await apiRequest(() =>
          adminApi.bookings({
            status: "completed",
          }),
        );

        setCompletedBookings(data.bookings || []);
      } catch (error) {
        setCompletedError(
          error.message ||
            "Impossible de charger les réservations terminées.",
        );
      } finally {
        if (showLoader) {
          setIsLoadingCompleted(false);
        }
      }
    },
    [apiRequest],
  );

  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    setCustomersError("");

    try {
      const [customersData, bookingsData] = await Promise.all([
        apiRequest(() => adminApi.customers()),
        apiRequest(() => adminApi.bookings()),
      ]);

      setCustomers(customersData.customers || []);
      setAllBookings(bookingsData.bookings || []);
      setHasLoadedCustomers(true);
    } catch (error) {
      setCustomersError(
        error.message ||
          "Impossible de charger les clients.",
      );
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [apiRequest]);

  const loadEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    setEmployeesError("");

    try {
      const data = await apiRequest(() => adminApi.employees());

      setEmployees(data.employees || []);
      setHasLoadedEmployees(true);
    } catch (error) {
      setEmployeesError(
        error.message ||
          "Impossible de charger l’équipe.",
      );
    } finally {
      setIsLoadingEmployees(false);
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

      if (activeView === "reservations") {
        loadReservations(false);
      }

      if (activeView === "completed") {
        loadCompletedReservations(false);
      }
    }, 20000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [
    accessState,
    activeView,
    loadCompletedReservations,
    loadDashboard,
    loadReservations,
  ]);

  useEffect(() => {
    if (
      accessState !== "authorized" ||
      activeView !== "reservations"
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
      accessState !== "authorized" ||
      activeView !== "completed"
    ) {
      return;
    }

    loadCompletedReservations();
  }, [
    accessState,
    activeView,
    loadCompletedReservations,
  ]);

  useEffect(() => {
    if (
      accessState !== "authorized" ||
      activeView !== "customers" ||
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
    if (
      accessState !== "authorized" ||
      activeView !== "team" ||
      hasLoadedEmployees
    ) {
      return;
    }

    loadEmployees();
  }, [
    accessState,
    activeView,
    hasLoadedEmployees,
    loadEmployees,
  ]);

  useEffect(() => {
    if (selectedBooking) {
      setSelectedStatus(
        selectedBooking.status,
      );
    }
  }, [selectedBooking]);

  useEffect(() => {
    const drawerIsOpen = Boolean(
      selectedBooking ||
        selectedCustomer ||
        isEmployeeDrawerOpen,
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
    isEmployeeDrawerOpen,
    selectedBooking,
    selectedCustomer,
  ]);

  const overviewStats = useMemo(
    () => [
      {
        label: "À traiter",
        value: stats.pendingBookings,
        helper: "Demandes en attente",
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

  const priorityBookings = useMemo(
    () =>
      dashboardBookings
        .filter(
          (booking) =>
            booking.status ===
            "pending",
        )
        .slice(0, 5),
    [dashboardBookings],
  );

  const filteredCustomers = useMemo(() => {
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

  const filteredCompletedBookings = useMemo(
    () =>
      completedBookings.filter(
        (booking) =>
          matchesBookingSearch(
            booking,
            completedSearchInput,
          ),
      ),
    [
      completedBookings,
      completedSearchInput,
    ],
  );

  const selectedCustomerBookings = useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return allBookings.filter(
      (booking) =>
        Number(booking.userId) ===
        Number(selectedCustomer.id),
    );
  }, [
    allBookings,
    selectedCustomer,
  ]);

  function handleSearchSubmit(event) {
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
    setSelectedCustomer(null);
    setIsEmployeeDrawerOpen(false);
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
    setSelectedBooking(null);
    setIsEmployeeDrawerOpen(false);
    setSelectedCustomer(customer);
  }

  function closeCustomerPanel() {
    setSelectedCustomer(null);
  }

  function openCreateEmployee() {
    setSelectedBooking(null);
    setSelectedCustomer(null);
    setSelectedEmployee(null);

    setEmployeeForm(
      INITIAL_EMPLOYEE_FORM,
    );

    setTemporaryPin("");

    setEmployeeMessage({
      type: "",
      text: "",
    });

    setIsEmployeeDrawerOpen(true);
  }

  function openEditEmployee(employee) {
    setSelectedBooking(null);
    setSelectedCustomer(null);
    setSelectedEmployee(employee);

    setEmployeeForm({
      fullName:
        employee.fullName || "",
      email:
        employee.email || "",
      phone:
        employee.phone || "",
      role:
        employee.role ||
        "reservation_agent",
    });

    setTemporaryPin("");

    setEmployeeMessage({
      type: "",
      text: "",
    });

    setIsEmployeeDrawerOpen(true);
  }

  function closeEmployeeDrawer() {
    setIsEmployeeDrawerOpen(false);
    setSelectedEmployee(null);

    setEmployeeForm(
      INITIAL_EMPLOYEE_FORM,
    );

    setTemporaryPin("");

    setEmployeeMessage({
      type: "",
      text: "",
    });
  }

  function handleEmployeeChange(event) {
    const { name, value } =
      event.target;

    setEmployeeForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      }),
    );

    if (employeeMessage.text) {
      setEmployeeMessage({
        type: "",
        text: "",
      });
    }
  }

  function handleViewChange(view) {
    setActiveView(view);
    setSelectedBooking(null);
    setSelectedCustomer(null);
    setIsEmployeeDrawerOpen(false);
    setSelectedEmployee(null);

    setEmployeeForm(
      INITIAL_EMPLOYEE_FORM,
    );

    setTemporaryPin("");

    setEmployeeMessage({
      type: "",
      text: "",
    });

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
      const data = await apiRequest(
        () =>
          adminApi.updateBookingStatus(
            selectedBooking.id,
            selectedStatus,
          ),
      );

      const updatedBooking =
        data.booking;

      setSelectedBooking(
        updatedBooking,
      );

      setBookings(
        (currentBookings) =>
          currentBookings
            .map((booking) =>
              booking.id ===
              updatedBooking.id
                ? updatedBooking
                : booking,
            )
            .filter(
              (booking) =>
                !statusFilter ||
                booking.status ===
                  statusFilter,
            ),
      );

      setDashboardBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id ===
              updatedBooking.id
                ? updatedBooking
                : booking,
          ),
      );

      setAllBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id ===
              updatedBooking.id
                ? updatedBooking
                : booking,
          ),
      );

      setCompletedBookings(
        (currentBookings) => {
          if (
            updatedBooking.status !==
            "completed"
          ) {
            return currentBookings.filter(
              (booking) =>
                booking.id !==
                updatedBooking.id,
            );
          }

          const alreadyExists =
            currentBookings.some(
              (booking) =>
                booking.id ===
                updatedBooking.id,
            );

          if (alreadyExists) {
            return currentBookings.map(
              (booking) =>
                booking.id ===
                updatedBooking.id
                  ? updatedBooking
                  : booking,
            );
          }

          return [
            updatedBooking,
            ...currentBookings,
          ];
        },
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
      setIsUpdatingStatus(false);
    }
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();

    setIsSavingEmployee(true);

    setEmployeeMessage({
      type: "",
      text: "",
    });

    if (!selectedEmployee) {
      setTemporaryPin("");
    }

    try {
      if (selectedEmployee) {
        const data = await apiRequest(
          () =>
            adminApi.updateEmployee(
              selectedEmployee.id,
              employeeForm,
            ),
        );

        setEmployees(
          (currentEmployees) =>
            currentEmployees.map(
              (employee) =>
                employee.id ===
                data.employee.id
                  ? data.employee
                  : employee,
            ),
        );

        setSelectedEmployee(
          data.employee,
        );

        setEmployeeForm({
          fullName:
            data.employee.fullName ||
            "",
          email:
            data.employee.email ||
            "",
          phone:
            data.employee.phone ||
            "",
          role:
            data.employee.role ||
            "reservation_agent",
        });

        setEmployeeMessage({
          type: "success",
          text:
            "Les informations ont été mises à jour.",
        });
      } else {
        const data = await apiRequest(
          () =>
            adminApi.createEmployee(
              employeeForm,
            ),
        );

        setEmployees(
          (currentEmployees) => [
            data.employee,
            ...currentEmployees,
          ],
        );

        setSelectedEmployee(
          data.employee,
        );

        setEmployeeForm({
          fullName:
            data.employee.fullName ||
            "",
          email:
            data.employee.email ||
            "",
          phone:
            data.employee.phone ||
            "",
          role:
            data.employee.role ||
            "reservation_agent",
        });

        setTemporaryPin(
          data.temporaryPin || "",
        );

        setHasLoadedEmployees(true);

        setEmployeeMessage({
          type: "success",
          text:
            "Le membre de l’équipe a été créé.",
        });
      }
    } catch (error) {
      setEmployeeMessage({
        type: "error",
        text:
          error.message ||
          "Impossible d’enregistrer ce membre de l’équipe.",
      });
    } finally {
      setIsSavingEmployee(false);
    }
  }

  async function handleEmployeeStatus(employee) {
    if (
      !employee ||
      isUpdatingEmployeeStatus
    ) {
      return;
    }

    const nextStatus =
      !employee.isActive;

    const actionLabel =
      nextStatus
        ? "réactiver"
        : "désactiver";

    const confirmed =
      window.confirm(
        `${actionLabel[0].toUpperCase()}${actionLabel.slice(
          1,
        )} l’accès de ${employee.fullName} ?`,
      );

    if (!confirmed) {
      return;
    }

    setIsUpdatingEmployeeStatus(true);

    setEmployeeMessage({
      type: "",
      text: "",
    });

    try {
      const data = await apiRequest(
        () =>
          adminApi.updateEmployeeStatus(
            employee.id,
            nextStatus,
          ),
      );

      setEmployees(
        (currentEmployees) =>
          currentEmployees.map(
            (currentEmployee) =>
              currentEmployee.id ===
              data.employee.id
                ? data.employee
                : currentEmployee,
          ),
      );

      setSelectedEmployee(
        data.employee,
      );

      setEmployeeMessage({
        type: "success",
        text: data.message,
      });
    } catch (error) {
      setEmployeeMessage({
        type: "error",
        text:
          error.message ||
          "Impossible de modifier cet accès.",
      });
    } finally {
      setIsUpdatingEmployeeStatus(false);
    }
  }

  async function handleResetEmployeePin() {
    if (
      !selectedEmployee ||
      isResettingPin
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Générer un nouveau code PIN pour ${selectedEmployee.fullName} ? L’ancien code ne fonctionnera plus.`,
      );

    if (!confirmed) {
      return;
    }

    setIsResettingPin(true);
    setTemporaryPin("");

    setEmployeeMessage({
      type: "",
      text: "",
    });

    try {
      const data = await apiRequest(
        () =>
          adminApi.resetEmployeePin(
            selectedEmployee.id,
          ),
      );

      setTemporaryPin(
        data.temporaryPin || "",
      );

      setEmployeeMessage({
        type: "success",
        text:
          "Un nouveau code PIN temporaire a été généré.",
      });
    } catch (error) {
      setEmployeeMessage({
        type: "error",
        text:
          error.message ||
          "Impossible de réinitialiser le code PIN.",
      });
    } finally {
      setIsResettingPin(false);
    }
  }

  async function copyTemporaryPin() {
    if (!temporaryPin) {
      return;
    }

    try {
      await copyTextToClipboard(
        temporaryPin,
      );

      setEmployeeMessage({
        type: "success",
        text:
          "Le code PIN a été copié.",
      });
    } catch {
      setEmployeeMessage({
        type: "error",
        text:
          "Impossible de copier automatiquement le code PIN. Copiez-le manuellement.",
      });
    }
  }

  function handleRefresh() {
    if (activeView === "dashboard") {
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

    if (activeView === "customers") {
      loadCustomers();
      return;
    }

    if (activeView === "team") {
      loadEmployees();
      return;
    }

    if (activeView === "completed") {
      loadCompletedReservations();
    }
  }

  function handleLogout() {
    clearSession();

    navigate("/account", {
      replace: true,
    });
  }

  if (
    accessState ===
    "checking"
  ) {
    return (
      <main className="admin-access-page">
        <div className="admin-access-message">
          <span className="admin-loader" />

          <p>
            Vérification de votre accès...
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
    accessState ===
    "forbidden"
  ) {
    return (
      <main className="admin-access-page">
        <div className="admin-access-denied">
          <span>403</span>

          <h1>
            Accès refusé
          </h1>

          <p>
            Cette page est réservée à l’administration de STAY.
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
        : activeView ===
            "customers"
          ? isLoadingCustomers
          : activeView ===
              "team"
            ? isLoadingEmployees
            : isLoadingCompleted;

  const currentViewLabel =
    NAVIGATION_ITEMS.find(
      (item) =>
        item.id ===
        activeView,
    )?.label ||
    "Administration";

  return (
    <main className="admin-page">
      <div className="admin-mobile-header">
        <div className="admin-mobile-brand">
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
        <div className="admin-sidebar-top">
          <div className="admin-dashboard-logo">
            <Logo />
          </div>

          <span className="admin-dashboard-area-label">
            ADMINISTRATION
          </span>
        </div>

        <nav
          className="admin-sidebar-nav"
          aria-label="Navigation administration"
        >
          {NAVIGATION_ITEMS.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={
                  activeView ===
                  item.id
                    ? "admin-nav-item admin-nav-item-active"
                    : "admin-nav-item"
                }
                onClick={() =>
                  handleViewChange(
                    item.id,
                  )
                }
              >
                <span>
                  {item.label}
                </span>

                <span
                  className="admin-nav-indicator"
                  aria-hidden="true"
                />
              </button>
            ),
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div>
            <span>
              Super Admin
            </span>

            <strong>
              {adminUser?.fullName ||
                "Administrateur"}
            </strong>
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
        <header className="admin-topbar">
          <span className="admin-topbar-label">
            STAY ·{" "}
            {currentViewLabel.toUpperCase()}
          </span>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-topbar-refresh"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing
                ? "Actualisation..."
                : "Actualiser"}
            </button>

            <div className="admin-topbar-user">
              <span>
                {adminUser?.fullName ||
                  "Administrateur"}
              </span>

              <strong>
                Super Admin
              </strong>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeView ===
            "dashboard" && (
            <DashboardView
              adminName={
                adminUser?.fullName
              }
              overviewStats={
                overviewStats
              }
              priorityBookings={
                priorityBookings
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
              onNavigate={
                handleViewChange
              }
            />
          )}

          {activeView ===
            "reservations" && (
            <ReservationsView
              bookings={
                bookings
              }
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
              error={
                bookingsError
              }
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
              error={
                customersError
              }
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

          {activeView ===
            "team" && (
            <TeamView
              employees={
                employees
              }
              isLoading={
                isLoadingEmployees
              }
              error={
                employeesError
              }
              onReload={
                loadEmployees
              }
              onCreate={
                openCreateEmployee
              }
              onEdit={
                openEditEmployee
              }
            />
          )}

          {activeView ===
            "completed" && (
            <CompletedView
              bookings={
                filteredCompletedBookings
              }
              totalCount={
                completedBookings.length
              }
              searchInput={
                completedSearchInput
              }
              isLoading={
                isLoadingCompleted
              }
              error={
                completedError
              }
              onSearchChange={
                setCompletedSearchInput
              }
              onReload={
                loadCompletedReservations
              }
              onOpenBooking={
                openBooking
              }
            />
          )}
        </div>
      </section>

      <BookingDrawer
        booking={
          selectedBooking
        }
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

      <EmployeeDrawer
        isOpen={
          isEmployeeDrawerOpen
        }
        employee={
          selectedEmployee
        }
        form={
          employeeForm
        }
        message={
          employeeMessage
        }
        temporaryPin={
          temporaryPin
        }
        isSaving={
          isSavingEmployee
        }
        isResettingPin={
          isResettingPin
        }
        isUpdatingStatus={
          isUpdatingEmployeeStatus
        }
        onChange={
          handleEmployeeChange
        }
        onSubmit={
          handleEmployeeSubmit
        }
        onStatusChange={
          handleEmployeeStatus
        }
        onResetPin={
          handleResetEmployeePin
        }
        onCopyPin={
          copyTemporaryPin
        }
        onClose={
          closeEmployeeDrawer
        }
      />
    </main>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="admin-page-heading">
      <span className="admin-section-eyebrow">
        {eyebrow}
      </span>

      <h1>
        {title}
      </h1>

      <p>
        {description}
      </p>
    </div>
  );
}

function DashboardView({
  adminName,
  overviewStats,
  priorityBookings,
  isLoading,
  error,
  onReload,
  onOpenBooking,
  onNavigate,
}) {
  return (
    <section className="admin-view admin-dashboard-overview">
      <div className="admin-page-heading admin-dashboard-heading">
        <div className="admin-heading-topline">
          <span className="admin-section-eyebrow">
            TABLEAU DE BORD
          </span>

          <span className="admin-role-chip">
            Super Admin
          </span>
        </div>

        <h1>
          Bonjour,{" "}
          <span>
            {adminName ||
              "Administrateur"}.
          </span>
        </h1>

        <p>
          Voici ce qui demande votre attention aujourd’hui.
        </p>
      </div>

      <section className="admin-overview-stats">
        {overviewStats.map(
          (stat) => (
            <article
              key={stat.label}
              className="admin-overview-stat"
            >
              <span>
                {stat.label}
              </span>

              <strong>
                {stat.value}
              </strong>

              <p>
                {stat.helper}
              </p>
            </article>
          ),
        )}
      </section>

      <div className="admin-dashboard-work-grid">
        <section className="admin-priority-panel">
          <div className="admin-panel-heading">
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

              <span aria-hidden="true">
                ↗
              </span>
            </button>
          </div>

          {isLoading && (
            <AdminLoadingState
              text="Chargement des demandes..."
              compact
            />
          )}

          {!isLoading &&
            error && (
              <AdminErrorState
                message={error}
                onRetry={() =>
                  onReload()
                }
                compact
              />
            )}

          {!isLoading &&
            !error &&
            priorityBookings.length ===
              0 && (
              <div className="admin-priority-empty">
                <span>
                  00
                </span>

                <div>
                  <strong>
                    Rien d’urgent.
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
              <div className="admin-priority-list">
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
                        onOpenBooking(
                          booking,
                        )
                      }
                    >
                      <span className="admin-priority-index">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <div className="admin-priority-main">
                        <span className="admin-priority-reference">
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

                      <span className="admin-priority-arrow">
                        ↗
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}
        </section>

        <aside className="admin-quick-access admin-quick-access-compact">
          <div className="admin-panel-heading admin-quick-heading">
            <div>
              <span>
                NAVIGATION
              </span>

              <h2>
                Accès rapides
              </h2>
            </div>
          </div>

          <div className="admin-access-list">
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

              <span className="admin-access-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  "customers",
                )
              }
            >
              <strong>
                Clients
              </strong>

              <span className="admin-access-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  "team",
                )
              }
            >
              <strong>
                Équipe
              </strong>

              <span className="admin-access-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  "completed",
                )
              }
            >
              <strong>
                Terminées
              </strong>

              <span className="admin-access-arrow">
                →
              </span>
            </button>
          </div>
        </aside>
      </div>
    </section>
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
    <section className="admin-view">
      <PageHeading
        eyebrow="GESTION"
        title="Réservations"
        description="Consultez les demandes, ouvrez les détails et mettez leur statut à jour."
      />

      <div className="admin-toolbar">
        <form
          className="admin-search"
          onSubmit={onSearchSubmit}
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
              onClick={onClearSearch}
            >
              Effacer
            </button>
          )}

          <button
            type="submit"
            className="admin-search-submit"
          >
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

      <SectionResultHeader
        label="Toutes les réservations"
        count={bookings.length}
        singular="résultat"
        plural="résultats"
      />

      {error && (
        <AdminErrorState
          message={error}
          onRetry={() =>
            onReload()
          }
        />
      )}

      {isLoading ? (
        <AdminLoadingState text="Chargement des réservations..." />
      ) : !error &&
        bookings.length ===
          0 ? (
        <AdminEmptyState message="Aucune réservation trouvée." />
      ) : !error ? (
        <BookingCollection
          bookings={bookings}
          onOpenBooking={
            onOpenBooking
          }
        />
      ) : null}
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
    <section className="admin-view">
      <PageHeading
        eyebrow="RELATION CLIENT"
        title="Clients"
        description="Retrouvez les clients STAY et consultez leur historique de réservation."
      />

      <div className="admin-toolbar admin-toolbar-single">
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

      <SectionResultHeader
        label="Clients enregistrés"
        count={customers.length}
        singular="client"
        plural="clients"
      />

      {error && (
        <AdminErrorState
          message={error}
          onRetry={onReload}
        />
      )}

      {isLoading ? (
        <AdminLoadingState text="Chargement des clients..." />
      ) : !error &&
        customers.length ===
          0 ? (
        <AdminEmptyState message="Aucun client trouvé." />
      ) : !error ? (
        <CustomerCollection
          customers={customers}
          onOpenCustomer={
            onOpenCustomer
          }
        />
      ) : null}
    </section>
  );
}

function TeamView({
  employees,
  isLoading,
  error,
  onReload,
  onCreate,
  onEdit,
}) {
  return (
    <section className="admin-view">
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Équipe"
        description="Gérez les membres de l’équipe et leurs accès à STAY."
      />

      <div className="admin-team-actions">
        <button
          type="button"
          className="admin-add-employee"
          onClick={onCreate}
        >
          Ajouter un membre

          <span>
            +
          </span>
        </button>
      </div>

      <SectionResultHeader
        label="Membres de l’équipe"
        count={employees.length}
        singular="membre"
        plural="membres"
      />

      {error && (
        <AdminErrorState
          message={error}
          onRetry={onReload}
        />
      )}

      {isLoading ? (
        <AdminLoadingState text="Chargement de l’équipe..." />
      ) : !error &&
        employees.length ===
          0 ? (
        <div className="admin-team-empty">
          <h3>
            L’équipe commence ici.
          </h3>

          <p>
            Ajoutez votre premier Manager ou Agent de réservation.
          </p>

          <button
            type="button"
            onClick={onCreate}
          >
            Ajouter un membre

            <span>
              →
            </span>
          </button>
        </div>
      ) : !error ? (
        <EmployeeCollection
          employees={employees}
          onEdit={onEdit}
        />
      ) : null}
    </section>
  );
}

function CompletedView({
  bookings,
  totalCount,
  searchInput,
  isLoading,
  error,
  onSearchChange,
  onReload,
  onOpenBooking,
}) {
  return (
    <section className="admin-view">
      <PageHeading
        eyebrow="ARCHIVES"
        title="Terminées"
        description="Retrouvez toutes les réservations arrivées au terme de leur traitement."
      />

      <div className="admin-toolbar admin-toolbar-single">
        <input
          type="search"
          className="admin-customer-search"
          placeholder="Rechercher une réservation terminée..."
          value={searchInput}
          onChange={(event) =>
            onSearchChange(
              event.target.value,
            )
          }
        />
      </div>

      <SectionResultHeader
        label="Séjours terminés"
        count={bookings.length}
        singular="réservation"
        plural="réservations"
        totalCount={totalCount}
      />

      {error && (
        <AdminErrorState
          message={error}
          onRetry={() =>
            onReload()
          }
        />
      )}

      {isLoading ? (
        <AdminLoadingState text="Chargement des réservations terminées..." />
      ) : !error &&
        bookings.length ===
          0 ? (
        <AdminEmptyState
          message={
            searchInput.trim()
              ? "Aucune réservation terminée ne correspond à votre recherche."
              : "Aucune réservation terminée pour le moment."
          }
        />
      ) : !error ? (
        <BookingCollection
          bookings={bookings}
          onOpenBooking={
            onOpenBooking
          }
        />
      ) : null}
    </section>
  );
}

function SectionResultHeader({
  label,
  count,
  singular,
  plural,
  totalCount,
}) {
  const showingFilteredResults =
    totalCount !== undefined &&
    totalCount !== count;

  return (
    <div className="admin-result-heading">
      <span>
        {label}
      </span>

      <span>
        {count}{" "}
        {count === 1
          ? singular
          : plural}

        {showingFilteredResults
          ? ` sur ${totalCount}`
          : ""}
      </span>
    </div>
  );
}

function BookingCollection({
  bookings,
  onOpenBooking,
}) {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-data-table admin-bookings-table">
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
          </tr>
        </thead>

        <tbody>
          {bookings.map(
            (booking) => (
              <tr
                key={booking.id}
                tabIndex={0}
                onClick={() =>
                  onOpenBooking(
                    booking,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key ===
                      " "
                  ) {
                    event.preventDefault();

                    onOpenBooking(
                      booking,
                    );
                  }
                }}
              >
                <td>
                  <strong>
                    {booking.reference}
                  </strong>
                </td>

                <td>
                  <strong>
                    {booking.customer
                      ?.fullName ||
                      "—"}
                  </strong>

                  <span>
                    {booking.customer
                      ?.email ||
                      "—"}
                  </span>
                </td>

                <td>
                  <strong>
                    {booking.destination
                      ?.name ||
                      "—"}
                  </strong>

                  <span>
                    {booking.destination
                      ?.location ||
                      "—"}
                  </span>
                </td>

                <td>
                  <strong>
                    {formatDate(
                      booking.checkIn,
                    )}
                  </strong>

                  <span>
                    {Number(
                      booking.adults ||
                        0,
                    ) +
                      Number(
                        booking.children ||
                          0,
                      )}{" "}
                    voyageur
                    {Number(
                      booking.adults ||
                        0,
                    ) +
                      Number(
                        booking.children ||
                          0,
                      ) >
                    1
                      ? "s"
                      : ""}
                  </span>
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
  );
}

function CustomerCollection({
  customers,
  onOpenCustomer,
}) {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-data-table admin-customers-table">
        <thead>
          <tr>
            <th>
              Client
            </th>

            <th>
              Téléphone
            </th>

            <th>
              Inscription
            </th>

            <th>
              Réservations
            </th>
          </tr>
        </thead>

        <tbody>
          {customers.map(
            (customer) => (
              <tr
                key={customer.id}
                tabIndex={0}
                onClick={() =>
                  onOpenCustomer(
                    customer,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key ===
                      " "
                  ) {
                    event.preventDefault();

                    onOpenCustomer(
                      customer,
                    );
                  }
                }}
              >
                <td>
                  <strong>
                    {customer.fullName}
                  </strong>

                  <span>
                    {customer.email}
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
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeCollection({
  employees,
  onEdit,
}) {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-data-table admin-employees-table">
        <thead>
          <tr>
            <th>
              Membre
            </th>

            <th>
              Rôle
            </th>

            <th>
              Téléphone
            </th>

            <th>
              Statut
            </th>

            <th>
              Dernière connexion
            </th>
          </tr>
        </thead>

        <tbody>
          {employees.map(
            (employee) => (
              <tr
                key={employee.id}
                tabIndex={0}
                onClick={() =>
                  onEdit(employee)
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key ===
                      " "
                  ) {
                    event.preventDefault();

                    onEdit(
                      employee,
                    );
                  }
                }}
              >
                <td>
                  <strong>
                    {employee.fullName}
                  </strong>

                  <span>
                    {employee.email}
                  </span>
                </td>

                <td>
                  {EMPLOYEE_ROLE_LABELS[
                    employee.role
                  ] ||
                    employee.role}
                </td>

                <td>
                  {employee.phone}
                </td>

                <td>
                  <span
                    className={`admin-employee-status ${
                      employee.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {employee.isActive
                      ? "Actif"
                      : "Inactif"}
                  </span>
                </td>

                <td>
                  {formatDateTime(
                    employee.lastLoginAt,
                  )}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <span
      className={`admin-status-badge ${status}`}
    >
      {STATUS_LABELS[
        status
      ] ||
        status}
    </span>
  );
}

function AdminLoadingState({
  text,
  compact = false,
}) {
  return (
    <div
      className={`admin-state-message ${
        compact
          ? "is-compact"
          : ""
      }`}
    >
      <span className="admin-loader" />

      <p>
        {text}
      </p>
    </div>
  );
}

function AdminEmptyState({
  message,
}) {
  return (
    <div className="admin-state-message admin-empty-message">
      <p>
        {message}
      </p>
    </div>
  );
}

function AdminErrorState({
  message,
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={`admin-state-message admin-error-message ${
        compact
          ? "is-compact"
          : ""
      }`}
    >
      <p>
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
      >
        Réessayer
      </button>
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
                  Détails de la demande
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
                  {booking.customer
                    ?.fullName ||
                    "—"}
                </h3>

                <dl className="admin-detail-list">
                  <div>
                    <dt>
                      Adresse e-mail
                    </dt>

                    <dd>
                      {booking.customer
                        ?.email ||
                        "—"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Téléphone
                    </dt>

                    <dd>
                      {booking.customer
                        ?.phone ||
                        "—"}
                    </dd>
                  </div>
                </dl>

                <div className="admin-customer-actions">
                  {booking.customer
                    ?.email && (
                    <a
                      href={`mailto:${booking.customer.email}`}
                    >
                      E-mail
                    </a>
                  )}

                  {booking.customer
                    ?.phone && (
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
                  {booking.destination
                    ?.name ||
                    "—"}
                </h3>

                <p className="admin-detail-location">
                  {booking.destination
                    ?.location ||
                    "—"}
                </p>

                <dl className="admin-detail-list two-columns">
                  <div>
                    <dt>
                      Arrivée
                    </dt>

                    <dd>
                      {formatDate(
                        booking.checkIn,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Départ
                    </dt>

                    <dd>
                      {formatDate(
                        booking.checkOut,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Adultes
                    </dt>

                    <dd>
                      {booking.adults}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Enfants
                    </dt>

                    <dd>
                      {booking.children}
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
                      Méthode de contact
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
                    Demande particulière
                  </span>

                  <p>
                    {booking.specialRequest ||
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
                  onChange={(event) =>
                    onStatusChange(
                      event.target.value,
                    )
                  }
                >
                  {STATUS_OPTIONS.filter(
                    (status) =>
                      status.value,
                  ).map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>

                {actionMessage.text && (
                  <p
                    className={`admin-action-message ${actionMessage.type}`}
                  >
                    {actionMessage.text}
                  </p>
                )}

                <button
                  type="button"
                  className="admin-save-status"
                  onClick={onSaveStatus}
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
                  {customer.fullName}
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
                      {customer.email}
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
                  Historique des réservations ({bookings.length})
                </span>

                {bookings.length ===
                0 ? (
                  <p className="admin-customer-empty">
                    Aucune réservation enregistrée pour ce client.
                  </p>
                ) : (
                  <ul className="admin-customer-history">
                    {bookings.map(
                      (booking) => (
                        <li
                          key={booking.id}
                        >
                          <div className="admin-history-top">
                            <span className="admin-reference">
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

                          <strong>
                            {booking.destination
                              ?.name ||
                              "—"}
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

function EmployeeDrawer({
  isOpen,
  employee,
  form,
  message,
  temporaryPin,
  isSaving,
  isResettingPin,
  isUpdatingStatus,
  onChange,
  onSubmit,
  onStatusChange,
  onResetPin,
  onCopyPin,
  onClose,
}) {
  return (
    <>
      <div
        className={`admin-drawer-backdrop ${
          isOpen
            ? "is-visible"
            : ""
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`admin-booking-drawer admin-employee-drawer ${
          isOpen
            ? "is-open"
            : ""
        }`}
        aria-hidden={!isOpen}
      >
        {isOpen && (
          <>
            <header className="admin-drawer-header">
              <div>
                <span>
                  {employee
                    ? "Gestion du membre"
                    : "Nouveau membre"}
                </span>

                <h2>
                  {employee
                    ? employee.fullName
                    : "Ajouter à l’équipe"}
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

            <form
              className="admin-employee-form"
              onSubmit={onSubmit}
            >
              <div className="admin-employee-field">
                <label htmlFor="employee-full-name">
                  Nom complet
                </label>

                <input
                  id="employee-full-name"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={onChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="admin-employee-field">
                <label htmlFor="employee-email">
                  Adresse e-mail
                </label>

                <input
                  id="employee-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="admin-employee-field">
                <label htmlFor="employee-phone">
                  Téléphone
                </label>

                <input
                  id="employee-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={onChange}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="admin-employee-field">
                <label htmlFor="employee-role">
                  Rôle
                </label>

                <select
                  id="employee-role"
                  name="role"
                  value={form.role}
                  onChange={onChange}
                >
                  <option value="reservation_agent">
                    Agent de réservation
                  </option>

                  <option value="manager">
                    Manager
                  </option>
                </select>
              </div>

              {message.text && (
                <p
                  className={`admin-action-message ${message.type}`}
                >
                  {message.text}
                </p>
              )}

              {temporaryPin && (
                <div className="admin-temporary-pin">
                  <span>
                    Code PIN temporaire
                  </span>

                  <strong>
                    {temporaryPin}
                  </strong>

                  <p>
                    Copiez ce code maintenant. Il ne sera plus affiché après fermeture de cette fenêtre.
                  </p>

                  <button
                    type="button"
                    onClick={onCopyPin}
                  >
                    Copier le PIN
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="admin-save-status"
                disabled={isSaving}
              >
                {isSaving
                  ? "Enregistrement..."
                  : employee
                    ? "Enregistrer les modifications"
                    : "Créer le membre"}
              </button>
            </form>

            {employee && (
              <div className="admin-employee-security">
                <span className="admin-detail-label">
                  Accès et sécurité
                </span>

                <div className="admin-employee-security-row">
                  <div>
                    <strong>
                      {employee.isActive
                        ? "Compte actif"
                        : "Compte désactivé"}
                    </strong>

                    <p>
                      {employee.isActive
                        ? "Ce membre peut utiliser son accès personnel à l’espace employé."
                        : "L’accès de ce membre est actuellement bloqué."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onStatusChange(
                        employee,
                      )
                    }
                    disabled={
                      isUpdatingStatus
                    }
                  >
                    {isUpdatingStatus
                      ? "Modification..."
                      : employee.isActive
                        ? "Désactiver"
                        : "Activer"}
                  </button>
                </div>

                <div className="admin-employee-security-row">
                  <div>
                    <strong>
                      Code PIN
                    </strong>

                    <p>
                      Générez un nouveau code temporaire si l’employé a perdu son accès.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onResetPin}
                    disabled={
                      isResettingPin
                    }
                  >
                    {isResettingPin
                      ? "Génération..."
                      : "Réinitialiser"}
                  </button>
                </div>

                <div className="admin-employee-security-row is-static">
                  <div>
                    <strong>
                      Dernière connexion
                    </strong>

                    <p>
                      {formatDateTime(
                        employee.lastLoginAt,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}

export default Admin;
