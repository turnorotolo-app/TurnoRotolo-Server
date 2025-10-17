import express from 'express';
import {
  createOrder,
  getGroupOrders,
  getOrder,
  deleteOrder,
  getGroupOrderStats,
  getMyOrders
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { validateCreateOrder, validateMongoId, validateGroupId } from '../middleware/validation.js';

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(protect);

// Create order
router.post('/', validateCreateOrder, createOrder);

// Get user's orders
router.get('/my', getMyOrders);

// Get group orders and stats
router.get('/group/:groupId', validateGroupId, getGroupOrders);
router.get('/group/:groupId/stats', validateGroupId, getGroupOrderStats);

// Single order operations
router.route('/:id')
  .get(validateMongoId, getOrder)
  .delete(validateMongoId, deleteOrder);

export default router;