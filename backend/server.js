require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const {
  testDatabaseConnection,
} = require("./config/db");

/*
 * Route imports
 */
const authRoutes =
  require("./routes/authRoutes");

const bookingRoutes =
  require("./routes/bookingRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const destinationRoutes =
  require("./routes/destinationRoutes");

const employeeAuthRoutes =
  require(
    "./routes/employeeAuthRoutes",
  );

const employeeWorkspaceRoutes =
  require(
    "./routes/employeeWorkspaceRoutes",
  );

const app = express();

const PORT = Number(
  process.env.PORT || 5000,
);

const IS_PRODUCTION =
  process.env.NODE_ENV ===
  "production";

app.disable("x-powered-by");

/*
 * Production frontend origins configured through .env.
 */
const staticAllowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean);

/*
 * Allow localhost and private LAN IP addresses during
 * development.
 *
 * This lets STAY work from:
 *
 * - localhost
 * - another laptop
 * - a phone on the same Wi-Fi
 */
const LOCAL_NETWORK_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(
      origin,
      callback,
    ) {
      /*
       * Requests without an Origin header can come from
       * tools such as Postman or server-to-server calls.
       */
      if (
        !origin ||
        staticAllowedOrigins.includes(
          origin,
        )
      ) {
        return callback(
          null,
          true,
        );
      }

      /*
       * Private network access is permitted only outside
       * production.
       */
      if (
        !IS_PRODUCTION &&
        LOCAL_NETWORK_ORIGIN_PATTERN.test(
          origin,
        )
      ) {
        return callback(
          null,
          true,
        );
      }

      return callback(
        new Error(
          "Origine non autorisée par CORS.",
        ),
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

/*
 * Request body parsing
 */
app.use(
  express.json({
    limit: "100kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb",
  }),
);

/*
 * Uploaded destination images
 */
app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads",
    ),
  ),
);

/*
 * Basic backend status endpoint
 */
app.get(
  "/",
  (req, res) => {
    res
      .status(200)
      .send(
        "STAY backend is running",
      );
  },
);

/*
 * API health check
 */
app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "STAY API is operational.",
    });
  },
);

/* =========================================================
   PUBLIC / CUSTOMER AUTHENTICATION
========================================================= */

app.use(
  "/api/auth",
  authRoutes,
);

/* =========================================================
   CUSTOMER BOOKINGS
========================================================= */

app.use(
  "/api/bookings",
  bookingRoutes,
);

/* =========================================================
   SUPER ADMIN
========================================================= */

app.use(
  "/api/admin",
  adminRoutes,
);

/* =========================================================
   DESTINATIONS
========================================================= */

app.use(
  "/api/destinations",
  destinationRoutes,
);

/* =========================================================
   EMPLOYEE AUTHENTICATION
========================================================= */

app.use(
  "/api/employee-auth",
  employeeAuthRoutes,
);

/* =========================================================
   EMPLOYEE WORKSPACE
========================================================= */

app.use(
  "/api/employee",
  employeeWorkspaceRoutes,
);

/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "Route introuvable.",
    });
  },
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    console.error(
      "Unhandled server error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Une erreur interne est survenue.",
    });
  },
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `STAY backend running at http://localhost:${PORT} ` +
            "(also reachable on your LAN IP for phone testing)",
        );
      },
    );
  } catch (error) {
    console.error(
      "Unable to start STAY backend because MySQL could not be reached:",
      error.message,
    );

    process.exit(1);
  }
}

startServer();
