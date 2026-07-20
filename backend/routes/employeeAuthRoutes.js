 const express =
  require("express");

const {
  loginEmployee,
  getCurrentEmployee,
  logoutEmployee,
} = require(
  "../controllers/employeeAuthController",
);

const {
  authenticateEmployeeToken,
} = require(
  "../middleware/employeeAuthMiddleware",
);

const router =
  express.Router();


router.post(
  "/login",
  loginEmployee,
);


router.get(
  "/me",
  authenticateEmployeeToken,
  getCurrentEmployee,
);


router.post(
  "/logout",
  authenticateEmployeeToken,
  logoutEmployee,
);


module.exports =
  router;
