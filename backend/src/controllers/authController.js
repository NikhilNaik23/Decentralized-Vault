const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config/env');
const encryptionService = require('../services/encryptionService');
const didService = require('../services/didService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        });
    }

    // Generate vault key for the user
    const vaultKey = encryptionService.generateVaultKey();

    // Create user
    const user = await User.create({
        username,
        email,
        password,
        vaultKey: vaultKey, // Store vault key directly (it has select: false for security)
    });

    // Create DID for user
    try {
        await didService.createDID(user._id.toString(), 'vault');
    } catch (didError) {
        logger.warn('User created but DID creation failed:', didError.message);
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`✅ User registered: ${user.email}`);

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: user.toSafeObject(),
            token,
            refreshToken,
        },
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    // Check if account is locked
    if (user.isLocked()) {
        return res.status(403).json({
            success: false,
            message: 'Account is locked due to multiple failed login attempts. Please try again later.',
        });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        // Increment login attempts
        await user.incLoginAttempts();

        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    // Check if user is active
    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Account has been deactivated',
        });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`✅ User logged in: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: user.toSafeObject(),
            token,
            refreshToken,
        },
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token is required',
        });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

        // Get user
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            });
        }

        // Generate new access token
        const newToken = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken,
            },
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
        });
    }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
    // In a production app, you might want to blacklist the token
    // For now, we'll just send a success response
    // The client should delete the token from storage

    logger.info(`✅ User logged out: ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: 'Logout successful',
    });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);

    res.status(200).json({
        success: true,
        data: {
            user: user.toSafeObject(),
        },
    });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const { username, email } = req.body;
    const user = await User.findById(req.userId);

    // Check if email/username is already taken by another user
    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use',
            });
        }
        user.email = email;
    }

    if (username && username !== user.username) {
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken',
            });
        }
        user.username = username;
    }

    await user.save();

    logger.info(`✅ User profile updated: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: user.toSafeObject(),
        },
    });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password +vaultKey');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect',
        });
    }

    // Re-encrypt vault key with new password
    try {
        const decryptedVaultKey = encryptionService.decryptVaultKey(user.vaultKey, currentPassword);
        const newEncryptedVaultKey = encryptionService.encryptVaultKey(decryptedVaultKey, newPassword);
        user.vaultKey = newEncryptedVaultKey;
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to re-encrypt vault key',
        });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`✅ Password changed: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
});