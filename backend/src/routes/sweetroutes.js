import { Router } from 'express';
import * as sweetController from '../controllers/sweetcontroller.js';

const router = Router();

// Public routes
router.get('/', sweetController.getAllSweets);
router.get('/search', sweetController.searchSweets);

// Admin / Protected routes
router.post('/', sweetController.createSweet);
router.put('/:id', sweetController.updateSweet);
router.delete('/:id', sweetController.deleteSweet);

// Inventory actions
router.post('/:id/purchase', sweetController.purchaseSweet);
router.post('/:id/restock', sweetController.restockSweet);

export default router;
