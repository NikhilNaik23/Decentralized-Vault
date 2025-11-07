/**
 * Formatting utility functions
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(dateObj) ? format(dateObj, formatStr) : 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm:ss');
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(dateObj) ? formatDistanceToNow(dateObj, { addSuffix: true }) : 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format DID to shortened version
 */
export const formatDID = (did, startChars = 12, endChars = 8) => {
  if (!did) return '';
  if (did.length <= startChars + endChars) return did;
  return `${did.substring(0, startChars)}...${did.substring(did.length - endChars)}`;
};

/**
 * Format hash/address
 */
export const formatHash = (hash, startChars = 8, endChars = 8) => {
  if (!hash) return '';
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format blockchain status
 */
export const formatStatus = (status) => {
  const statusMap = {
    active: { text: 'Active', color: 'green' },
    inactive: { text: 'Inactive', color: 'gray' },
    pending: { text: 'Pending', color: 'yellow' },
    revoked: { text: 'Revoked', color: 'red' },
    verified: { text: 'Verified', color: 'blue' },
    expired: { text: 'Expired', color: 'orange' },
  };
  return statusMap[status?.toLowerCase()] || { text: status, color: 'gray' };
};

/**
 * Format credential type
 */
export const formatCredentialType = (type) => {
  if (!type) return 'Unknown';
  return type
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^./, (str) => str.toUpperCase());
};

/**
 * Format JSON for display
 */
export const formatJSON = (json, spaces = 2) => {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(obj, null, spaces);
  } catch {
    return json;
  }
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert snake_case to Title Case
 */
export const snakeToTitle = (str) => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Convert camelCase to Title Case
 */
export const camelToTitle = (str) => {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};

/**
 * Format duration (seconds to human readable)
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

/**
 * Pluralize word based on count
 */
export const pluralize = (count, singular, plural = null) => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

/**
 * Format count with label
 */
export const formatCount = (count, singular, plural = null) => {
  return `${formatNumber(count)} ${pluralize(count, singular, plural)}`;
};
