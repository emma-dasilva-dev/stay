-- =========================================================
-- STAY
-- Migration 002: Employee authentication and audit system
-- =========================================================
--
-- Prerequisite:
--   database/stay.sql must already have been executed.
--
-- This migration creates:
--   1. employees
--   2. employee_sessions
--   3. activity_logs
--
-- MySQL version:
--   MySQL 8+
-- =========================================================


USE stay;


-- =========================================================
-- EMPLOYEES
-- =========================================================

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  full_name VARCHAR(120) NOT NULL,

  email VARCHAR(190) NOT NULL,

  phone VARCHAR(30) NOT NULL,

  role ENUM(
    'manager',
    'reservation_agent'
  ) NOT NULL DEFAULT 'reservation_agent',

  /*
   * The employee PIN is never stored in plain text.
   * Only the bcrypt hash is stored here.
   */
  pin_hash VARCHAR(255) NOT NULL,

  /*
   * Allows the Super Admin to disable employee access.
   */
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  /*
   * Retained for compatibility with the current employee
   * system. STAY currently uses permanent PINs until the
   * Super Admin explicitly resets them.
   */
  must_change_pin BOOLEAN NOT NULL DEFAULT FALSE,

  /*
   * Employee login protection.
   *
   * After repeated failed attempts, the account can be
   * temporarily locked.
   */
  failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,

  locked_until DATETIME NULL,

  /*
   * Last successful employee authentication.
   */
  last_login_at DATETIME NULL,

  /*
   * The Super Admin user who created this employee.
   */
  created_by_user_id BIGINT UNSIGNED NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,


  -- -------------------------------------------------------
  -- Constraints
  -- -------------------------------------------------------

  CONSTRAINT uq_employees_email
    UNIQUE (email),

  CONSTRAINT fk_employees_created_by_user
    FOREIGN KEY (created_by_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,


  -- -------------------------------------------------------
  -- Indexes
  -- -------------------------------------------------------

  INDEX idx_employees_email (email),

  INDEX idx_employees_role (role),

  INDEX idx_employees_is_active (is_active),

  INDEX idx_employees_created_by_user_id (
    created_by_user_id
  ),

  INDEX idx_employees_locked_until (
    locked_until
  )

) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;



-- =========================================================
-- EMPLOYEE SESSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS employee_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  employee_id BIGINT UNSIGNED NOT NULL,

  /*
   * Random UUID generated when an employee logs in.
   *
   * This identifier is also included inside the employee JWT.
   * Authentication succeeds only while the matching database
   * session remains active.
   */
  session_token_id VARCHAR(64) NOT NULL,

  logged_in_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  last_seen_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  logged_out_at DATETIME NULL,

  /*
   * IPv4 and IPv6 compatible storage.
   */
  ip_address VARCHAR(45) NULL,

  user_agent VARCHAR(500) NULL,

  /*
   * Setting this to FALSE invalidates the employee session,
   * even if the JWT itself has not expired yet.
   */
  is_active BOOLEAN NOT NULL DEFAULT TRUE,


  -- -------------------------------------------------------
  -- Constraints
  -- -------------------------------------------------------

  CONSTRAINT uq_employee_sessions_token
    UNIQUE (session_token_id),

  CONSTRAINT fk_employee_sessions_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,


  -- -------------------------------------------------------
  -- Indexes
  -- -------------------------------------------------------

  INDEX idx_employee_sessions_employee_id (
    employee_id
  ),

  INDEX idx_employee_sessions_is_active (
    is_active
  ),

  INDEX idx_employee_sessions_last_seen_at (
    last_seen_at
  ),

  INDEX idx_employee_sessions_employee_active (
    employee_id,
    is_active
  )

) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;



-- =========================================================
-- ACTIVITY LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  /*
   * Identifies the type of actor responsible for an action.
   *
   * Current employee activity uses:
   *   employee
   *
   * VARCHAR is intentionally used instead of ENUM so the
   * audit system can later support values such as:
   *   admin
   *   system
   * without requiring a schema migration.
   */
  actor_type VARCHAR(30) NOT NULL,

  /*
   * Nullable so historical logs may remain even if an
   * employee account is eventually deleted.
   */
  employee_id BIGINT UNSIGNED NULL,

  /*
   * Nullable because some future actions may not belong
   * to a specific authenticated employee session.
   */
  employee_session_id BIGINT UNSIGNED NULL,

  /*
   * Snapshot information preserved at the moment the
   * activity occurred.
   */
  actor_name VARCHAR(120) NOT NULL,

  actor_role VARCHAR(80) NOT NULL,

  /*
   * Examples currently used by STAY:
   *
   *   employee_login
   *   employee_logout
   *   booking_status_updated
   */
  action VARCHAR(100) NOT NULL,

  /*
   * The resource affected by the action.
   *
   * Examples:
   *   employee
   *   booking
   */
  entity_type VARCHAR(80) NOT NULL,

  entity_id BIGINT UNSIGNED NULL,

  /*
   * Additional structured audit information.
   *
   * Example for a booking status update:
   *
   * {
   *   "reference": "STAY-...",
   *   "previousStatus": "pending",
   *   "newStatus": "confirmed"
   * }
   */
  details JSON NULL,

  created_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP,


  -- -------------------------------------------------------
  -- Constraints
  -- -------------------------------------------------------

  CONSTRAINT fk_activity_logs_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_activity_logs_employee_session
    FOREIGN KEY (employee_session_id)
    REFERENCES employee_sessions(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,


  -- -------------------------------------------------------
  -- Indexes
  -- -------------------------------------------------------

  INDEX idx_activity_logs_actor_type (
    actor_type
  ),

  INDEX idx_activity_logs_employee_id (
    employee_id
  ),

  INDEX idx_activity_logs_employee_session_id (
    employee_session_id
  ),

  INDEX idx_activity_logs_action (
    action
  ),

  INDEX idx_activity_logs_entity (
    entity_type,
    entity_id
  ),

  INDEX idx_activity_logs_created_at (
    created_at
  )

) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;


-- =========================================================
-- MIGRATION COMPLETE
-- =========================================================

SELECT
  'STAY employee system migration completed successfully.'
  AS migration_status;
