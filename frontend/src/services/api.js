 /*
 * In production, VITE_API_URL must be set
 * explicitly to the real API domain.
 *
 * In development, the backend is assumed
 * to run on the same machine on port 5000.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/api`;


const API_ORIGIN =
  API_BASE_URL.replace(
    /\/api\/?$/,
    "",
  );


/* Customer / Admin session */

const TOKEN_KEY =
  "stay_access_token";

const USER_KEY =
  "stay_user";


/* Employee session */

const EMPLOYEE_TOKEN_KEY =
  "stay_employee_access_token";

const EMPLOYEE_USER_KEY =
  "stay_employee_user";


/* =========================================================
   ASSET URL
========================================================= */

export function resolveAssetUrl(
  path,
) {
  if (!path) {
    return "";
  }


  if (
    /^https?:\/\//i.test(
      path,
    )
  ) {
    return path;
  }


  return `${API_ORIGIN}${
    path.startsWith("/")
      ? path
      : `/${path}`
  }`;
}


/* =========================================================
   API ERROR
========================================================= */

export class ApiError extends Error {
  constructor(
    message,
    status,
    code = "",
  ) {
    super(message);


    this.name =
      "ApiError";


    this.status =
      status;


    this.code =
      code;
  }
}


/* =========================================================
   CUSTOMER / ADMIN SESSION
========================================================= */

export function getToken() {
  return localStorage.getItem(
    TOKEN_KEY,
  );
}


export function getStoredUser() {
  try {
    const raw =
      localStorage.getItem(
        USER_KEY,
      );


    return raw
      ? JSON.parse(raw)
      : null;
  } catch {
    localStorage.removeItem(
      USER_KEY,
    );


    return null;
  }
}


export function saveSession(
  token,
  user,
) {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );


  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );
}


export function clearSession() {
  localStorage.removeItem(
    TOKEN_KEY,
  );


  localStorage.removeItem(
    USER_KEY,
  );
}


/* =========================================================
   EMPLOYEE SESSION
========================================================= */

export function getEmployeeToken() {
  return localStorage.getItem(
    EMPLOYEE_TOKEN_KEY,
  );
}


export function getStoredEmployee() {
  try {
    const raw =
      localStorage.getItem(
        EMPLOYEE_USER_KEY,
      );


    return raw
      ? JSON.parse(raw)
      : null;
  } catch {
    localStorage.removeItem(
      EMPLOYEE_USER_KEY,
    );


    return null;
  }
}


export function saveEmployeeSession(
  token,
  employee,
) {
  localStorage.setItem(
    EMPLOYEE_TOKEN_KEY,
    token,
  );


  localStorage.setItem(
    EMPLOYEE_USER_KEY,
    JSON.stringify(
      employee,
    ),
  );
}


export function updateStoredEmployee(
  employee,
) {
  localStorage.setItem(
    EMPLOYEE_USER_KEY,
    JSON.stringify(
      employee,
    ),
  );
}


export function clearEmployeeSession() {
  localStorage.removeItem(
    EMPLOYEE_TOKEN_KEY,
  );


  localStorage.removeItem(
    EMPLOYEE_USER_KEY,
  );
}


/* =========================================================
   REQUEST HELPER
========================================================= */

async function request(
  path,
  {
    method = "GET",

    body,

    auth = "default",
  } = {},
) {
  const token =
    auth === "employee"
      ? getEmployeeToken()

      : auth === "none"
        ? null

        : getToken();


  const headers = {};


  if (
    body !== undefined
  ) {
    headers[
      "Content-Type"
    ] =
      "application/json";
  }


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  let response;


  try {
    response =
      await fetch(
        `${API_BASE_URL}${path}`,

        {
          method,

          headers,

          body:
            body !== undefined
              ? JSON.stringify(
                  body,
                )
              : undefined,
        },
      );
  } catch {
    throw new ApiError(
      "Impossible de joindre le serveur STAY. Vérifiez votre connexion.",

      0,
    );
  }


  const data =
    await response
      .json()
      .catch(
        () => ({}),
      );


  if (!response.ok) {
    throw new ApiError(
      data.message ||
        "Une erreur est survenue.",

      response.status,

      data.code || "",
    );
  }


  return data;
}


