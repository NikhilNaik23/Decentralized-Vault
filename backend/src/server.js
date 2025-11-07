const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/database');
const blockchainService = require('./services/blockchainService');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(err.name, err.message);
    logger.error(err.stack);
    process.exit(1);
});

// Initialize server
let server;

const startServer = async () => {
    try {
        // Connect to MongoDB
        logger.info('Connecting to MongoDB...');
        await connectDatabase();
        logger.info('MongoDB connected successfully');

        // Blockchain service is already initialized
        logger.info('Blockchain service ready');

        // Start Express server
        server = app.listen(config.port, () => {
            logger.info(`Server running in ${config.env} mode on port ${config.port}`);
            logger.info(`Health check available at http://localhost:${config.port}/health`);
            logger.info(`API documentation at http://localhost:${config.port}/api`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(err.name, err.message);
    logger.error(err.stack);
    
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    
    if (server) {
        server.close(() => {
            logger.info('Process terminated');
            process.exit(0);
        });
    }
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    
    if (server) {
        server.close(() => {
            logger.info('Process terminated');
            process.exit(0);
        });
    }
});

// Start the server
startServer();