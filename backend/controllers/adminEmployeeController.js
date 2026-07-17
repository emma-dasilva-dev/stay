const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { pool } = require("../config/db");

const BCRYPT_ROUNDS = 12;

const ALLOWED_EMPLOYEE_ROLES = [
  "manager",
  "reservation_agent",
];

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function generateTemporaryPin() {
  return String(
    crypto.randomInt(100000, 1000000),
  );
}

function mapEmployee(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: Boolean(row.is_active),
    mustChangePin: Boolean(
      row.must_change_pin,
    ),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateEmployeeInput({
  fullName,
  email,
  phone,
  role,
}) {
  if (
    !fullName ||
    !email ||
    !phone ||
    !role
  ) {
    return {
      valid: false,
      message:
        "Le nom complet, l’adresse e-mail, le téléphone et le rôle sont obligatoires.",
    };
  }

  if (
    fullName.length < 2 ||
    fullName.length > 120
  ) {
    return {
      valid: false,
      message:
        "Le nom complet doit contenir entre 2 et 120 caractères.",
    };
  }

  const emailIsValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    );

  if (!emailIsValid) {
    return {
      valid: false,
      message:
        "L’adresse e-mail n’est pas valide.",
    };
  }

  if (
    phone.length < 6 ||
    phone.length > 30
  ) {
    return {
      valid: false,
      message:
        "Le numéro de téléphone n’est pas valide.",
    };
  }

  if (
    !ALLOWED_EMPLOYEE_ROLES.includes(
      role,
    )
  ) {
    return {
      valid: false,
      message:
        "Le rôle sélectionné est invalide.",
    };
  }

  return {
    valid: true,
  };
}

async function emailAlreadyExists(
  email,
  ignoredEmployeeId = null,
) {
  const [existingUsers] =
    await pool.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
    );

  if (existingUsers.length > 0) {
    return true;
  }

  let query = `
    SELECT id
    FROM employees
    WHERE email = ?
  `;

  const parameters = [email];

  if (ignoredEmployeeId) {
    query += `
      AND id <> ?
    `;

    parameters.push(
      ignoredEmployeeId,
    );
  }

  query += `
    LIMIT 1
  `;

  const [existingEmployees] =
    await pool.execute(
      query,
      parameters,
    );

  return existingEmployees.length > 0;
}

async function getEmployees(req, res) {
  try {
    const [rows] =
      await pool.execute(`
        SELECT
          id,
          full_name,
          email,
          phone,
          role,
          is_active,
          must_change_pin,
          last_login_at,
          created_at,
          updated_at
        FROM employees
        ORDER BY
          is_active DESC,
          created_at DESC
      `);

    return res.status(200).json({
      success: true,
      count: rows.length,
      employees: rows.map(mapEmployee),
    });
  } catch (error) {
    console.error(
      "Admin get employees error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les membres de l’équipe.",
    });
  }
}

