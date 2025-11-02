/**
 * @typedef {'Admin' | 'User'} UserRole - Defines the possible roles a user can have.
 */

/**
 * @typedef {Object} IUser - The structure for a User object stored in the database.
 * @property {string} id - Unique ID for the user.
 * @property {string} username - The user's login name (must be unique).
 * @property {string} passwordHash - The secure hash of the user's password (not sent to client).
 * @property {UserRole} role - The user's access level.
 */

/**
 * @typedef {Object} IUserCreateDTO - Data Transfer Object for creating a new user (Registration).
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} IAuthPayload - Data extracted from the JWT token, used for authentication middleware.
 * @property {string} id
 * @property {string} username
 * @property {UserRole} role
 * @property {number} iat - Issued at timestamp.
 * @property {number} exp - Expiration timestamp.
 */

// Since this is only a definition file, we don't export anything executable.
