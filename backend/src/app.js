const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, AppError } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const didRoutes = require('./routes/didRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const storageRoutes = require('./routes/storageRoutes');
const oauthRoutes = require('./routes/oauthRoutes');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS configuration
const corsOptions = {
    origin: config.cors.origin.split(','),
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Logging middleware
if (config.env === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(
        morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim()),
            },
        })
    );
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config.env,
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/did', didRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/oauth', oauthRoutes);

// API documentation route
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Decentralized Identity Vault API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            did: '/api/did',
            credentials: '/api/credentials',
            vault: '/api/vault',
            blockchain: '/api/blockchain',
            storage: '/api/storage',
            oauth: '/api/oauth',
        },
        publicEndpoints: {
            verifyCredentialHash: 'POST /api/credentials/public/verify-hash',
            ipfsStatus: 'GET /api/storage/ipfs/status',
            ipfsGateway: 'GET /api/storage/ipfs/:cid',
            oauthAuthorize: 'GET /api/oauth/authorize',
            oauthToken: 'POST /api/oauth/token',
            oauthUserInfo: 'GET /api/oauth/userinfo',
        },
        features: {
            authentication: 'JWT-based authentication',
            oauth: 'OAuth 2.0 / OpenID Connect for external apps',
            encryption: 'AES-256-GCM encryption',
            blockchain: 'Simulated + optional Ethereum',
            storage: 'MongoDB + optional IPFS',
            verification: 'Public blockchain verification',
        },
        documentation: 'See README.md for full API documentation',
    });
});

// 404 handler - must be after all other routes
app.use((req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler - must be last
app.use(errorHandler);

module.exports = app;