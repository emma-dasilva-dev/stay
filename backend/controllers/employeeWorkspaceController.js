const { pool } = require("../config/db");

const ALLOWED_BOOKING_STATUSES = [
  "pending",
  "contacted",
  "confirmed",
  "cancelled",
  "completed",
];

/*
 * Convert a raw MySQL booking row into the same frontend
 * structure already used by the STAY Admin interface.
 */
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
      location:
        row.destination_location,
      imagePath:
        row.destination_image,
    },

    checkIn: row.check_in,
    checkOut: row.check_out,

    adults: row.adults,
    children: row.children,

    specialRequest:
      row.special_request,

    estimatedTotalFcfa:
      row.estimated_total_fcfa,

    status: row.status,

    contactMethod:
      row.contact_method,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/*
 * Common booking SELECT.
 *
 * Keeping the same data structure as the Admin system
 * prevents frontend inconsistencies.
 */
const BOOKING_SELECT = `
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
`;

/*
 * GET /api/employee/bookings
 *
 * Supported query parameters:
 *
 * ?status=pending
 * ?search=Jean
 *
 * Both can also be combined.
 */
async function getEmployeeBookings(
  req,
  res,
) {
  try {
    const status = String(
      req.query.status || "",
    ).trim();

    const search = String(
      req.query.search || "",
    ).trim();

    if (
      status &&
      !ALLOWED_BOOKING_STATUSES.includes(
        status,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le statut demandé est invalide.",
      });
    }

    const conditions = [];
    const parameters = [];

    if (status) {
      conditions.push(
        "b.status = ?",
      );

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

      const searchValue =
        `%${search}%`;

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
        ? `WHERE ${conditions.join(
            " AND ",
          )}`
        : "";

    const [rows] =
      await pool.execute(
        `
        ${BOOKING_SELECT}

        ${whereClause}

        ORDER BY b.created_at DESC
        `,
        parameters,
      );

    return res.status(200).json({
      success: true,
      count: rows.length,

      bookings:
        rows.map(mapBooking),
    });
  } catch (error) {
    console.error(
      "Employee get bookings error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les réservations.",
    });
  }
}

/*
 * PATCH
 * /api/employee/bookings/:bookingId/status
 *
 * Updates a reservation status and records who made
 * the change inside activity_logs.
 */
async function updateEmployeeBookingStatus(
  req,
  res,
) {
  const bookingId = Number(
    req.params.bookingId,
  );

  const status = String(
    req.body.status || "",
  ).trim();

  if (
    !Number.isInteger(bookingId) ||
    bookingId < 1
  ) {
    return res.status(400).json({
      success: false,
      message:
        "L’identifiant de réservation est invalide.",
    });
  }

  if (
    !ALLOWED_BOOKING_STATUSES.includes(
      status,
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Le nouveau statut est invalide.",
    });
  }

  let connection;

  try {
    /*
     * Use a database transaction because the reservation
     * update and the audit log belong to the same operation.
     */
    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    /*
     * Lock the booking row while updating it so two
     * simultaneous changes cannot silently overwrite
     * the status history.
     */
    const [existingBookings] =
      await connection.execute(
        `
        SELECT
          id,
          reference,
          status
        FROM bookings
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [bookingId],
      );

    if (
      existingBookings.length === 0
    ) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Réservation introuvable.",
      });
    }

    const existingBooking =
      existingBookings[0];

    const previousStatus =
      existingBooking.status;

    /*
     * Only perform an update and create an activity log
     * when the status actually changed.
     */
    if (previousStatus !== status) {
      await connection.execute(
        `
        UPDATE bookings
        SET status = ?
        WHERE id = ?
        `,
        [
          status,
          bookingId,
        ],
      );

      /*
       * Record exactly which employee changed the booking.
       */
      await connection.execute(
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
          'booking_status_updated',
          'booking',
          ?,
          ?
        )
        `,
        [
          req.employee.id,

          req.employeeSession?.id ||
            null,

          req.employee.fullName,

          req.employee.role,

          bookingId,

          JSON.stringify({
            reference:
              existingBooking.reference,

            previousStatus,

            newStatus: status,
          }),
        ],
      );
    }

    const [updatedBookings] =
      await connection.execute(
        `
        ${BOOKING_SELECT}

        WHERE b.id = ?

        LIMIT 1
        `,
        [bookingId],
      );

    await connection.commit();

    return res.status(200).json({
      success: true,

      message:
        previousStatus === status
          ? "La réservation possède déjà ce statut."
          : "Le statut de la réservation a été mis à jour.",

      booking: mapBooking(
        updatedBookings[0],
      ),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Employee booking rollback error:",
          rollbackError,
        );
      }
    }

    console.error(
      "Employee update booking status error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Impossible de modifier le statut de la réservation.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
 * GET /api/employee/customers
 *
 * Return registered STAY customer accounts.
 *
 * Guest bookings remain accessible through the
 * reservations endpoint, but only registered customers
 * appear in this Clients list.
 */
async function getEmployeeCustomers(
  req,
  res,
) {
  try {
    const [rows] =
      await pool.execute(
        `
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
        `,
      );

    return res.status(200).json({
      success: true,
      count: rows.length,

      customers:
        rows.map((row) => ({
          id: row.id,

          fullName:
            row.full_name,

          email:
            row.email,

          phone:
            row.phone,

          role:
            row.role,

          bookingCount:
            Number(
              row.booking_count ||
                0,
            ),

          createdAt:
            row.created_at,
        })),
    });
  } catch (error) {
    console.error(
      "Employee get customers error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Impossible de charger les clients.",
    });
  }
}

module.exports = {
  getEmployeeBookings,
  updateEmployeeBookingStatus,
  getEmployeeCustomers,
};