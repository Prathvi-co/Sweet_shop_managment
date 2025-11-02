import { SweetService } from '../services/sweetservice.js';

// Get all sweets
export const getAllSweets = (req, res) => {
  try {
    const sweets = SweetService.findAllSweets();
    res.status(200).json(sweets);
  } catch (error) {
    console.error("Error fetching sweets:", error);
    res.status(500).json({ message: error.message });
  }
};

// Search sweets
export const searchSweets = (req, res) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    const results = SweetService.searchSweets({
      name,
      category,
      minPrice: parseFloat(minPrice),
      maxPrice: parseFloat(maxPrice)
    });
    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching sweets:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create sweet
export const createSweet = (req, res) => {
  try {
    const newSweet = SweetService.createSweet(req.body);
    res.status(201).json(newSweet);
  } catch (error) {
    console.error("Error creating sweet:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update sweet
export const updateSweet = (req, res) => {
  try {
    const updated = SweetService.updateSweet(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating sweet:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete sweet
export const deleteSweet = (req, res) => {
  try {
    const success = SweetService.deleteSweet(req.params.id);
    res.status(200).json({ success });
  } catch (error) {
    console.error("Error deleting sweet:", error);
    res.status(500).json({ message: error.message });
  }
};

// Purchase sweet
export const purchaseSweet = (req, res) => {
  try {
    const updated = SweetService.purchaseSweet(req.params.id, req.body.quantity);
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error purchasing sweet:", error);
    res.status(500).json({ message: error.message });
  }
};

// Restock sweet
export const restockSweet = (req, res) => {
  try {
    const updated = SweetService.restockSweet(req.params.id, req.body.quantity);
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error restocking sweet:", error);
    res.status(500).json({ message: error.message });
  }
};
