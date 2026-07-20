 const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/db");

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const EMPLOYEE_TOKEN_EXPIRES_IN =
  process.env.EMPLOYEE_JWT_EXPIRES_IN || "12h";

const DUMMY_PIN_HASH = bcrypt.hashSync(
  "000000",
  BCRYPT_ROUNDS,
);


/* =========================================================
   HELPERS
========================================================= */

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}


function normalizePin(pin) {
  return String(pin || "").trim();
}


function publicEmployee(row) {
  return {
    id: row.id,

    fullName:
      row.full_name ||
      row.fullName,

    email: row.email,

    phone: row.phone,

    role: row.role,

    isActive: Boolean(
      row.is_active === undefined
        ? row.isActive
        : row.is_active,
    ),

    lastLoginAt:
      row.last_login_at ||
      row.lastLoginAt ||
      null,

    createdAt:
      row.created_at ||
      row.createdAt ||
      null,
  };
}


function createEmployeeAccessToken(
  employee,
  sessionTokenId,
) {
  return jwt.sign(
    {
      tokenType: "employee",

      role:
        employee.role,

      email:
        employee.email,

      sessionId:
        sessionTokenId,
    },

    process.env.JWT_SECRET,

    {
      subject:
        String(employee.id),

      expiresIn:
        EMPLOYEE_TOKEN_EXPIRES_IN,

      algorithm:
        "HS256",

      issuer:
        "stay-api",

      audience:
        "stay-employee-workspace",
    },
  );
}


function getRequestIp(req) {
  const forwardedFor =
    req.headers[
      "x-forwarded-for"
    ];

  if (
    typeof forwardedFor ===
      "string" &&
    forwardedFor.trim()
  ) {
    return forwardedFor
      .split(",")[0]
      .trim()
      .slice(0, 45);
  }

  return (
    String(
      req.ip ||
        req.socket
          ?.remoteAddress ||
        "",
    )
      .trim()
      .slice(0, 45) ||
    null
  );
}


async function logEmployeeActivity({
  employee,
  employeeSessionId,
  action,
  entityType = "employee",
  entityId = null,
  details = null,
}) {
  await pool.execute(
    `
    INSERT INTO activity_logs (
      actor_type,
      employee_id,
      employee_session_id,
      actor_name,
      actor_role,
      action,
      entity_type,
      entity_id,
      details
    )
    VALUES (
      'employee',
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    )
    `,

    [
      employee.id,

      employeeSessionId ||
        null,

      employee.full_name ||
        employee.fullName,

      employee.role,

      action,

      entityType,

      entityId ||
        employee.id,

      details
        ? JSON.stringify(
            details,
          )
        : null,
    ],
  );
}


/* =========================================================
   EMPLOYEE LOGIN
========================================================= */

