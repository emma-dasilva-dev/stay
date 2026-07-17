const express = require("express");

const {
  getDashboardStats,
  getAllBookings,
  updateBookingStatus,
  getCustomers,
} = require("../controllers/adminController");

const {
  getEmployees,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  resetEmployeePin,
} = require("../controllers/adminEmployeeController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * Every route in this router currently requires:
 *
 * 1. A valid JWT
 * 2. The existing STAY admin role
 *
 * At this stage, this represents the Super Admin.
 */
router.use(
  authenticateToken,
  requireAdmin,
);

/* Dashboard */
router.get(
  "/stats",
  getDashboardStats,
);

/* Reservations */
router.get(
  "/bookings",
  getAllBookings,
);

router.patch(
  "/bookings/:bookingId/status",
  updateBookingStatus,
);

/* Customers */
router.get(
  "/customers",
  getCustomers,
);

/* Team */
router.get(
  "/employees",
  getEmployees,
);

router.post(
  "/employees",
  createEmployee,
);

router.put(
  "/employees/:employeeId",
  updateEmployee,
);

router.patch(
  "/employees/:employeeId/status",
  updateEmployeeStatus,
);

router.post(
  "/employees/:employeeId/reset-pin",
  resetEmployeePin,
);

module.exports = router;
