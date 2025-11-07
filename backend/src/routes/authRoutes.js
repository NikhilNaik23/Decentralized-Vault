const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validator');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    username: Joi.string().min(3).max(30).required(),
    didMethod: Joi.string().valid('did:vault', 'did:ethr').default('did:vault'),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
}).min(1);

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
});

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.use(authMiddleware);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/me', validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', validate(changePasswordSchema), authController.changePassword);

module.exports = router;