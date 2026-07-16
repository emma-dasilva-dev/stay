const express = require("express");

const {
  getActiveDestinations,
} = require("../controllers/destinationController");

const router = express.Router();

router.get("/", getActiveDestinations);

module.exports = router;
