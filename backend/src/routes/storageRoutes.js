const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validator');
const Joi = require('joi');

// Validation schemas
const storeDecentralizedSchema = Joi.object({
    type: Joi.string()
        .valid(
            'EducationalCredential',
            'EmploymentCredential',
            'IdentityCredential',
            'HealthCredential',
            'FinancialCredential',
            'GovernmentCredential',
            'ProfessionalCredential'
        )
        .required(),
    subject: Joi.object().required(),
    issuerDID: Joi.string()
        .pattern(/^did:(vault|ethr):[a-zA-Z0-9]+$/)
        .required(),
    expirationDate: Joi.date().iso().greater('now'),
    metadata: Joi.object(),
});

// PUBLIC ROUTES (No authentication)
// Get IPFS status
router.get('/ipfs/status', storageController.getIPFSStatus);

// Get IPFS gateway URL for a CID
router.get('/ipfs/:cid', storageController.getFromIPFSGateway);

// PROTECTED ROUTES (Require authentication)
router.use(authMiddleware);

// Store credential in decentralized mode (IPFS)
router.post(
    '/decentralized',
    validate(storeDecentralizedSchema),
    storageController.storeDecentralized
);

// Retrieve credential from IPFS
router.get(
    '/decentralized/:id',
    storageController.retrieveFromIPFS
);

// Get storage statistics
router.get('/stats', storageController.getStorageStats);

module.exports = router;
