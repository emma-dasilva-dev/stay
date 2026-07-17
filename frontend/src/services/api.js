/*
 * In production, VITE_API_URL must be set explicitly to the real API domain.
 * In local development, when it is left unset, the API is assumed to be on
 * the same machine that served the page, on port 5000. This works from the
 * laptop and from another device on the same local network without hardcoding
 * a development IP address.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const TOKEN_KEY = "stay_access_token";
const USER_KEY = "stay_user";

export function resolveAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Impossible de joindre le serveur STAY. Vérifiez votre connexion.",
      0,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || "Une erreur est survenue.",
      response.status,
    );
  }

  return data;
}

export const authApi = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: payload,
    }),

  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: payload,
    }),

  me: () => request("/auth/me"),
};

export const destinationsApi = {
  list: () => request("/destinations"),
};

export const bookingsApi = {
  create: (payload) =>
    request("/bookings", {
      method: "POST",
      body: payload,
    }),

  myBookings: () => request("/bookings/my-bookings"),
};

export const adminApi = {
  stats: () => request("/admin/stats"),

  bookings: ({ status, search } = {}) => {
    const query = new URLSearchParams();

    if (status) {
      query.set("status", status);
    }

    if (search) {
      query.set("search", search);
    }

    const queryString = query.toString();

    return request(
      `/admin/bookings${queryString ? `?${queryString}` : ""}`,
    );
  },

  updateBookingStatus: (bookingId, status) =>
    request(`/admin/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: { status },
    }),

  customers: () => request("/admin/customers"),

  employees: () => request("/admin/employees"),

  createEmployee: (payload) =>
    request("/admin/employees", {
      method: "POST",
      body: payload,
    }),

  updateEmployee: (employeeId, payload) =>
    request(`/admin/employees/${employeeId}`, {
      method: "PUT",
      body: payload,
    }),

  updateEmployeeStatus: (employeeId, isActive) =>
    request(`/admin/employees/${employeeId}/status`, {
      method: "PATCH",
      body: { isActive },
    }),

  resetEmployeePin: (employeeId) =>
    request(`/admin/employees/${employeeId}/reset-pin`, {
      method: "POST",
    }),
};