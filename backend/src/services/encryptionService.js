const crypto = require('crypto');
const { generateKey, encrypt, decrypt, encryptAES, decryptAES, generateKeyPair } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * Encryption Service for securing sensitive data
 * Provides encryption/decryption for credentials and vault data
 */
class EncryptionService {
    constructor() {
        this.algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
        this.masterKey = process.env.ENCRYPTION_KEY || this.generateMasterKey();
    }

    /**
     * Generate a master encryption key
     */
    generateMasterKey() {
        logger.warn('⚠️  Using generated master key. Set ENCRYPTION_KEY in .env for production!');
        return generateKey(32);
    }

    /**
     * Generate user-specific vault key
     */
    generateVaultKey() {
        return generateKey(32);
    }

    /**
     * Encrypt credential data
     * @param {object} credentialData - Credential data to encrypt
     * @param {string} vaultKey - User's vault encryption key
     * @returns {object} Encrypted data with IV
     */
    encryptCredential(credentialData, vaultKey) {
        try {
            const dataString = JSON.stringify(credentialData);
            const key = Buffer.from(vaultKey, 'hex');
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            let encrypted = cipher.update(dataString, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return {
                encryptedData: encrypted,
                iv: iv.toString('hex')
            };
        } catch (error) {
            logger.error('❌ Credential encryption failed:', error.message);
            throw new Error('Failed to encrypt credential');
        }
    }

    /**
     * Decrypt credential data
     * @param {string} encryptedData - Encrypted credential data
     * @param {string} iv - Initialization vector
     * @param {string} vaultKey - User's vault encryption key
     * @returns {object} Decrypted credential data
     */
    decryptCredential(encryptedData, iv, vaultKey) {
        try {
            const key = Buffer.from(vaultKey, 'hex');
            const ivBuffer = Buffer.from(iv, 'hex');
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            logger.error('❌ Credential decryption failed:', error.message);
            throw new Error('Failed to decrypt credential');
        }
    }

    /**
     * Encrypt vault data with master key
     * @param {string} data - Data to encrypt
     * @returns {string} Encrypted data
     */
    encryptWithMasterKey(data) {
        try {
            return encryptAES(data, this.masterKey);
        } catch (error) {
            logger.error('❌ Master key encryption failed:', error.message);
            throw new Error('Failed to encrypt with master key');
        }
    }

    /**
     * Decrypt vault data with master key
     * @param {string} encryptedData - Encrypted data
     * @returns {string} Decrypted data
     */
    decryptWithMasterKey(encryptedData) {
        try {
            return decryptAES(encryptedData, this.masterKey);
        } catch (error) {
            logger.error('❌ Master key decryption failed:', error.message);
            throw new Error('Failed to decrypt with master key');
        }
    }

    /**
     * Generate RSA key pair for asymmetric encryption
     * @returns {object} Public and private key pair
     */
    generateAsymmetricKeyPair() {
        try {
            return generateKeyPair();
        } catch (error) {
            logger.error('❌ Key pair generation failed:', error.message);
            throw new Error('Failed to generate key pair');
        }
    }

    /**
     * Encrypt user's vault key with their password
     * @param {string} vaultKey - Vault encryption key
     * @param {string} password - User's password
     * @returns {string} Encrypted vault key
     */
    encryptVaultKey(vaultKey, password) {
        try {
            // Derive key from password using PBKDF2
            const salt = crypto.randomBytes(16);
            const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
            let encrypted = cipher.update(vaultKey, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Return salt + iv + encrypted data
            return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            logger.error('❌ Vault key encryption failed:', error.message);
            throw new Error('Failed to encrypt vault key');
        }
    }

    /**
     * Decrypt user's vault key with their password
     * @param {string} encryptedVaultKey - Encrypted vault key
     * @param {string} password - User's password
     * @returns {string} Decrypted vault key
     */
    decryptVaultKey(encryptedVaultKey, password) {
        try {
            const [saltHex, ivHex, encryptedData] = encryptedVaultKey.split(':');
            
            const salt = Buffer.from(saltHex, 'hex');
            const iv = Buffer.from(ivHex, 'hex');
            const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            logger.error('❌ Vault key decryption failed:', error.message);
            throw new Error('Failed to decrypt vault key - invalid password?');
        }
    }

    /**
     * Create hash of data for blockchain storage
     * @param {*} data - Data to hash
     * @returns {string} SHA-256 hash
     */
    createHash(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Verify data against hash
     * @param {*} data - Original data
     * @param {string} hash - Hash to verify against
     * @returns {boolean} True if hash matches
     */
    verifyHash(data, hash) {
        const computedHash = this.createHash(data);
        return computedHash === hash;
    }
}

// Export singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;