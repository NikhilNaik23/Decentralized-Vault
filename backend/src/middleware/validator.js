const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validation middleware using Joi
 */
const validate = (schema) => {
    return (req, res, next) => {
        const validationOptions = {
            abortEarly: false, // Return all errors
            allowUnknown: true, // Allow unknown keys in body
            stripUnknown: true, // Remove unknown keys
        };

        const { error, value } = schema.validate(req.body, validationOptions);

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            logger.warn('Validation error:', { errors, body: req.body });

            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors,
            });
        }

        // Replace request body with validated value
        req.body = value;
        next();
    };
};

/**
 * Validation schemas
 */
const schemas = {
    // Authentication
    register: Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    // DID
    createDID: Joi.object({
        method: Joi.string().valid('vault', 'key', 'web', 'ethr').default('vault'),
    }),

    updateDID: Joi.object({
        document: Joi.object(),
        serviceEndpoint: Joi.object({
            id: Joi.string().required(),
            type: Joi.string().required(),
            endpoint: Joi.string().uri().required(),
        }),
    }),

    // Credentials
    createCredential: Joi.object({
        credentialType: Joi.string().required(),
        credentialSubject: Joi.object().required(),
        issuerDID: Joi.string(),
        issuerName: Joi.string(),
        issuanceDate: Joi.date(),
        expirationDate: Joi.date().greater(Joi.ref('issuanceDate')),
        metadata: Joi.object(),
    }),

    updateCredential: Joi.object({
        credentialSubject: Joi.object(),
        expirationDate: Joi.date(),
        metadata: Joi.object(),
    }),

    revokeCredential: Joi.object({
        reason: Joi.string(),
    }),

    // Vault
    vaultQuery: Joi.object({
        credentialType: Joi.string(),
        status: Joi.string().valid('active', 'revoked', 'expired', 'suspended'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    }),
};

/**
 * Query parameter validation
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return res.status(400).json({
                success: false,
                message: 'Query validation error',
                errors,
            });
        }

        req.query = value;
        next();
    };
};

/**
 * Param validation
 */
const validateParam = (paramName, schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params[paramName]);

        if (error) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName}`,
                error: error.message,
            });
        }

        req.params[paramName] = value;
        next();
    };
};

/**
 * Common validation schemas for params
 */
const paramSchemas = {
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId
    did: Joi.string().pattern(/^did:[a-z0-9]+:[a-zA-Z0-9]+$/),
    credentialId: Joi.string().uuid(),
};

module.exports = {
    validate,
    validateQuery,
    validateParam,
    schemas,
    paramSchemas,
};