/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!regex.test(email)) return 'Invalid email format';
  return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
};

/**
 * Validate password confirmation
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

/**
 * Validate username
 */
export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be less than 20 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores';
  }
  return null;
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate DID format
 */
export const validateDID = (did) => {
  if (!did) return 'DID is required';
  if (!did.startsWith('did:')) return 'DID must start with "did:"';
  const parts = did.split(':');
  if (parts.length < 3) return 'Invalid DID format';
  return null;
};

/**
 * Validate URL format
 */
export const validateURL = (url) => {
  if (!url) return null; // URL is optional
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL format';
  }
};

/**
 * Validate date (not in past for expiry dates)
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
  if (!date) return `${fieldName} is required`;
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) return `${fieldName} must be in the future`;
  return null;
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return 'Both dates are required';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return 'End date must be after start date';
  return null;
};

/**
 * Validate JSON format
 */
export const validateJSON = (jsonString) => {
  if (!jsonString) return 'JSON data is required';
  try {
    JSON.parse(jsonString);
    return null;
  } catch {
    return 'Invalid JSON format';
  }
};

/**
 * Validate form data
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = data[field];
    
    if (rule.required) {
      const error = validateRequired(value, rule.label || field);
      if (error) {
        errors[field] = error;
        return;
      }
    }
    
    if (rule.email) {
      const error = validateEmail(value);
      if (error) errors[field] = error;
    }
    
    if (rule.password) {
      const error = validatePassword(value);
      if (error) errors[field] = error;
    }
    
    if (rule.username) {
      const error = validateUsername(value);
      if (error) errors[field] = error;
    }
    
    if (rule.url) {
      const error = validateURL(value);
      if (error) errors[field] = error;
    }
    
    if (rule.did) {
      const error = validateDID(value);
      if (error) errors[field] = error;
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `Must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `Must be less than ${rule.maxLength} characters`;
    }
    
    if (rule.custom && typeof rule.custom === 'function') {
      const error = rule.custom(value, data);
      if (error) errors[field] = error;
    }
  });
  
  return errors;
};
