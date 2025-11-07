const Credential = require('../models/Credential');
const User = require('../models/User');
const encryptionService = require('./encryptionService');
const blockchainService = require('./blockchainService');
const ipfsService = require('./ipfsService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Vault Service - Manages encrypted credential storage
 * Supports both centralized (MongoDB) and decentralized (IPFS) storage
 * Handles credential CRUD operations with encryption
 */
class VaultService {
    
    /**
     * Store a credential in the vault
     * @param {string} userId - User's MongoDB ID
     * @param {object} credentialData - Credential data to store
     * @returns {object} Stored credential
     */
    async storeCredential(userId, credentialData) {
        try {
            // Validate user exists and get vault key
            const user = await User.findById(userId).select('+vaultKey');
            if (!user) {
                throw new Error('User not found');
            }

            // Validate required fields
            if (!credentialData.credentialType || !credentialData.credentialSubject) {
                throw new Error('Missing required credential fields');
            }

            // Debug log: See what data we received
            logger.info(`📥 Received credential data:`, {
                credentialType: credentialData.credentialType,
                issuerDID: credentialData.issuerDID,
                credentialSubject: credentialData.credentialSubject
            });

            // Encrypt credential data
            const encrypted = encryptionService.encryptCredential(
                credentialData.credentialSubject,
                user.vaultKey
            );

            // Create credential hash for blockchain
            const credentialHash = encryptionService.createHash({
                credentialType: credentialData.credentialType,
                credentialSubject: credentialData.credentialSubject,
                did: user.did,
                timestamp: Date.now()
            });

            // Determine holder DID
            // If credentialSubject has a 'did' field, use it; otherwise use issuer's DID
            let holderDID = user.did; // Default to issuer's DID (self-issued)
            
            if (credentialData.credentialSubject && typeof credentialData.credentialSubject === 'object') {
                // Check if subject has a 'did' field
                if (credentialData.credentialSubject.did) {
                    holderDID = credentialData.credentialSubject.did;
                    logger.info(`✅ Found student DID in credentialSubject.did: ${holderDID}`);
                }
                // Check if subject has an 'id' field (W3C VC standard)
                else if (credentialData.credentialSubject.id && credentialData.credentialSubject.id.startsWith('did:')) {
                    holderDID = credentialData.credentialSubject.id;
                    logger.info(`✅ Found student DID in credentialSubject.id: ${holderDID}`);
                } else {
                    logger.warn(`⚠️  No DID found in credentialSubject, using issuer's DID as holder`);
                }
            }

            logger.info(`📋 Creating credential: Issuer=${credentialData.issuerDID || user.did}, Holder=${holderDID}`);

            // Get issuer name from user
            const issuerName = credentialData.issuerName || user.username || 'Self';
            logger.info(`✅ Issuer name: ${issuerName}`);

            // Convert issuanceDate to proper Date object if provided as string
            let issuanceDate = Date.now(); // Default to current time
            if (credentialData.issuanceDate) {
                issuanceDate = new Date(credentialData.issuanceDate).getTime();
                logger.info(`✅ Using provided issue date: ${new Date(issuanceDate).toISOString()}`);
            } else {
                logger.info(`ℹ️  No issue date provided, using current time: ${new Date(issuanceDate).toISOString()}`);
            }

            // Convert expirationDate to proper Date object if provided
            let expirationDate = null;
            if (credentialData.expirationDate) {
                expirationDate = new Date(credentialData.expirationDate).getTime();
                logger.info(`✅ Using provided expiry date: ${new Date(expirationDate).toISOString()}`);
            }

            // Create credential document
            const credential = new Credential({
                credentialId: uuidv4(),
                userId, // Creator's user ID (LPU)
                did: user.did, // Creator's DID (LPU's DID)
                credentialType: credentialData.credentialType,
                credentialSubject: credentialData.credentialSubject,
                credentialData: encrypted,
                credentialHash,
                issuer: {
                    did: credentialData.issuerDID || user.did,
                    name: issuerName // Use username from the logged-in user
                },
                holder: holderDID, // Student's DID if specified, otherwise issuer's DID
                issuanceDate: issuanceDate, // Use the provided or current date
                expirationDate: expirationDate, // Use the provided date or null
                metadata: credentialData.metadata || {}
            });

            await credential.save();

            // Store on blockchain
            try {
                const blockchainResult = await blockchainService.storeCredential({
                    credentialId: credential.credentialId,
                    credentialHash,
                    did: user.did,
                    issuer: credential.issuer.did
                });

                // Update credential with blockchain info
                if (blockchainResult.simulated) {
                    credential.blockchainBlockNumber = blockchainResult.simulated.blockIndex;
                    credential.onBlockchain = true;
                }
                
                if (blockchainResult.ethereum) {
                    credential.blockchainTxHash = blockchainResult.ethereum.transactionHash;
                }
                
                await credential.save();
            } catch (blockchainError) {
                logger.warn('Credential saved but blockchain storage failed:', blockchainError.message);
            }

            // Optionally store on IPFS for decentralized storage
            if (ipfsService.isEnabled() && credentialData.useIPFS) {
                try {
                    const ipfsResult = await ipfsService.uploadCredential({
                        credentialId: credential.credentialId,
                        credentialHash,
                        encryptedData: encrypted,
                        timestamp: Date.now()
                    });

                    credential.ipfsCID = ipfsResult.cid;
                    credential.storageType = 'hybrid'; // Stored in both MongoDB and IPFS
                    await credential.save();

                    logger.info(`✅ Credential also stored on IPFS: ${ipfsResult.cid}`);
                } catch (ipfsError) {
                    logger.warn('Credential saved but IPFS storage failed:', ipfsError.message);
                }
            }

            logger.info(`✅ Credential stored in vault: ${credential.credentialId}`);

            return credential.toJSON();
            
        } catch (error) {
            logger.error('❌ Failed to store credential:', error.message);
            throw error;
        }
    }

    /**
     * Retrieve a credential from the vault
     * @param {string} userId - User's MongoDB ID
     * @param {string} credentialId - Credential ID
     * @param {boolean} decrypt - Whether to decrypt the credential data
     * @returns {object} Retrieved credential
     */
    async retrieveCredential(userId, credentialId, decrypt = false) {
        try {
            // Get user's DIDs to check holder field
            const User = require('../models/User');
            const DID = require('../models/DID');
            
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get all DIDs for this user
            const userDIDs = await DID.find({ userId }).select('did');
            const didList = userDIDs.map(d => d.did);

            // Try to find by MongoDB _id first, then by credentialId UUID
            let credential;
            
            // Check if it looks like a MongoDB ObjectId (24 hex chars)
            if (typeof credentialId === 'string' && /^[0-9a-fA-F]{24}$/.test(credentialId)) {
                // Find where user is either creator OR holder
                credential = await Credential.findOne({
                    $and: [
                        {
                            $or: [
                                { _id: credentialId },
                                { credentialId: credentialId }
                            ]
                        },
                        {
                            $or: [
                                { userId: userId },
                                { holder: { $in: didList } }
                            ]
                        }
                    ]
                });
            } else {
                // It's a UUID credentialId
                credential = await Credential.findOne({
                    $and: [
                        { credentialId: credentialId },
                        {
                            $or: [
                                { userId: userId },
                                { holder: { $in: didList } }
                            ]
                        }
                    ]
                });
            }

            if (!credential) {
                throw new Error('Credential not found or you do not have access to it');
            }

            const result = credential.toJSON();

            // Decrypt if requested
            if (decrypt) {
                const userWithKey = await User.findById(userId).select('+vaultKey');
                if (!userWithKey) {
                    throw new Error('User not found');
                }

                // Check if credential has encrypted data
                if (!credential.credentialData || !credential.credentialData.encryptedData || !credential.credentialData.iv) {
                    logger.warn('⚠️  Credential has no encrypted data, skipping decryption');
                } else {
                    try {
                        const decryptedData = encryptionService.decryptCredential(
                            credential.credentialData.encryptedData,
                            credential.credentialData.iv,
                            userWithKey.vaultKey
                        );
                        result.decryptedSubject = decryptedData;
                    } catch (decryptError) {
                        logger.error('❌ Decryption failed:', decryptError.message);
                        // Don't throw - just log and continue without decrypted data
                        logger.warn('⚠️  Returning credential without decrypted data');
                    }
                }
            }

            return result;
            
        } catch (error) {
            logger.error('❌ Failed to retrieve credential:', error.message);
            throw error;
        }
    }

    /**
     * List all credentials for a user
     * @param {string} userId - User's MongoDB ID
     * @param {object} filters - Optional filters (type, status)
     * @returns {Array} List of credentials
     */
    async listCredentials(userId, filters = {}) {
        try {
            // Get user's DIDs to check holder field
            const User = require('../models/User');
            const DID = require('../models/DID');
            
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get all DIDs for this user
            const userDIDs = await DID.find({ userId }).select('did');
            const didList = userDIDs.map(d => d.did);

            // Query: Find credentials where user is either creator OR holder
            const query = {
                $or: [
                    { userId: userId },                    // User created the credential (issuer)
                    { holder: { $in: didList } }          // User is the holder (received credential)
                ]
            };

            // Apply additional filters
            if (filters.credentialType) {
                query.credentialType = filters.credentialType;
            }
            if (filters.status) {
                query.status = filters.status;
            } else {
                query.status = 'active'; // Default to active only
            }

            const credentials = await Credential.find(query)
                .sort('-createdAt')
                .lean();

            logger.info(`📋 Found ${credentials.length} credentials for user ${userId} (including received credentials)`);

            return credentials;
            
        } catch (error) {
            logger.error('❌ Failed to list credentials:', error.message);
            throw error;
        }
    }

    /**
     * Update a credential
     * @param {string} userId - User's MongoDB ID
     * @param {string} credentialId - Credential ID
     * @param {object} updates - Fields to update
     * @returns {object} Updated credential
     */
    async updateCredential(userId, credentialId, updates) {
        try {
            const credential = await Credential.findOne({ 
                credentialId, 
                userId 
            });

            if (!credential) {
                throw new Error('Credential not found');
            }

            // Only allow updating certain fields
            const allowedUpdates = ['credentialSubject', 'metadata', 'expirationDate'];
            const updateKeys = Object.keys(updates);
            
            // Handle credential subject update separately due to encryption
            if (updateKeys.includes('credentialSubject')) {
                const user = await User.findById(userId).select('+vaultKey');
                if (!user) {
                    throw new Error('User not found');
                }
                const encrypted = encryptionService.encryptCredential(
                    updates.credentialSubject,
                    user.vaultKey
                );
                credential.credentialData = encrypted;
                credential.credentialSubject = updates.credentialSubject;
            }
            
            // Update other allowed fields
            updateKeys.forEach(key => {
                if (allowedUpdates.includes(key) && key !== 'credentialSubject') {
                    credential[key] = updates[key];
                }
            });

            await credential.save();

            logger.info(`✅ Credential updated: ${credentialId}`);

            return credential.toJSON();
            
        } catch (error) {
            logger.error('❌ Failed to update credential:', error.message);
            throw error;
        }
    }

    /**
     * Delete a credential from the vault
     * @param {string} userId - User's MongoDB ID
     * @param {string} credentialId - Credential ID
     * @returns {object} Success message
     */
    async deleteCredential(userId, credentialId) {
        try {
            logger.info(`🔍 Attempting to delete credential: ${credentialId} for user: ${userId}`);
            
            // Try to find by MongoDB _id first, then by credentialId UUID
            let credential;
            
            // Check if it looks like a MongoDB ObjectId (24 hex chars)
            if (typeof credentialId === 'string' && /^[0-9a-fA-F]{24}$/.test(credentialId)) {
                logger.info(`📋 Searching by MongoDB _id: ${credentialId}`);
                // Try both _id and credentialId just to be sure
                credential = await Credential.findOne({ 
                    $or: [
                        { _id: credentialId },
                        { credentialId: credentialId }
                    ],
                    userId 
                });
            } else {
                logger.info(`📋 Searching by UUID credentialId: ${credentialId}`);
                // It's a UUID credentialId or something else
                credential = await Credential.findOne({ 
                    credentialId, 
                    userId 
                });
            }

            if (!credential) {
                logger.error(`❌ Credential not found - ID: ${credentialId}, User: ${userId}`);
                throw new Error('Credential not found');
            }
            
            logger.info(`✅ Found credential: ${credential._id}`);


            await credential.deleteOne();

            logger.info(`✅ Credential deleted: ${credentialId}`);

            return { success: true, message: 'Credential deleted successfully' };
            
        } catch (error) {
            logger.error('❌ Failed to delete credential:', error.message);
            throw error;
        }
    }

    /**
     * Revoke a credential
     * @param {string} userId - User's MongoDB ID
     * @param {string} credentialId - Credential ID
     * @param {string} reason - Revocation reason
     * @returns {object} Revoked credential
     */
    async revokeCredential(userId, credentialId, reason = null) {
        try {
            // Try to find by MongoDB _id first, then by credentialId UUID
            let credential;
            
            // Check if it looks like a MongoDB ObjectId (24 hex chars)
            if (typeof credentialId === 'string' && /^[0-9a-fA-F]{24}$/.test(credentialId)) {
                // Try both _id and credentialId just to be sure
                credential = await Credential.findOne({ 
                    $or: [
                        { _id: credentialId },
                        { credentialId: credentialId }
                    ],
                    userId 
                });
            } else {
                // It's a UUID credentialId or something else
                credential = await Credential.findOne({ 
                    credentialId, 
                    userId 
                });
            }

            if (!credential) {
                throw new Error('Credential not found');
            }

            await credential.revoke(reason);

            logger.info(`✅ Credential revoked: ${credentialId}`);

            return credential.toJSON();
            
        } catch (error) {
            logger.error('❌ Failed to revoke credential:', error.message);
            throw error;
        }
    }

    /**
     * Verify a credential
     * @param {string} credentialId - Credential ID
     * @returns {object} Verification result
     */
    async verifyCredential(credentialId) {
        try {
            const credential = await Credential.findOne({ credentialId });

            if (!credential) {
                return {
                    valid: false,
                    reason: 'Credential not found'
                };
            }

            // Check expiration
            if (credential.isExpired()) {
                return {
                    valid: false,
                    reason: 'Credential expired',
                    credential: credential.toJSON()
                };
            }

            // Check status
            if (credential.status !== 'active') {
                return {
                    valid: false,
                    reason: `Credential is ${credential.status}`,
                    credential: credential.toJSON()
                };
            }

            // Verify on blockchain
            const blockchainVerification = await blockchainService.verifyCredential(
                credential.credentialHash
            );

            if (!blockchainVerification.verified) {
                return {
                    valid: false,
                    reason: 'Credential not found on blockchain',
                    credential: credential.toJSON()
                };
            }

            return {
                valid: true,
                credential: credential.toJSON(),
                blockchainVerification
            };
            
        } catch (error) {
            logger.error('❌ Credential verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Get credential statistics for a user
     * @param {string} userId - User's MongoDB ID
     * @returns {object} Statistics
     */
    async getVaultStatistics(userId) {
        try {
            const DID = require('../models/DID');
            
            // Credential stats
            const totalCredentials = await Credential.countDocuments({ userId });
            const activeCredentials = await Credential.countDocuments({ userId, status: 'active' });
            const revokedCredentials = await Credential.countDocuments({ userId, status: 'revoked' });
            const expiredCredentials = await Credential.countDocuments({ userId, status: 'expired' });
            
            // DID stats
            const totalDIDs = await DID.countDocuments({ userId });
            const activeDIDs = await DID.countDocuments({ userId, isActive: true });
            
            const credentialTypes = await Credential.aggregate([
                { $match: { userId: userId } },
                { $group: { _id: '$credentialType', count: { $sum: 1 } } }
            ]);

            return {
                totalCredentials,
                totalDIDs,
                activeDIDs,
                activeCredentials,
                revokedCredentials,
                expiredCredentials,
                byType: credentialTypes.map(t => ({ 
                    type: t._id, 
                    count: t.count 
                }))
            };
            
        } catch (error) {
            logger.error('❌ Failed to get vault statistics:', error.message);
            throw error;
        }
    }

    /**
     * Export all credentials for a user (encrypted)
     * @param {string} userId - User's MongoDB ID
     * @returns {object} Exported credentials
     */
    async exportVault(userId) {
        try {
            const credentials = await Credential.find({ userId }).lean();
            
            return {
                exportDate: new Date().toISOString(),
                totalCredentials: credentials.length,
                credentials: credentials.map(c => ({
                    credentialId: c.credentialId,
                    credentialType: c.credentialType,
                    issuer: c.issuer,
                    issuanceDate: c.issuanceDate,
                    status: c.status,
                    credentialHash: c.credentialHash,
                    ipfsCID: c.ipfsCID || null,
                    storageType: c.storageType || 'centralized'
                }))
            };
            
        } catch (error) {
            logger.error('❌ Failed to export vault:', error.message);
            throw error;
        }
    }

    /**
     * Store credential in fully decentralized mode (IPFS only, no MongoDB)
     * Stores only metadata in MongoDB, encrypted data on IPFS
     * @param {string} userId - User's MongoDB ID
     * @param {object} credentialData - Credential data to store
     * @returns {object} Stored credential with IPFS CID
     */
    async storeCredentialDecentralized(userId, credentialData) {
        try {
            if (!ipfsService.isEnabled()) {
                throw new Error('IPFS service is not enabled. Set IPFS_ENABLED=true in environment.');
            }

            // Validate user exists and get vault key
            const user = await User.findById(userId).select('+vaultKey');
            if (!user) {
                throw new Error('User not found');
            }

            // Validate required fields
            if (!credentialData.credentialType || !credentialData.credentialSubject) {
                throw new Error('Missing required credential fields');
            }

            // Encrypt credential data
            const encrypted = encryptionService.encryptCredential(
                credentialData.credentialSubject,
                user.vaultKey
            );

            // Create credential hash for blockchain
            const credentialHash = encryptionService.createHash({
                credentialType: credentialData.credentialType,
                credentialSubject: credentialData.credentialSubject,
                did: user.did,
                timestamp: Date.now()
            });

            const credentialId = uuidv4();

            // Upload encrypted data to IPFS
            const ipfsResult = await ipfsService.uploadCredential({
                credentialId,
                credentialHash,
                encryptedData: encrypted,
                timestamp: Date.now()
            });

            // Pin on IPFS for persistence
            await ipfsService.pinCredential(ipfsResult.cid);

            // Store only metadata in MongoDB (not encrypted data)
            const credential = new Credential({
                credentialId,
                userId,
                did: user.did,
                credentialType: credentialData.credentialType,
                credentialSubject: credentialData.credentialSubject, // Store unencrypted for queries
                credentialData: {
                    encryptedData: 'STORED_ON_IPFS',
                    iv: 'STORED_ON_IPFS'
                },
                credentialHash,
                issuer: {
                    did: credentialData.issuerDID || user.did,
                    name: credentialData.issuerName || 'Self'
                },
                holder: user.did,
                issuanceDate: credentialData.issuanceDate || Date.now(),
                expirationDate: credentialData.expirationDate || null,
                metadata: credentialData.metadata || {},
                ipfsCID: ipfsResult.cid,
                storageType: 'decentralized'
            });

            await credential.save();

            // Store on blockchain
            try {
                const blockchainResult = await blockchainService.storeCredential({
                    credentialId: credential.credentialId,
                    credentialHash,
                    did: user.did,
                    issuer: credential.issuer.did,
                    ipfsCID: ipfsResult.cid
                });

                if (blockchainResult.simulated) {
                    credential.blockchainBlockNumber = blockchainResult.simulated.blockIndex;
                    credential.onBlockchain = true;
                }
                
                if (blockchainResult.ethereum) {
                    credential.blockchainTxHash = blockchainResult.ethereum.transactionHash;
                }
                
                await credential.save();
            } catch (blockchainError) {
                logger.warn('Credential saved but blockchain storage failed:', blockchainError.message);
            }

            logger.info(`✅ Credential stored in DECENTRALIZED mode: ${credential.credentialId}`);
            logger.info(`📦 IPFS CID: ${ipfsResult.cid}`);

            return {
                ...credential.toJSON(),
                ipfsGatewayUrl: ipfsService.getGatewayUrl(ipfsResult.cid),
                storageInfo: {
                    type: 'decentralized',
                    ipfs: true,
                    mongodb: false,
                    blockchain: credential.onBlockchain
                }
            };
            
        } catch (error) {
            logger.error('❌ Failed to store credential in decentralized mode:', error.message);
            throw error;
        }
    }

    /**
     * Retrieve credential from IPFS (decentralized mode)
     * @param {string} userId - User's MongoDB ID
     * @param {string} credentialId - Credential ID
     * @returns {object} Retrieved credential with decrypted data from IPFS
     */
    async retrieveCredentialFromIPFS(userId, credentialId) {
        try {
            if (!ipfsService.isEnabled()) {
                throw new Error('IPFS service is not enabled');
            }

            // Get credential metadata from MongoDB
            const credential = await Credential.findOne({ credentialId, userId });
            if (!credential) {
                throw new Error('Credential not found');
            }

            if (!credential.ipfsCID) {
                throw new Error('Credential is not stored on IPFS');
            }

            // Retrieve encrypted data from IPFS
            const ipfsData = await ipfsService.retrieveCredential(credential.ipfsCID);

            // Get user's vault key for decryption
            const user = await User.findById(userId).select('+vaultKey');
            if (!user) {
                throw new Error('User not found');
            }

            // Decrypt the credential data
            const decryptedSubject = encryptionService.decryptCredential(
                ipfsData.encryptedData.encryptedData,
                ipfsData.encryptedData.iv,
                user.vaultKey
            );

            logger.info(`✅ Credential retrieved from IPFS: ${credentialId}`);

            return {
                ...credential.toJSON(),
                credentialSubject: decryptedSubject,
                ipfsGatewayUrl: ipfsService.getGatewayUrl(credential.ipfsCID),
                storageInfo: {
                    type: 'decentralized',
                    retrievedFrom: 'IPFS'
                }
            };
            
        } catch (error) {
            logger.error('❌ Failed to retrieve credential from IPFS:', error.message);
            throw error;
        }
    }

    /**
     * Get storage statistics
     * @param {string} userId - User's MongoDB ID
     * @returns {object} Storage statistics
     */
    async getStorageStats(userId) {
        try {
            const totalCredentials = await Credential.countDocuments({ userId });
            const centralizedCount = await Credential.countDocuments({ 
                userId, 
                storageType: 'centralized' 
            });
            const decentralizedCount = await Credential.countDocuments({ 
                userId, 
                storageType: 'decentralized' 
            });
            const hybridCount = await Credential.countDocuments({ 
                userId, 
                storageType: 'hybrid' 
            });

            return {
                total: totalCredentials,
                centralized: centralizedCount,
                decentralized: decentralizedCount,
                hybrid: hybridCount,
                ipfsEnabled: ipfsService.isEnabled(),
                percentageDecentralized: totalCredentials > 0 
                    ? ((decentralizedCount + hybridCount) / totalCredentials * 100).toFixed(2)
                    : 0
            };
            
        } catch (error) {
            logger.error('❌ Failed to get storage stats:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
const vaultService = new VaultService();
module.exports = vaultService;