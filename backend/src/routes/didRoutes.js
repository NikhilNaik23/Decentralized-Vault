const express = require('express');
const router = express.Router();
const didController = require('../controllers/didController');
const { authMiddleware, checkDIDOwnership } = require('../middleware/authMiddleware');
const { validate, validateParam } = require('../middleware/validator');
const Joi = require('joi');

// Validation schemas
const createDIDSchema = Joi.object({
    method: Joi.string().valid('vault', 'ethr').default('vault'),
    publicKeyPem: Joi.string().allow('').optional(),
});

const updateDIDSchema = Joi.object({
    publicKey: Joi.string(),
    serviceEndpoints: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            type: Joi.string().required(),
            serviceEndpoint: Joi.string().uri().required(),
        })
    ),
}).min(1);

const addServiceSchema = Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    serviceEndpoint: Joi.string().uri().required(),
});

const removeServiceSchema = Joi.object({
    serviceId: Joi.string().required(),
});

const didParamSchema = Joi.string()
    .pattern(/^did:(vault|ethr):[a-zA-Z0-9]+$/)
    .required();

const objectIdParamSchema = Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required();

// Combined schema that accepts either DID format or MongoDB ObjectId
const didOrIdParamSchema = Joi.alternatives().try(
    Joi.string().pattern(/^did:(vault|ethr):[a-zA-Z0-9]+$/),
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
).required();

// Public routes
router.get('/:did/resolve', validateParam('did', didParamSchema), didController.resolveDID);

// Protected routes
router.use(authMiddleware);

router.get('/', didController.getMyDIDs);
router.post('/', validate(createDIDSchema), didController.createDID);
router.get('/:did', validateParam('did', didOrIdParamSchema), didController.getDID);

// DID ownership required
router.put(
    '/:did',
    validateParam('did', didParamSchema),
    checkDIDOwnership,
    validate(updateDIDSchema),
    didController.updateDID
);

router.post(
    '/:did/service',
    validateParam('did', didParamSchema),
    checkDIDOwnership,
    validate(addServiceSchema),
    didController.addServiceEndpoint
);

router.delete(
    '/:did/service',
    validateParam('did', didParamSchema),
    checkDIDOwnership,
    validate(removeServiceSchema),
    didController.removeServiceEndpoint
);

router.post(
    '/:did/deactivate',
    validateParam('did', didParamSchema),
    checkDIDOwnership,
    didController.deactivateDID
);

router.post(
    '/:did/reactivate',
    validateParam('did', didParamSchema),
    checkDIDOwnership,
    didController.reactivateDID
);

module.exports = router;