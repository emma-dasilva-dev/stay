const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_LENGTH = 72;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function createAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      algorithm: "HS256",
    },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

async function register(req, res) {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom complet, l’adresse e-mail et le mot de passe sont obligatoires.",
      });
    }

    if (fullName.length < 2 || fullName.length > 120) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom complet doit contenir entre 2 et 120 caractères.",
      });
    }

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailIsValid) {
      return res.status(400).json({
        success: false,
        message: "L’adresse e-mail n’est pas valide.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe est trop long. Utilisez au maximum 72 caractères simples.",
      });
    }

    const [existingUsers] = await pool.execute(
      `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Un compte existe déjà avec cette adresse e-mail.",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      BCRYPT_ROUNDS,
    );

    const [result] = await pool.execute(
      `
        INSERT INTO users (
          full_name,
          email,
          phone,
          password_hash,
          role
        )
        VALUES (?, ?, ?, ?, 'customer')
      `,
      [fullName, email, phone || null, passwordHash],
    );

    const [createdUsers] = await pool.execute(
      `
        SELECT
          id,
          full_name,
          email,
          phone,
          role,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    const user = createdUsers[0];
    const token = createAccessToken(user);

    return res.status(201).json({
      success: true,
      message: "Votre compte STAY a été créé.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Un compte existe déjà avec cette adresse e-mail.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible de créer le compte pour le moment.",
    });
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "L’adresse e-mail et le mot de passe sont obligatoires.",
      });
    }

    const [users] = await pool.execute(
      `
        SELECT
          id,
          full_name,
          email,
          phone,
          password_hash,
          role,
          created_at
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Adresse e-mail ou mot de passe incorrect.",
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Adresse e-mail ou mot de passe incorrect.",
      });
    }

    const token = createAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Impossible de vous connecter pour le moment.",
    });
  }
}

async function getCurrentUser(req, res) {
  try {
    const [users] = await pool.execute(
      `
        SELECT
          id,
          full_name,
          email,
          phone,
          role,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      user: publicUser(users[0]),
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger votre compte pour le moment.",
    });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
};
