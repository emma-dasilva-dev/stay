require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const {
  testDatabaseConnection,
} = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const destinationRoutes = require("./routes/destinationRoutes");

const app = express();

const PORT = Number(process.env.PORT || 5000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

app.disable("x-powered-by");

/*
  Origins that are always allowed, in every environment: the explicit
  production frontend URL, when configured.
*/
const staticAllowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

/*
  Outside production, also allow any localhost/private-LAN origin on any
  port. This is what lets the Vite dev server work both from the laptop
  (localhost) and from a phone on the same Wi-Fi (whatever LAN IP it was
  given by the router) without hardcoding that IP anywhere.
*/
const LOCAL_NETWORK_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || staticAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (
        !IS_PRODUCTION &&
        LOCAL_NETWORK_ORIGIN_PATTERN.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origine non autorisée par CORS."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads")),
);

app.get("/", (req, res) => {
  res.status(200).send("STAY backend is running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "STAY API is operational.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/destinations", destinationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable.",
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    success: false,
    message: "Une erreur interne est survenue.",
  });
});

async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `STAY backend running at http://localhost:${PORT} ` +
          "(also reachable on your LAN IP for phone testing)",
      );
    });
  } catch (error) {
    console.error(
      "Unable to start STAY backend because MySQL could not be reached:",
      error.message,
    );

    process.exit(1);
  }
}

startServer();
