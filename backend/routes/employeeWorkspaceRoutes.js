const express = require("express");

const {
  getEmployeeBookings,
  updateEmployeeBookingStatus,
  getEmployeeCustomers,
} = require(
  "../controllers/employeeWorkspaceController",
);

const {
  authenticateEmployeeToken,
  requireEmployeeRoles,
} = require(
  "../middleware/employeeAuthMiddleware",
);

const router =
  express.Router();

/*
 * Every route below requires a valid employee session.
 *
 * This verifies:
 *
 * - JWT
 * - employee database account
 * - active employee session
 * - active employee account
 */
router.use(
  authenticateEmployeeToken,
);

/*
 * Current operational roles.
 *
 * Both roles can manage reservations and access
 * the client information required for that work.
 *
 * Super Admin features remain completely separate.
 */
const requireOperationalEmployee =
  requireEmployeeRoles(
    "manager",
    "reservation_agent",
  );

/*
 * Reservations
 */
router.get(
  "/bookings",
  requireOperationalEmployee,
  getEmployeeBookings,
);

router.patch(
  "/bookings/:bookingId/status",
  requireOperationalEmployee,
  updateEmployeeBookingStatus,
);

/*
 * Customers
 */
router.get(
  "/customers",
  requireOperationalEmployee,
  getEmployeeCustomers,
);

module.exports = router;
