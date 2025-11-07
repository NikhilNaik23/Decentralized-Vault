const express = require('express');
const router = express.Router();
const credentialController = require('../controllers/credentialController');
const { authMiddleware, checkCredentialOwnership } = require('../middleware/authMiddleware');
const { validate, validateParam, validateQuery } = require('../middleware/validator');
const Joi = require('joi');

// Validation schemas
const createCredentialSchema = Joi.object({
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
    issueDate: Joi.date().iso().optional(), // Allow past, present, or future dates
    expirationDate: Joi.date().iso().greater('now'),
    metadata: Joi.object(),
});

const updateCredentialSchema = Joi.object({
    subject: Joi.object(),
    expirationDate: Joi.date().iso().greater('now'),
    metadata: Joi.object(),
}).min(1);

const revokeCredentialSchema = Joi.object({
    reason: Joi.string().min(5).max(500).required(),
});

const credentialIdParamSchema = Joi.string()
    .pattern(/^([0-9a-fA-F]{24}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/)
    .required()
    .messages({
        'string.pattern.base': 'Credential ID must be a valid MongoDB ObjectId (24 hex characters) or UUID'
    });

const getCredentialsQuerySchema = Joi.object({
    type: Joi.string(),
    status: Joi.string().valid('active', 'revoked', 'expired'),
    issuerDID: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    decrypt: Joi.boolean().default(false),
});

const getCredentialQuerySchema = Joi.object({
    decrypt: Joi.boolean().default(false),
});

const verifyCredentialHashSchema = Joi.object({
    credentialHash: Joi.string().length(64).required(),
});

// PUBLIC ROUTES (No authentication required)
// Public verification endpoint - allows anyone to verify credentials on blockchain
router.post(
    '/public/verify-hash',
    validate(verifyCredentialHashSchema),
    credentialController.verifyCredentialByHash
);

// All other routes require authentication
router.use(authMiddleware);

// CRUD operations
router.post('/', validate(createCredentialSchema), credentialController.createCredential);

router.get(
    '/',
    validateQuery(getCredentialsQuerySchema),
    credentialController.getCredentials
);

router.get(
    '/:id',
    validateParam('id', credentialIdParamSchema),
    validateQuery(getCredentialQuerySchema),
    credentialController.getCredential
);

router.put(
    '/:id',
    validateParam('id', credentialIdParamSchema),
    checkCredentialOwnership,
    validate(updateCredentialSchema),
    credentialController.updateCredential
);

router.delete(
    '/:id',
    // Temporarily disable validation to test
    // validateParam('id', credentialIdParamSchema),
    checkCredentialOwnership,
    credentialController.deleteCredential
);

// Special operations
router.post(
    '/:id/revoke',
    // Temporarily disable validation to test
    // validateParam('id', credentialIdParamSchema),
    checkCredentialOwnership,
    validate(revokeCredentialSchema),
    credentialController.revokeCredential
);

router.post(
    '/:id/verify',
    validateParam('id', credentialIdParamSchema),
    credentialController.verifyCredential
);

module.exports = router;