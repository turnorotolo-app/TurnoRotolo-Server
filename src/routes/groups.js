import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  addMember,
  removeMember,
  updateWeights,
  resetScores,
  getNextPerson,
  leaveGroup
} from '../controllers/groupController.js';
import { protect, isGroupAdmin, isGroupMember } from '../middleware/auth.js';
import {
  validateCreateGroup,
  validateAddMember,
  validateUpdateWeights,
  validateMongoId,
  validateInviteCode
} from '../middleware/validation.js';

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(protect);

// Basic CRUD
router.route('/')
  .post(validateCreateGroup, createGroup)
  .get(getMyGroups);

router.route('/:id')
  .get(validateMongoId, getGroup)
  .put(validateMongoId, isGroupAdmin, updateGroup)
  .delete(validateMongoId, isGroupAdmin, deleteGroup);

// Join group
router.post('/join/:code', validateInviteCode, joinGroup);

// Members management
router.post(
  '/:id/members',
  validateMongoId,
  isGroupAdmin,
  validateAddMember,
  addMember
);

router.delete(
  '/:id/members/:userId',
  validateMongoId,
  isGroupAdmin,
  removeMember
);

router.post('/:id/leave', validateMongoId, leaveGroup);

// Weights and settings
router.put(
  '/:id/weights',
  validateMongoId,
  isGroupAdmin,
  validateUpdateWeights,
  updateWeights
);

router.post(
  '/:id/reset-scores',
  validateMongoId,
  isGroupAdmin,
  resetScores
);

// Utilities
router.get(
  '/:id/next-person',
  validateMongoId,
  isGroupMember,
  getNextPerson
);

export default router;