async function loginEmployee(
  req,
  res,
) {
  try {
    const email =
      normalizeEmail(
        req.body.email,
      );

    const pin =
      normalizePin(
        req.body.pin,
      );


    if (
      !email ||
      !pin
    ) {
      return res
        .status(400)
        .json({
          success: false,

          code:
            "EMPLOYEE_CREDENTIALS_REQUIRED",

          message:
            "L’adresse e-mail et le code PIN sont obligatoires.",
        });
    }


    if (
      !/^\d{6}$/.test(
        pin,
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          code:
            "INVALID_PIN_FORMAT",

          message:
            "Le code PIN doit contenir exactement 6 chiffres.",
        });
    }


    const [employees] =
      await pool.execute(
        `
        SELECT
          id,
          full_name,
          email,
          phone,
          role,
          pin_hash,
          is_active,
          failed_login_attempts,
          locked_until,
          last_login_at,
          created_at
        FROM employees
        WHERE email = ?
        LIMIT 1
        `,

        [email],
      );


    const employee =
      employees[0];


    /*
     * Perform a bcrypt comparison even
     * when the email does not exist.
     *
     * This reduces timing differences
     * between an unknown email and an
     * incorrect PIN.
     */

    if (!employee) {
      await bcrypt.compare(
        pin,
        DUMMY_PIN_HASH,
      );

      return res
        .status(401)
        .json({
          success: false,

          code:
            "INVALID_EMPLOYEE_CREDENTIALS",

          message:
            "Adresse e-mail ou code PIN incorrect.",
        });
    }


    if (
      !employee.is_active
    ) {
      return res
        .status(403)
        .json({
          success: false,

          code:
            "EMPLOYEE_ACCESS_DISABLED",

          message:
            "Votre accès employé a été désactivé.",
        });
    }


    if (
      employee.locked_until &&
      new Date(
        employee.locked_until,
      ).getTime() >
        Date.now()
    ) {
      return res
        .status(429)
        .json({
          success: false,

          code:
            "EMPLOYEE_ACCOUNT_LOCKED",

          message:
            "Trop de tentatives ont été effectuées. Réessayez dans quelques minutes.",
        });
    }


    const pinMatches =
      await bcrypt.compare(
        pin,
        employee.pin_hash,
      );


    if (!pinMatches) {
      const nextAttemptCount =
        Number(
          employee
            .failed_login_attempts ||
            0,
        ) + 1;


      if (
        nextAttemptCount >=
        MAX_FAILED_ATTEMPTS
      ) {
        await pool.execute(
          `
          UPDATE employees
          SET
            failed_login_attempts = 0,

            locked_until =
              DATE_ADD(
                CURRENT_TIMESTAMP,
                INTERVAL ? MINUTE
              )

          WHERE id = ?
          `,

          [
            LOCK_DURATION_MINUTES,
            employee.id,
          ],
        );


        return res
          .status(429)
          .json({
            success: false,

            code:
              "EMPLOYEE_ACCOUNT_LOCKED",

            message:
              "Trop de tentatives ont été effectuées. Réessayez dans 15 minutes.",
          });
      }


      await pool.execute(
        `
        UPDATE employees

        SET
          failed_login_attempts = ?

        WHERE id = ?
        `,

        [
          nextAttemptCount,
          employee.id,
        ],
      );


      return res
        .status(401)
        .json({
          success: false,

          code:
            "INVALID_EMPLOYEE_CREDENTIALS",

          message:
            "Adresse e-mail ou code PIN incorrect.",
        });
    }


    const sessionTokenId =
      crypto.randomUUID();


    const ipAddress =
      getRequestIp(req);


    const userAgent =
      String(
        req.headers[
          "user-agent"
        ] || "",
      )
        .trim()
        .slice(0, 500) ||
      null;


    const [sessionResult] =
      await pool.execute(
        `
        INSERT INTO employee_sessions (
          employee_id,
          session_token_id,
          logged_in_at,
          last_seen_at,
          ip_address,
          user_agent,
          is_active
        )
        VALUES (
          ?,
          ?,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          ?,
          ?,
          TRUE
        )
        `,

        [
          employee.id,
          sessionTokenId,
          ipAddress,
          userAgent,
        ],
      );


    await pool.execute(
      `
      UPDATE employees

      SET
        failed_login_attempts = 0,

        locked_until = NULL,

        last_login_at =
          CURRENT_TIMESTAMP

      WHERE id = ?
      `,

      [employee.id],
    );


    await logEmployeeActivity({
      employee,

      employeeSessionId:
        sessionResult.insertId,

      action:
        "employee_login",

      details: {
        ipAddress,
      },
    });


    const [updatedEmployees] =
      await pool.execute(
        `
        SELECT
          id,
          full_name,
          email,
          phone,
          role,
          is_active,
          last_login_at,
          created_at
        FROM employees
        WHERE id = ?
        LIMIT 1
        `,

        [employee.id],
      );


    const updatedEmployee =
      updatedEmployees[0];


    const token =
      createEmployeeAccessToken(
        updatedEmployee,
        sessionTokenId,
      );


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Connexion employé réussie.",

        token,

        employee:
          publicEmployee(
            updatedEmployee,
          ),
      });
  } catch (error) {
    console.error(
      "Employee login error:",
      error,
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Impossible de vous connecter pour le moment.",
      });
  }
}


/* =========================================================
   CURRENT EMPLOYEE
========================================================= */

async function getCurrentEmployee(
  req,
  res,
) {
  return res
    .status(200)
    .json({
      success: true,

      employee:
        req.employee,
    });
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutEmployee(
  req,
  res,
) {
  try {
    await pool.execute(
      `
      UPDATE employee_sessions

      SET
        is_active = FALSE,

        logged_out_at =
          CURRENT_TIMESTAMP,

        last_seen_at =
          CURRENT_TIMESTAMP

      WHERE id = ?
      `,

      [
        req.employeeSession.id,
      ],
    );


    await logEmployeeActivity({
      employee:
        req.employee,

      employeeSessionId:
        req.employeeSession.id,

      action:
        "employee_logout",
    });


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Vous êtes déconnecté de l’espace employé.",
      });
  } catch (error) {
    console.error(
      "Employee logout error:",
      error,
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Impossible de terminer la session correctement.",
      });
  }
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  loginEmployee,

  getCurrentEmployee,

  logoutEmployee,
};
