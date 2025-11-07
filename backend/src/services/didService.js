const DID = require('../models/DID');
const User = require('../models/User');
const { generateDID, validateDID } = require('../utils/helpers');
const { generateKeyPair } = require('../utils/crypto');
const logger = require('../utils/logger');
const blockchainService = require('./blockchainService');

/**
 * DID Service - Manages Decentralized Identifiers
 */
class DIDService {
    
    /**
     * Create a new DID for a user
     * @param {string} userId - User's MongoDB ID
     * @param {string} method - DID method (vault, key, web, ethr)
     * @returns {object} Created DID document
     */
    async createDID(userId, method = 'vault') {
        try {
            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user already has a DID
            const existingDID = await DID.findOne({ userId, isActive: true });
            if (existingDID) {
                throw new Error('User already has an active DID');
            }

            // Generate key pair for the DID
            const { publicKey, privateKey } = generateKeyPair();
            
            // Generate DID identifier
            const didIdentifier = generateDID(method);

            // Create DID document
            const didDocument = new DID({
                did: didIdentifier,
                userId,
                method,
                publicKey,
                controller: didIdentifier,
                authentication: [{
                    id: `${didIdentifier}#keys-1`,
                    type: 'Ed25519VerificationKey2020',
                    publicKey
                }]
            });

            await didDocument.save();
            
            // Update user with DID and keys
            user.did = didIdentifier;
            user.publicKey = publicKey;
            user.privateKey = privateKey;
            await user.save();

            // Store DID on blockchain (simulated)
            try {
                const blockchainResult = await blockchainService.storeDIDDocument({
                    did: didIdentifier,
                    documentHash: didDocument.documentHash,
                    publicKey
                });
                
                if (blockchainResult) {
                    didDocument.blockchainTxHash = blockchainResult.hash;
                    didDocument.blockchainBlockNumber = blockchainResult.index;
                    await didDocument.save();
                }
            } catch (blockchainError) {
                logger.warn('DID created but blockchain storage failed:', blockchainError.message);
            }

            logger.info(`✅ DID created: ${didIdentifier}`);
            
            return didDocument.toPublicObject();
            
        } catch (error) {
            logger.error('❌ DID creation failed:', error.message);
            throw error;
        }
    }

    /**
     * Get DID document by DID identifier
     * @param {string} did - DID identifier or MongoDB ObjectId
     * @returns {object} DID document
     */
    async getDIDDocument(didOrId) {
        try {
            let didDocument;
            
            // Check if it's a MongoDB ObjectId
            if (/^[0-9a-fA-F]{24}$/.test(didOrId)) {
                didDocument = await DID.findById(didOrId);
            } else {
                // Validate DID format
                if (!validateDID(didOrId)) {
                    throw new Error('Invalid DID format');
                }
                didDocument = await DID.findByDID(didOrId);
            }
            
            if (!didDocument) {
                throw new Error('DID not found');
            }

            return didDocument.generateDIDDocument();
            
        } catch (error) {
            logger.error('❌ Failed to get DID document:', error.message);
            throw error;
        }
    }

    /**
     * Get full DID object (including metadata)
     * @param {string} didOrId - DID identifier or MongoDB ObjectId
     * @returns {object} Full DID object
     */
    async getDID(didOrId) {
        try {
            let didDocument;
            
            // Check if it's a MongoDB ObjectId
            if (/^[0-9a-fA-F]{24}$/.test(didOrId)) {
                didDocument = await DID.findById(didOrId);
            } else {
                // Validate DID format
                if (!validateDID(didOrId)) {
                    throw new Error('Invalid DID format');
                }
                didDocument = await DID.findByDID(didOrId);
            }
            
            if (!didDocument) {
                throw new Error('DID not found');
            }

            return didDocument.toPublicObject();
            
        } catch (error) {
            logger.error('❌ Failed to get DID:', error.message);
            throw error;
        }
    }

    /**
     * Get DID by user ID
     * @param {string} userId - User's MongoDB ID
     * @returns {object} DID document
     */
    async getDIDByUser(userId) {
        try {
            const didDocuments = await DID.findByUser(userId);
            if (!didDocuments || didDocuments.length === 0) {
                throw new Error('No DID found for this user');
            }

            return didDocuments[0].toPublicObject();
            
        } catch (error) {
            logger.error('❌ Failed to get user DID:', error.message);
            throw error;
        }
    }

