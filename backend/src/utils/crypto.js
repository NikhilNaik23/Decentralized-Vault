const crypto = require('crypto');
const CryptoJS = require('crypto-js');

/**
 * Generate SHA-256 hash of data
 */
const sha256 = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

/**
 * Generate a cryptographically secure random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Generate a random key for encryption
 */
function generateKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt data using AES-256-CBC
 */
function encrypt(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

/**
 * Decrypt data using AES-256-CBC
 */
function decrypt(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Hash data using SHA-256
 */
function hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create HMAC signature
 */
const createHMAC = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Encrypt data using AES-256 (CryptoJS)
 */
const encryptAES = (text, key) => {
  return CryptoJS.AES.encrypt(text, key).toString();
};

/**
 * Decrypt AES-256 encrypted data (CryptoJS)
 */
const decryptAES = (encryptedText, key) => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Generate key pair for asymmetric encryption
 */
const generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  
  return { publicKey, privateKey };
};

module.exports = {
    generateKey,
    encrypt,
    decrypt,
    hash,
    sha256,
    generateRandomString,
    createHMAC,
    encryptAES,
    decryptAES,
    generateKeyPair,
};