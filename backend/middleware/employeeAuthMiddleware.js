const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

/*
 * Extract the Bearer token from the Authorization header.
 *
 * Expected format:
 * Authorization: Bearer <token>
 */
function getBearerToken(req) {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return null;
  }

  return authorizationHeader.slice(7).trim() || null;
}

/*
 * Authenticate an employee using:
 *
 * 1. The employee JWT
 * 2. The employee database record
 * 3. The employee session stored in employee_sessions
 * 4. The employee account active status
 *
 * Never trust the role stored only inside the JWT.
 * The current role is always loaded again from the database.
 */
async function authenticateEmployeeToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "EMPLOYEE_AUTH_REQUIRED",
      message: "Authentification employé requise.",
    });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
        issuer: "stay-api",
        audience: "stay-employee-workspace",
      },
    );

    if (
      decodedToken.tokenType !== "employee" ||
      !decodedToken.sessionId
    ) {
      return res.status(401).json({
        success: false,
        code: "INVALID_EMPLOYEE_TOKEN",
        message: "Session employé invalide.",
      });
    }

    const employeeId = Number(decodedToken.sub);

    if (
      !Number.isInteger(employeeId) ||
      employeeId < 1
    ) {
      return res.status(401).json({
        success: false,
        code: "INVALID_EMPLOYEE_TOKEN",
        message: "Session employé invalide.",
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        e.id,
        e.full_name,
        e.email,
        e.phone,
        e.role,
        e.is_active,
        e.last_login_at,
        e.created_at,
        s.id AS employee_session_id,
        s.session_token_id,
        s.is_active AS session_is_active
      FROM employee_sessions AS s
      INNER JOIN employees AS e
        ON e.id = s.employee_id
      WHERE
        s.session_token_id = ?
        AND s.employee_id = ?
      LIMIT 1
      `,
      [
        decodedToken.sessionId,
        employeeId,
      ],
    );

    if (
      rows.length === 0 ||
      !rows[0].session_is_active
    ) {
      return res.status(401).json({
        success: false,
        code: "EMPLOYEE_SESSION_ENDED",
        message:
          "Votre session employé n’est plus active.",
      });
    }

    if (!rows[0].is_active) {
      return res.status(403).json({
        success: false,
        code: "EMPLOYEE_ACCESS_DISABLED",
        message:
          "Votre accès employé a été désactivé.",
      });
    }

    /*
     * Store the authenticated employee on the request.
     *
     * Controllers and permission middleware can safely
     * use req.employee after this point.
     */
    req.employee = {
      id: rows[0].id,
      fullName: rows[0].full_name,
      email: rows[0].email,
      phone: rows[0].phone,
      role: rows[0].role,
      isActive: Boolean(rows[0].is_active),
      lastLoginAt: rows[0].last_login_at,
      createdAt: rows[0].created_at,
    };

    req.employeeSession = {
      id: rows[0].employee_session_id,
      sessionTokenId:
        rows[0].session_token_id,
    };

    /*
     * Record that this active session was recently used.
     */
    await pool.execute(
      `
      UPDATE employee_sessions
      SET last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [req.employeeSession.id],
    );

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,

      code:
        error.name === "TokenExpiredError"
          ? "EMPLOYEE_SESSION_EXPIRED"
          : "INVALID_EMPLOYEE_TOKEN",

      message:
        error.name === "TokenExpiredError"
          ? "Votre session employé a expiré. Veuillez vous reconnecter."
          : "Session employé invalide.",
    });
  }
}

/*
 * Role authorization middleware.
 *
 * Example:
 *
 * requireEmployeeRoles(
 *   "manager",
 *   "reservation_agent",
 * )
 */
function requireEmployeeRoles(...allowedRoles) {
  const allowedRoleSet = new Set(
    allowedRoles,
  );

  return function employeeRoleAuthorization(
    req,
    res,
    next,
  ) {
    if (!req.employee) {
      return res.status(401).json({
        success: false,
        code: "EMPLOYEE_AUTH_REQUIRED",
        message:
          "Authentification employé requise.",
      });
    }

    if (
      !allowedRoleSet.has(
        req.employee.role,
      )
    ) {
      return res.status(403).json({
        success: false,
        code: "EMPLOYEE_PERMISSION_DENIED",
        message:
          "Vous n’avez pas l’autorisation d’effectuer cette action.",
      });
    }

    return next();
  };
}

module.exports = {
  authenticateEmployeeToken,
  requireEmployeeRoles,
};