    /**
     * Resolve DID to get full document
     * @param {string} did - DID identifier
     * @returns {object} Complete DID document with metadata
     */
    async resolveDID(did) {
        try {
            if (!validateDID(did)) {
                throw new Error('Invalid DID format');
            }

            const didDocument = await DID.findByDID(did);
            if (!didDocument) {
                throw new Error('DID not found');
            }

            return {
                didDocument: didDocument.generateDIDDocument(),
                metadata: {
                    created: didDocument.createdAt,
                    updated: didDocument.updatedAt,
                    isActive: didDocument.isActive,
                    onBlockchain: !!didDocument.blockchainTxHash,
                    blockchainTxHash: didDocument.blockchainTxHash,
                    blockchainBlockNumber: didDocument.blockchainBlockNumber
                }
            };
            
        } catch (error) {
            logger.error('❌ DID resolution failed:', error.message);
            throw error;
        }
    }

    /**
     * Update DID document
     * @param {string} did - DID identifier
     * @param {object} updates - Fields to update
     * @returns {object} Updated DID document
     */
    async updateDIDDocument(did, updates) {
        try {
            const didDocument = await DID.findByDID(did);
            if (!didDocument) {
                throw new Error('DID not found');
            }

            await didDocument.updateDocument(updates);
            
            logger.info(`✅ DID updated: ${did}`);
            
            return didDocument.toPublicObject();
            
        } catch (error) {
            logger.error('❌ DID update failed:', error.message);
            throw error;
        }
    }

    /**
     * Add service endpoint to DID
     * @param {string} did - DID identifier
     * @param {string} serviceId - Service ID
     * @param {string} serviceType - Type of service
     * @param {string} endpoint - Service endpoint URL
     * @returns {object} Updated DID document
     */
    async addServiceEndpoint(did, serviceId, serviceType, endpoint) {
        try {
            const didDocument = await DID.findByDID(did);
            if (!didDocument) {
                throw new Error('DID not found');
            }

            await didDocument.addService(serviceId, serviceType, endpoint);
            
            logger.info(`✅ Service endpoint added to DID: ${did}`);
            
            return didDocument.toPublicObject();
            
        } catch (error) {
            logger.error('❌ Failed to add service endpoint:', error.message);
            throw error;
        }
    }

    /**
     * Deactivate a DID
     * @param {string} did - DID identifier
     * @returns {object} Deactivated DID document
     */
    async deactivateDID(did) {
        try {
            const didDocument = await DID.findByDID(did);
            if (!didDocument) {
                throw new Error('DID not found');
            }

            await didDocument.deactivate();
            
            logger.info(`✅ DID deactivated: ${did}`);
            
            return { success: true, message: 'DID deactivated successfully' };
            
        } catch (error) {
            logger.error('❌ DID deactivation failed:', error.message);
            throw error;
        }
    }

    /**
     * Reactivate a DID
     * @param {string} did - DID identifier
     * @returns {object} Reactivated DID document
     */
    async reactivateDID(did) {
        try {
            const didDocument = await DID.findOne({ did });
            if (!didDocument) {
                throw new Error('DID not found');
            }

            await didDocument.reactivate();
            
            logger.info(`✅ DID reactivated: ${did}`);
            
            return didDocument.toPublicObject();
            
        } catch (error) {
            logger.error('❌ DID reactivation failed:', error.message);
            throw error;
        }
    }

    /**
     * Verify DID ownership
     * @param {string} did - DID identifier
     * @param {string} userId - User's MongoDB ID
     * @returns {boolean} True if user owns the DID
     */
    async verifyDIDOwnership(did, userId) {
        try {
            const didDocument = await DID.findOne({ did, userId, isActive: true });
            return !!didDocument;
        } catch (error) {
            logger.error('❌ DID ownership verification failed:', error.message);
            return false;
        }
    }

    /**
     * List all DIDs for a user
     * @param {string} userId - User's MongoDB ID
     * @returns {Array} List of DID documents
     */
    async listUserDIDs(userId) {
        try {
            const didDocuments = await DID.find({ userId }).sort('-createdAt');
            return didDocuments.map(doc => doc.toPublicObject());
        } catch (error) {
            logger.error('❌ Failed to list user DIDs:', error.message);
            throw error;
        }
    }

    /**
     * Validate DID format
     * @param {string} did - DID to validate
     * @returns {boolean} True if valid
     */
    validateDIDFormat(did) {
        return validateDID(did);
    }
}

// Export singleton instance
const didService = new DIDService();
module.exports = didService;