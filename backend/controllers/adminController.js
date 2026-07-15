const { pool } = require("../config/db");

const ALLOWED_BOOKING_STATUSES = [
  "pending",
  "contacted",
  "confirmed",
  "cancelled",
  "completed",
];

function mapBooking(row) {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,

    customer: {
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
    },

    destination: {
      id: row.destination_id,
      name: row.destination_name,
      location: row.destination_location,
      imagePath: row.destination_image,
    },

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

async function getDashboardStats(req, res) {
  try {
    const [bookingStats] = await pool.execute(`
      SELECT
        COUNT(*) AS totalBookings,
        SUM(status = 'pending') AS pendingBookings,
        SUM(status = 'contacted') AS contactedBookings,
        SUM(status = 'confirmed') AS confirmedBookings,
        SUM(status = 'cancelled') AS cancelledBookings,
        SUM(status = 'completed') AS completedBookings
      FROM bookings
    `);

    const [userStats] = await pool.execute(`
      SELECT
        COUNT(*) AS totalCustomers
      FROM users
      WHERE role = 'customer'
    `);

    const stats = bookingStats[0];

    return res.status(200).json({
      success: true,
      stats: {
        totalBookings: Number(stats.totalBookings || 0),
        pendingBookings: Number(stats.pendingBookings || 0),
        contactedBookings: Number(
          stats.contactedBookings || 0,
        ),
        confirmedBookings: Number(
          stats.confirmedBookings || 0,
        ),
        cancelledBookings: Number(
          stats.cancelledBookings || 0,
        ),
        completedBookings: Number(
          stats.completedBookings || 0,
        ),
        totalCustomers: Number(
          userStats[0].totalCustomers || 0,
        ),
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les statistiques administratives.",
    });
  }
}

async function getAllBookings(req, res) {
  try {
    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim();

    if (
      status &&
      !ALLOWED_BOOKING_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Le statut demandé est invalide.",
      });
    }

    const conditions = [];
    const parameters = [];

    if (status) {
      conditions.push("b.status = ?");
      parameters.push(status);
    }

    if (search) {
      conditions.push(`
        (
          b.reference LIKE ?
          OR b.full_name LIKE ?
          OR b.email LIKE ?
          OR b.phone LIKE ?
          OR d.name LIKE ?
        )
      `);

      const searchValue = `%${search}%`;

      parameters.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [rows] = await pool.execute(
      `
        SELECT
          b.id,
          b.reference,
          b.user_id,
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

        ${whereClause}

        ORDER BY b.created_at DESC
      `,
      parameters,
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      bookings: rows.map(mapBooking),
    });
  } catch (error) {
    console.error("Admin get bookings error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les réservations.",
    });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const bookingId = Number(req.params.bookingId);
    const status = String(req.body.status || "").trim();

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({
        success: false,
        message: "L’identifiant de réservation est invalide.",
      });
    }

    if (!ALLOWED_BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau statut est invalide.",
      });
    }

    const [result] = await pool.execute(
      `
        UPDATE bookings
        SET status = ?
        WHERE id = ?
      `,
      [status, bookingId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable.",
      });
    }

    const [updatedBookings] = await pool.execute(
      `
        SELECT
          b.id,
          b.reference,
          b.user_id,
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

        WHERE b.id = ?

        LIMIT 1
      `,
      [bookingId],
    );

    return res.status(200).json({
      success: true,
      message: "Le statut de la réservation a été mis à jour.",
      booking: mapBooking(updatedBookings[0]),
    });
  } catch (error) {
    console.error("Admin update booking error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Impossible de modifier le statut de la réservation.",
    });
  }
}

async function getCustomers(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        COUNT(b.id) AS booking_count

      FROM users AS u

      LEFT JOIN bookings AS b
        ON b.user_id = u.id

      WHERE u.role = 'customer'

      GROUP BY
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.created_at

      ORDER BY u.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      count: rows.length,
      customers: rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        bookingCount: Number(row.booking_count || 0),
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("Admin get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de charger les clients.",
    });
  }
}

module.exports = {
  getDashboardStats,
  getAllBookings,
  updateBookingStatus,
  getCustomers,
};
