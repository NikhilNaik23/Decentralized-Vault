const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config/env');

const verifyToken = promisify(jwt.verify);

/**
 * Authentication middleware - Verify JWT token
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        let token = null;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided, authorization denied.' 
            });
        }

        // Verify token
        const decoded = await verifyToken(token, config.jwt.secret);
        
        // Get user from token
        const user = await User.findById(decoded.id).select('-password -vaultKey -privateKey');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Token is not valid, user not found.' 
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ 
                success: false,
                message: 'Account has been deactivated.' 
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(401).json({ 
                success: false,
                message: 'Account is locked due to multiple failed login attempts.' 
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id.toString();
        
        next();
    } catch (error) {
        logger.error('Authentication error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token.' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token has expired.' 
            });
        }
        
        return res.status(401).json({ 
            success: false,
            message: 'Authentication failed.' 
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = null;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = await verifyToken(token, config.jwt.secret);
            const user = await User.findById(decoded.id).select('-password -vaultKey -privateKey');
            
            if (user && user.isActive && !user.isLocked()) {
                req.user = user;
                req.userId = user._id.toString();
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Check if user owns the DID
 */
const checkDIDOwnership = async (req, res, next) => {
    try {
        const did = req.params.did || req.body.did;
        
        if (!did) {
            return res.status(400).json({ 
                success: false,
                message: 'DID not provided.' 
            });
        }

        if (req.user.did !== did) {
            return res.status(403).json({ 
                success: false,
                message: 'You do not have permission to access this DID.' 
            });
        }

        next();
    } catch (error) {
        logger.error('DID ownership check error:', error.message);
        return res.status(500).json({ 
            success: false,
            message: 'Error checking DID ownership.' 
        });
    }
};

/**
 * Check if user owns the credential
 */
const checkCredentialOwnership = async (req, res, next) => {
    try {
        const Credential = require('../models/Credential');
        const credentialId = req.params.id || req.params.credentialId;
        
        if (!credentialId) {
            return res.status(400).json({ 
                success: false,
                message: 'Credential ID not provided.' 
            });
        }

        // Try to find by MongoDB _id OR by credentialId UUID
        let credential;
        if (typeof credentialId === 'string' && /^[0-9a-fA-F]{24}$/.test(credentialId)) {
            // It's a MongoDB ObjectId - search by _id or credentialId
            credential = await Credential.findOne({ 
                $or: [
                    { _id: credentialId },
                    { credentialId: credentialId }
                ]
            });
        } else {
            // It's a UUID - search by credentialId only
            credential = await Credential.findOne({ credentialId });
        }
        
        if (!credential) {
            return res.status(404).json({ 
                success: false,
                message: 'Credential not found.' 
            });
        }

        if (credential.userId.toString() !== req.userId) {
            return res.status(403).json({ 
                success: false,
                message: 'You do not have permission to access this credential.' 
            });
        }

        req.credential = credential;
        next();
    } catch (error) {
        logger.error('Credential ownership check error:', error.message);
        return res.status(500).json({ 
            success: false,
            message: 'Error checking credential ownership.' 
        });
    }
};

module.exports = {
    authMiddleware,
    optionalAuth,
    checkDIDOwnership,
    checkCredentialOwnership,
    // Aliases
    protect: authMiddleware,
    authenticate: authMiddleware,
};