const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateQuery } = require('../middleware/validator');
const Joi = require('joi');

// Validation schemas
const exportVaultQuerySchema = Joi.object({
    format: Joi.string().valid('json', 'encrypted').default('json'),
});

// All routes require authentication
router.use(authMiddleware);

// Vault operations
router.get('/stats', vaultController.getVaultStats);

router.get(
    '/export',
    validateQuery(exportVaultQuerySchema),
    vaultController.exportVault
);

router.get('/blockchain-info', vaultController.getBlockchainInfo);

module.exports = router;