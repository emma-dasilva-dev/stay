const express = require("express");

const {
  getDashboardStats,
  getAllBookings,
  updateBookingStatus,
  getCustomers,
} = require("../controllers/adminController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Every admin route requires:
  1. A valid JWT
  2. The admin role
*/
router.use(authenticateToken, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/bookings", getAllBookings);
router.patch(
  "/bookings/:bookingId/status",
  updateBookingStatus,
);
router.get("/customers", getCustomers);

module.exports = router;
