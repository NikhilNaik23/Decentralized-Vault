const { v4: uuidv4 } = require('uuid');

/**
 * Generate random string
 */
const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Format response object
 */
const formatResponse = (success, message, data = null) => {
    return {
        success: success !== undefined ? success : (typeof message === 'string' ? true : false),
        message,
        data,
        timestamp: new Date().toISOString(),
    };
};

/**
 * Handle error
 */
const handleError = (error) => {
    console.error(error);
    return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
    };
};

/**
 * Format error response
 */
const formatError = (message, error = null) => {
  return {
    success: false,
    message,
    error: error ? error.message || error : null,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Paginate results
 */
const paginate = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = {
    data: data.slice(startIndex, endIndex),
    pagination: {
      total: data.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(data.length / limit),
    },
  };
  
  if (endIndex < data.length) {
    results.pagination.next = parseInt(page) + 1;
  }
  
  if (startIndex > 0) {
    results.pagination.prev = parseInt(page) - 1;
  }
  
  return results;
};

/**
 * Generate a Decentralized Identifier (DID)
 */
const generateDID = (method = 'vault') => {
  const identifier = uuidv4().replace(/-/g, '');
  return `did:${method}:${identifier}`;
};

/**
 * Validate DID format
 */
const validateDID = (did) => {
  const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9]+$/;
  return didRegex.test(did);
};

/**
 * Sleep utility
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Sanitize object by removing sensitive fields
 */
const sanitizeObject = (obj, fields = ['password', 'privateKey', 'secret']) => {
  const sanitized = { ...obj };
  fields.forEach((field) => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });
  return sanitized;
};

module.exports = {
    generateRandomString,
    validateEmail,
    formatResponse,
    handleError,
    formatError,
    paginate,
    generateDID,
    validateDID,
    sleep,
    sanitizeObject,
};