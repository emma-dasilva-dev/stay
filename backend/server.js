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

const app = express();

const PORT = Number(process.env.PORT || 5000);

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

    app.listen(PORT, () => {
      console.log(
        `STAY backend running at http://localhost:${PORT}`,
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
