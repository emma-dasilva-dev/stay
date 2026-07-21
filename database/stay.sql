CREATE DATABASE IF NOT EXISTS stay
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE stay;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,

  role ENUM(
    'customer',
    'admin'
  ) NOT NULL DEFAULT 'customer',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;


-- =========================================================
-- DESTINATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS destinations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(160) NOT NULL,
  slug VARCHAR(170) NOT NULL UNIQUE,
  location VARCHAR(120) NOT NULL,

  short_description TEXT NULL,
  category VARCHAR(80) NULL,

  starting_price_fcfa INT UNSIGNED NOT NULL,

  image_path VARCHAR(255) NOT NULL,

  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_destinations_slug (slug),
  INDEX idx_destinations_active (is_active),
  INDEX idx_destinations_featured (is_featured),
  INDEX idx_destinations_category (category)
) ENGINE=InnoDB;


-- =========================================================
-- BOOKINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  reference VARCHAR(30) NOT NULL UNIQUE,

  user_id BIGINT UNSIGNED NULL,
  destination_id BIGINT UNSIGNED NOT NULL,

  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,

  check_in DATE NOT NULL,
  check_out DATE NOT NULL,

  adults TINYINT UNSIGNED NOT NULL DEFAULT 1,
  children TINYINT UNSIGNED NOT NULL DEFAULT 0,

  special_request TEXT NULL,

  estimated_total_fcfa INT UNSIGNED NULL,

  status ENUM(
    'pending',
    'contacted',
    'confirmed',
    'cancelled',
    'completed'
  ) NOT NULL DEFAULT 'pending',

  contact_method ENUM(
    'whatsapp',
    'call'
  ) NOT NULL DEFAULT 'whatsapp',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_bookings_destination
    FOREIGN KEY (destination_id)
    REFERENCES destinations(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_booking_dates
    CHECK (check_out > check_in),

  CONSTRAINT chk_booking_adults
    CHECK (adults >= 1),

  INDEX idx_bookings_user_id (user_id),
  INDEX idx_bookings_destination_id (destination_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_created_at (created_at)
) ENGINE=InnoDB;


-- =========================================================
-- INITIAL DESTINATIONS
--
-- Prices are indicative starting prices.
-- They may vary depending on dates, room type and availability.
-- =========================================================

INSERT INTO destinations (
  name,
  slug,
  location,
  short_description,
  category,
  starting_price_fcfa,
  image_path,
  is_featured,
  is_active
)
VALUES

  (
    'Sofitel Cotonou Marina Hotel & Spa',
    'sofitel',
    'Cotonou',
    'Une adresse contemporaine en bord de mer où l’élégance, le design et l’art de vivre se rencontrent au cœur de Cotonou.',
    'Escapade urbaine',
    155000,
    '/uploads/destinations/sofitel/main.jpg',
    TRUE,
    TRUE
  ),

  (
    'Casa del Papa Resort & Spa',
    'casa-del-papa',
    'Ouidah',
    'Entre océan et nature, Casa del Papa offre une parenthèse paisible à Ouidah, pensée pour ralentir, profiter du littoral et s’évader du rythme quotidien.',
    'Bord de mer',
    65000,
    '/uploads/destinations/casa-del-papa/main.jpg',
    FALSE,
    TRUE
  ),

  (
    'Nyumba Lodge Grand-Popo',
    'nyumba-lodge-grand-popo',
    'Grand-Popo',
    'Un lodge privatif en bord de mer pensé pour les séjours en famille ou entre amis, avec piscine, grands espaces et accès privé à la plage.',
    'Nature & calme',
    210000,
    '/uploads/destinations/nyumba-lodge/main.jpg',
    FALSE,
    TRUE
  ),

  (
    'Golden Tulip Le Diplomate Cotonou',
    'golden-tulip-le-diplomate',
    'Cotonou',
    'À quelques minutes de l’aéroport et de l’océan, une adresse contemporaine qui associe confort, services internationaux et atmosphère urbaine.',
    'Escapade urbaine',
    107000,
    '/uploads/destinations/golden-tulip/main.jpg',
    FALSE,
    TRUE
  ),

  (
    'Natura Luxury Lodge',
    'natura-luxury-lodge',
    'Ouidah',
    'Un refuge confidentiel au bord de l’eau à Ouidah, pensé pour se reconnecter à la nature entre piscine, plage privée et paysages paisibles.',
    'Nature & calme',
    250000,
    '/uploads/destinations/natura-luxury-lodge/main.jpg',
    FALSE,
    TRUE
  ),

  (
    'Le Village d''Hélène',
    'village-helene',
    'Lac Toho',
    'Une adresse paisible au bord du lac Toho, où la nature, le calme et les grands espaces invitent à une escapade loin de l’agitation.',
    'Nature & calme',
    55000,
    '/uploads/destinations/village-helene/main.jpg',
    FALSE,
    TRUE
  ),

  (
    'Hôtel Village Vacances Awalé Plage',
    'awale-plage',
    'Grand-Popo',
    'Une adresse conviviale en bord de mer à Grand-Popo, entre plage privée, cocotiers, piscine et atmosphère décontractée.',
    'Bord de mer',
    27000,
    '/uploads/destinations/awale-plage/main.jpg',
    FALSE,
    TRUE
  ),

  (
    'Novotel Cotonou Orisha',
    'novotel',
    'Cotonou',
    'Une adresse confortable et contemporaine à Cotonou, adaptée aussi bien aux escapades qu’aux séjours professionnels dans la capitale économique.',
    'Escapade urbaine',
    93000,
    '/uploads/destinations/novotel/main.jpg',
    FALSE,
    TRUE
  ),

  (
    'Auberge de Grand-Popo',
    'auberge-grand-popo',
    'Grand-Popo',
    'Une adresse de caractère face à l’Atlantique, installée dans un domaine verdoyant où charme, simplicité et douceur de vivre se rencontrent.',
    'Bord de mer',
    21500,
    '/uploads/destinations/auberge-grand-popo/main.jpg',
    FALSE,
    TRUE
  ),

ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  location = VALUES(location),
  short_description = VALUES(short_description),
  category = VALUES(category),
  starting_price_fcfa = VALUES(starting_price_fcfa),
  image_path = VALUES(image_path),
  is_featured = VALUES(is_featured),
  is_active = VALUES(is_active);
