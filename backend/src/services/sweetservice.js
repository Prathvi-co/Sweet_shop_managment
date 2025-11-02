import { SweetRepository } from '../data/inMemoryDB.js';

/**
 * Service layer responsible for all Sweet and Inventory management logic.
 */
export class SweetService {

    // --- CRUD Operations ---

    /**
     * Creates a new sweet. Requires validation before calling.
     * @param {import('../models/sweetmodel.js').ISweetCreateDTO} sweetDto
     * @returns {import('../models/sweetmodel.js').ISweet}
     */
    static createSweet(sweetDto) {
        // In a real app, we might check for uniqueness of name here,
        // but for this kata, we rely on ID.
        return SweetRepository.create(sweetDto);
    }

    /**
     * Gets a list of all sweets.
     * @returns {import('../models/sweetmodel.js').ISweet[]}
     */
    static findAllSweets() {
        return SweetRepository.findAll();
    }

    /**
     * Gets a single sweet by its ID.
     * @param {string} id
     * @returns {import('../models/sweetmodel.js').ISweet | undefined}
     */
    static getSweetById(id) {
        return SweetRepository.findById(id);
    }

    /**
     * Updates an existing sweet's details.
     * @param {string} id
     * @param {import('../models/sweetmodel.js').ISweetUpdateDTO} updateDto
     * @returns {import('../models/sweetmodel.js').ISweet | undefined}
     */
    static updateSweet(id, updateDto) {
        // Ensure price and quantity are non-negative before updating
        if ((updateDto.price && updateDto.price < 0) || (updateDto.quantity && updateDto.quantity < 0)) {
            throw new Error('Price and quantity must be non-negative.');
        }

        return SweetRepository.update(id, updateDto);
    }

    /**
     * Deletes a sweet by its ID.
     * @param {string} id
     * @returns {boolean} - True if deletion was successful.
     */
    static deleteSweet(id) {
        return SweetRepository.delete(id);
    }

    // --- Search and Filter ---
    static searchSweets({ name, category, minPrice, maxPrice }) {
        let sweets = SweetRepository.findAll();

        if (name) {
            const lowerCaseName = name.toLowerCase();
            sweets = sweets.filter(sweet => sweet.name.toLowerCase().includes(lowerCaseName));
        }

        if (category) {
            const lowerCaseCategory = category.toLowerCase();
            sweets = sweets.filter(sweet => sweet.category.toLowerCase() === lowerCaseCategory);
        }

        if (minPrice !== undefined) {
            sweets = sweets.filter(sweet => sweet.price >= minPrice);
        }

        if (maxPrice !== undefined) {
            sweets = sweets.filter(sweet => sweet.price <= maxPrice);
        }

        return sweets;
    }

    // --- Inventory Operations (Protected Endpoints) ---
    static purchaseSweet(sweetId, quantity = 1) {
        const sweet = SweetRepository.findById(sweetId);

        if (!sweet) throw new Error('Sweet not found');
        if (quantity <= 0) throw new Error('Purchase quantity must be positive');
        if (sweet.quantity < quantity) throw new Error('Not enough stock available');

        const newQuantity = sweet.quantity - quantity;
        return SweetRepository.update(sweetId, { quantity: newQuantity });
    }

    static restockSweet(sweetId, quantity = 1) {
        const sweet = SweetRepository.findById(sweetId);

        if (!sweet) throw new Error('Sweet not found');
        if (quantity <= 0) throw new Error('Restock quantity must be positive');

        const newQuantity = sweet.quantity + quantity;
        return SweetRepository.update(sweetId, { quantity: newQuantity });
    }
}