/* =========================================================
   AUTH API
========================================================= */

export const authApi = {
  register:
    (payload) =>
      request(
        "/auth/register",

        {
          method:
            "POST",

          body:
            payload,
        },
      ),


  login:
    (payload) =>
      request(
        "/auth/login",

        {
          method:
            "POST",

          body:
            payload,
        },
      ),


  me:
    () =>
      request(
        "/auth/me",
      ),
};


/* =========================================================
   EMPLOYEE AUTH API
========================================================= */

export const employeeAuthApi = {
  login:
    ({
      email,
      pin,
    }) =>
      request(
        "/employee-auth/login",

        {
          method:
            "POST",

          body: {
            email,
            pin,
          },

          auth:
            "none",
        },
      ),


  me:
    () =>
      request(
        "/employee-auth/me",

        {
          auth:
            "employee",
        },
      ),


  logout:
    () =>
      request(
        "/employee-auth/logout",

        {
          method:
            "POST",

          auth:
            "employee",
        },
      ),
};


/* =========================================================
   DESTINATIONS API
========================================================= */

export const destinationsApi = {
  list:
    () =>
      request(
        "/destinations",
      ),
};


/* =========================================================
   BOOKINGS API
========================================================= */

export const bookingsApi = {
  create:
    (payload) =>
      request(
        "/bookings",

        {
          method:
            "POST",

          body:
            payload,
        },
      ),


  myBookings:
    () =>
      request(
        "/bookings/my-bookings",
      ),
};


/* =========================================================
   ADMIN API
========================================================= */

export const adminApi = {
  stats:
    () =>
      request(
        "/admin/stats",
      ),


  bookings:
    ({
      status,
      search,
    } = {}) => {
      const query =
        new URLSearchParams();


      if (status) {
        query.set(
          "status",
          status,
        );
      }


      if (search) {
        query.set(
          "search",
          search,
        );
      }


      const queryString =
        query.toString();


      return request(
        `/admin/bookings${
          queryString
            ? `?${queryString}`
            : ""
        }`,
      );
    },


  updateBookingStatus:
    (
      bookingId,
      status,
    ) =>
      request(
        `/admin/bookings/${bookingId}/status`,

        {
          method:
            "PATCH",

          body: {
            status,
          },
        },
      ),


  customers:
    () =>
      request(
        "/admin/customers",
      ),


  employees:
    () =>
      request(
        "/admin/employees",
      ),


  createEmployee:
    (payload) =>
      request(
        "/admin/employees",

        {
          method:
            "POST",

          body:
            payload,
        },
      ),


  updateEmployee:
    (
      employeeId,
      payload,
    ) =>
      request(
        `/admin/employees/${employeeId}`,

        {
          method:
            "PUT",

          body:
            payload,
        },
      ),


  updateEmployeeStatus:
    (
      employeeId,
      isActive,
    ) =>
      request(
        `/admin/employees/${employeeId}/status`,

        {
          method:
            "PATCH",

          body: {
            isActive,
          },
        },
      ),


  resetEmployeePin:
    (employeeId) =>
      request(
        `/admin/employees/${employeeId}/reset-pin`,

        {
          method:
            "POST",
        },
      ),
};

/* =========================================================
   EMPLOYEE WORKSPACE API
========================================================= */

export const employeeWorkspaceApi = {
  bookings: ({
    status,
    search,
  } = {}) => {
    const query =
      new URLSearchParams();

    if (status) {
      query.set(
        "status",
        status,
      );
    }

    if (search) {
      query.set(
        "search",
        search,
      );
    }

    const queryString =
      query.toString();

    return request(
      `/employee/bookings${
        queryString
          ? `?${queryString}`
          : ""
      }`,
      {
        auth: "employee",
      },
    );
  },

  updateBookingStatus: (
    bookingId,
    status,
  ) =>
    request(
      `/employee/bookings/${bookingId}/status`,
      {
        method: "PATCH",

        body: {
          status,
        },

        auth: "employee",
      },
    ),

  customers: () =>
    request(
      "/employee/customers",
      {
        auth: "employee",
      },
    ),
};
