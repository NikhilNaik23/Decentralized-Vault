const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateParam } = require('../middleware/validator');
const Joi = require('joi');

// Validation schemas
const blockIndexParamSchema = Joi.object({
    index: Joi.number().integer().min(0).required(),
});

const didParamSchema = Joi.object({
    did: Joi.string()
        .pattern(/^did:(vault|ethr):[a-zA-Z0-9]+$/)
        .required(),
});

// Public routes (blockchain is public by nature)
router.get('/stats', blockchainController.getBlockchainStats);
router.get('/blocks', blockchainController.getAllBlocks);
router.get(
    '/blocks/:index',
    validateParam(blockIndexParamSchema),
    blockchainController.getBlock
);
router.get('/validate', blockchainController.validateBlockchain);
router.get(
    '/did/:did',
    validateParam(didParamSchema),
    blockchainController.getBlocksByDID
);
router.get('/ethereum', blockchainController.getEthereumInfo);

// Protected route (admin only - for export)
router.get('/export', authMiddleware, blockchainController.exportBlockchain);

module.exports = router;
