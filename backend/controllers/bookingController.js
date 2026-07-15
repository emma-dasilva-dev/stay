const crypto = require("crypto");
const { pool } = require("../config/db");

const VALID_CONTACT_METHODS = ["whatsapp", "call"];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseDate(value) {
  const dateValue = normalizeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }

  const date = new Date(`${dateValue}T00:00:00Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateNights(checkIn, checkOut) {
  const difference = checkOut.getTime() - checkIn.getTime();

  return Math.floor(difference / 86400000);
}

function createBookingReference() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `STAY-${datePart}-${randomPart}`;
}

function mapBooking(row) {
  return {
    id: row.id,
    reference: row.reference,
    destinationId: row.destination_id,
    destinationName: row.destination_name,
    destinationLocation: row.destination_location,
    destinationImage: row.destination_image,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    checkIn: row.check_in,
    checkOut: row.check_out,
    adults: row.adults,
    children: row.children,
    specialRequest: row.special_request,
    estimatedTotalFcfa: row.estimated_total_fcfa,
    status: row.status,
    contactMethod: row.contact_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createBooking(req, res) {
  try {
    const destinationId = Number(req.body.destinationId);
    const fullName = normalizeText(req.body.fullName);
    const email = normalizeEmail(req.body.email);
    const phone = normalizeText(req.body.phone);
    const checkInValue = normalizeText(req.body.checkIn);
    const checkOutValue = normalizeText(req.body.checkOut);
    const adults = Number(req.body.adults);
    const children = Number(req.body.children ?? 0);
    const specialRequest =
      normalizeText(req.body.specialRequest) || null;
    const contactMethod =
      normalizeText(req.body.contactMethod) || "whatsapp";

    if (!Number.isInteger(destinationId) || destinationId < 1) {
      return res.status(400).json({
        success: false,
        message: "La destination sélectionnée est invalide.",
      });
    }

    if (fullName.length < 2 || fullName.length > 120) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom complet doit contenir entre 2 et 120 caractères.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "L’adresse e-mail n’est pas valide.",
      });
    }

    if (!phone || phone.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de téléphone est invalide.",
      });
    }

    if (!Number.isInteger(adults) || adults < 1 || adults > 20) {
      return res.status(400).json({
        success: false,
        message:
          "Le nombre d’adultes doit être compris entre 1 et 20.",
      });
    }

    if (
      !Number.isInteger(children) ||
      children < 0 ||
      children > 20
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le nombre d’enfants doit être compris entre 0 et 20.",
      });
    }

    if (!VALID_CONTACT_METHODS.includes(contactMethod)) {
      return res.status(400).json({
        success: false,
        message: "La méthode de contact est invalide.",
      });
    }

    if (
      specialRequest &&
      specialRequest.length > 1500
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La demande particulière est trop longue.",
      });
    }

    const checkIn = parseDate(checkInValue);
    const checkOut = parseDate(checkOutValue);

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Les dates renseignées sont invalides.",
      });
    }

    const nights = calculateNights(checkIn, checkOut);

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message:
          "La date de départ doit être postérieure à la date d’arrivée.",
      });
    }

    const [destinations] = await pool.execute(
      `
        SELECT
          id,
          name,
          location,
          starting_price_fcfa,
          image_path
        FROM destinations
        WHERE id = ?
          AND is_active = TRUE
        LIMIT 1
      `,
      [destinationId],
    );

    if (destinations.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Cette destination n’existe pas ou n’est plus disponible.",
      });
    }

    const destination = destinations[0];

    const estimatedTotalFcfa =
      destination.starting_price_fcfa * nights;

    const reference = createBookingReference();

    const userId = req.user ? Number(req.user.id) : null;

    const [result] = await pool.execute(
      `
        INSERT INTO bookings (
          reference,
          user_id,
          destination_id,
          full_name,
          email,
          phone,
          check_in,
          check_out,
          adults,
          children,
          special_request,
          estimated_total_fcfa,
          status,
          contact_method
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `,
      [
        reference,
        userId,
        destinationId,
        fullName,
        email,
        phone,
        checkInValue,
        checkOutValue,
        adults,
        children,
        specialRequest,
        estimatedTotalFcfa,
        contactMethod,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Votre demande de réservation a été enregistrée.",
      booking: {
        id: result.insertId,
        reference,
        userId,
        destination: {
          id: destination.id,
          name: destination.name,
          location: destination.location,
          imagePath: destination.image_path,
        },
        checkIn: checkInValue,
        checkOut: checkOutValue,
        nights,
        adults,
        children,
        estimatedTotalFcfa,
        status: "pending",
        contactMethod,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Une erreur de référence est survenue. Veuillez réessayer.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible d’enregistrer votre demande pour le moment.",
    });
  }
}

async function getMyBookings(req, res) {
  try {
    const [rows] = await pool.execute(
      `
        SELECT
          b.id,
          b.reference,
          b.destination_id,
          b.full_name,
          b.email,
          b.phone,
          b.check_in,
          b.check_out,
          b.adults,
          b.children,
          b.special_request,
          b.estimated_total_fcfa,
          b.status,
          b.contact_method,
          b.created_at,
          b.updated_at,
          d.name AS destination_name,
          d.location AS destination_location,
          d.image_path AS destination_image
        FROM bookings AS b
        INNER JOIN destinations AS d
          ON d.id = b.destination_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `,
      [req.user.id],
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      bookings: rows.map(mapBooking),
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger vos demandes de réservation.",
    });
  }
}

module.exports = {
  createBooking,
  getMyBookings,
};
