const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise.",
    });
  }

  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Jeton d’authentification manquant.",
    });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      },
    );

    req.user = {
      id: decodedToken.sub,
      role: decodedToken.role,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Votre session a expiré. Veuillez vous reconnecter."
          : "Jeton d’authentification invalide.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Accès réservé aux administrateurs.",
    });
  }

  next();
}

function optionalAuthenticateToken(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    req.user = null;
    return next();
  }

  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      },
    );

    req.user = {
      id: Number(decodedToken.sub),
      role: decodedToken.role,
      email: decodedToken.email,
    };
  } catch (error) {
    /*
      A missing/expired/invalid token on an optional route must not block
      the request: fall back to guest access instead of rejecting it.
    */
    req.user = null;
  }

  return next();
}

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireAdmin,
};
