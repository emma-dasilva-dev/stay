const express = require("express");

const {
  createBooking,
  getMyBookings,
} = require("../controllers/bookingController");

const {
  authenticateToken,
  optionalAuthenticateToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Guests and logged-in users can submit a booking.
  When a valid token exists, the request is linked to that user.
*/
router.post(
  "/",
  optionalAuthenticateToken,
  createBooking,
);

/*
  Only authenticated users can view their own booking history.
*/
router.get(
  "/my-bookings",
  authenticateToken,
  getMyBookings,
);

module.exports = router;
