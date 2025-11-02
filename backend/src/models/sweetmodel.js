/**
 * @typedef {object} ISweet
 * @property {string} id - Unique identifier for the sweet.
 * @property {string} name - Name of the sweet (e.g., "Chocolate Bar").
 * @property {string} category - Category (e.g., "Chocolate", "Gummy", "Hard Candy").
 * @property {number} price - Price per unit.
 * @property {number} quantity - Quantity in stock.
 */

/**
 * @typedef {object} ISweetCreateDTO
 * @property {string} name 
 * @property {string} category
 * @property {number} price
 * @property {number} quantity
 */

/**
 * @typedef {object} ISweetUpdateDTO
 * @property {string} [name] 
 * @property {string} [category]
 * @property {number} [price]
 * @property {number} [quantity]
 */