async function createEmployee(req, res) {
  try {
    const fullName = String(
      req.body.fullName || "",
    ).trim();

    const email = normalizeEmail(
      req.body.email,
    );

    const phone = normalizePhone(
      req.body.phone,
    );

    const role = String(
      req.body.role || "",
    ).trim();

    const validation =
      validateEmployeeInput({
        fullName,
        email,
        phone,
        role,
      });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const emailExists =
      await emailAlreadyExists(email);

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message:
          "Cette adresse e-mail est déjà utilisée.",
      });
    }

    const temporaryPin =
      generateTemporaryPin();

    const pinHash = await bcrypt.hash(
      temporaryPin,
      BCRYPT_ROUNDS,
    );

    const [result] =
      await pool.execute(
        `
        INSERT INTO employees (
          full_name,
          email,
          phone,
          role,
          pin_hash,
          is_active,
          must_change_pin,
          created_by_user_id
        )
        VALUES (?, ?, ?, ?, ?, TRUE, TRUE, ?)
        `,
        [
          fullName,
          email,
          phone,
          role,
          pinHash,
          req.user.id,
        ],
      );

    const [createdEmployees] =
      await pool.execute(
        `
        SELECT
          id,
          full_name,
          email,
          phone,
          role,
          is_active,
          must_change_pin,
          last_login_at,
          created_at,
          updated_at
        FROM employees
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId],
      );

    return res.status(201).json({
      success: true,
      message:
        "Le membre de l’équipe a été créé.",
      employee: mapEmployee(
        createdEmployees[0],
      ),

      /*
       * This PIN is returned only once.
       * It is never stored in plain text.
       */
      temporaryPin,
    });
  } catch (error) {
    console.error(
      "Admin create employee error:",
      error,
    );

    if (
      error.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Cette adresse e-mail est déjà utilisée.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible de créer ce membre de l’équipe.",
    });
  }
}

async function updateEmployee(req, res) {
  try {
    const employeeId = Number(
      req.params.employeeId,
    );

    if (
      !Number.isInteger(employeeId) ||
      employeeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "L’identifiant de l’employé est invalide.",
      });
    }

    const fullName = String(
      req.body.fullName || "",
    ).trim();

    const email = normalizeEmail(
      req.body.email,
    );

    const phone = normalizePhone(
      req.body.phone,
    );

    const role = String(
      req.body.role || "",
    ).trim();

    const validation =
      validateEmployeeInput({
        fullName,
        email,
        phone,
        role,
      });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const [existingEmployees] =
      await pool.execute(
        `
        SELECT id
        FROM employees
        WHERE id = ?
        LIMIT 1
        `,
        [employeeId],
      );

    if (
      existingEmployees.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Membre de l’équipe introuvable.",
      });
    }

    const emailExists =
      await emailAlreadyExists(
        email,
        employeeId,
      );

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message:
          "Cette adresse e-mail est déjà utilisée.",
      });
    }

    await pool.execute(
      `
      UPDATE employees
      SET
        full_name = ?,
        email = ?,
        phone = ?,
        role = ?
      WHERE id = ?
      `,
      [
        fullName,
        email,
        phone,
        role,
        employeeId,
      ],
    );

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
          must_change_pin,
          last_login_at,
          created_at,
          updated_at
        FROM employees
        WHERE id = ?
        LIMIT 1
        `,
        [employeeId],
      );

    return res.status(200).json({
      success: true,
      message:
        "Les informations ont été mises à jour.",
      employee: mapEmployee(
        updatedEmployees[0],
      ),
    });
  } catch (error) {
    console.error(
      "Admin update employee error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de modifier ce membre de l’équipe.",
    });
  }
}

async function updateEmployeeStatus(
  req,
  res,
) {
  try {
    const employeeId = Number(
      req.params.employeeId,
    );

    const isActive =
      req.body.isActive;

    if (
      !Number.isInteger(employeeId) ||
      employeeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "L’identifiant de l’employé est invalide.",
      });
    }

    if (
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le statut demandé est invalide.",
      });
    }

    const [result] =
      await pool.execute(
        `
        UPDATE employees
        SET is_active = ?
        WHERE id = ?
        `,
        [
          isActive,
          employeeId,
        ],
      );

    if (
      result.affectedRows === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Membre de l’équipe introuvable.",
      });
    }

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
          must_change_pin,
          last_login_at,
          created_at,
          updated_at
        FROM employees
        WHERE id = ?
        LIMIT 1
        `,
        [employeeId],
      );

    return res.status(200).json({
      success: true,
      message: isActive
        ? "L’accès de l’employé a été activé."
        : "L’accès de l’employé a été désactivé.",
      employee: mapEmployee(
        updatedEmployees[0],
      ),
    });
  } catch (error) {
    console.error(
      "Admin employee status error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de modifier l’accès de cet employé.",
    });
  }
}

async function resetEmployeePin(
  req,
  res,
) {
  try {
    const employeeId = Number(
      req.params.employeeId,
    );

    if (
      !Number.isInteger(employeeId) ||
      employeeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "L’identifiant de l’employé est invalide.",
      });
    }

    const [employees] =
      await pool.execute(
        `
        SELECT id
        FROM employees
        WHERE id = ?
        LIMIT 1
        `,
        [employeeId],
      );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Membre de l’équipe introuvable.",
      });
    }

    const temporaryPin =
      generateTemporaryPin();

    const pinHash = await bcrypt.hash(
      temporaryPin,
      BCRYPT_ROUNDS,
    );

    await pool.execute(
      `
      UPDATE employees
      SET
        pin_hash = ?,
        must_change_pin = TRUE
      WHERE id = ?
      `,
      [
        pinHash,
        employeeId,
      ],
    );

    return res.status(200).json({
      success: true,
      message:
        "Un nouveau code PIN temporaire a été généré.",

      /*
       * Returned only once.
       */
      temporaryPin,
    });
  } catch (error) {
    console.error(
      "Admin reset employee PIN error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de réinitialiser le code PIN.",
    });
  }
}

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  resetEmployeePin,
};
