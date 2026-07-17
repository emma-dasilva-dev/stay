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
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
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
-- =========================================================

INSERT INTO destinations (
  name,
  slug,
  location,
  starting_price_fcfa,
  image_path
)
VALUES
  (
    'Casa del Papa Resort & Spa',
    'casa-del-papa',
    'Ouidah',
    65000,
    '/uploads/destinations/casa-del-papa/main.jpg'
  ),
  (
    'Le Village d’Hélène',
    'village-helene',
    'Lac Toho',
    55000,
    '/uploads/destinations/village-helene/main.jpg'
  ),
  (
    'Sofitel Cotonou Marina',
    'sofitel',
    'Cotonou',
    155000,
    '/uploads/destinations/sofitel/main.jpg'
  ),
  (
    'Novotel Cotonou Orisha',
    'novotel',
    'Cotonou',
    93000,
    '/uploads/destinations/novotel/main.jpg'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  location = VALUES(location),
  starting_price_fcfa = VALUES(starting_price_fcfa),
  image_path = VALUES(image_path);
