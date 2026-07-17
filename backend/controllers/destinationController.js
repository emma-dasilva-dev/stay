const { pool } = require("../config/db");


function mapDestination(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    location: row.location,
    shortDescription: row.short_description,
    category: row.category,
    isFeatured: Boolean(row.is_featured),
    startingPriceFcfa: row.starting_price_fcfa,
    imagePath: row.image_path,
  };
}


async function getActiveDestinations(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        id,
        name,
        slug,
        location,
        short_description,
        category,
        is_featured,
        starting_price_fcfa,
        image_path
      FROM destinations
      WHERE is_active = TRUE
      ORDER BY
        is_featured DESC,
        name ASC
    `);


    return res.status(200).json({
      success: true,
      count: rows.length,
      destinations: rows.map(mapDestination),
    });
  } catch (error) {
    console.error("Get destinations error:", error);


    return res.status(500).json({
      success: false,
      message: "Impossible de charger les destinations.",
    });
  }
}


module.exports = {
  getActiveDestinations,
};
