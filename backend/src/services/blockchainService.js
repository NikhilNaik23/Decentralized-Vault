const Blockchain = require('../blockchain/Blockchain');
const smartContractManager = require('../blockchain/smartContract');
const logger = require('../utils/logger');
const { sha256 } = require('../utils/crypto');

/**
 * Blockchain Service - Manages blockchain operations
 * Handles both simulated blockchain and Ethereum integration
 */
class BlockchainService {
    constructor() {
        // Initialize simulated blockchain
        this.blockchain = new Blockchain();
        this.ethereumEnabled = false;
        
        // Try to initialize Ethereum connection
        this.initializeEthereum();
    }

    /**
     * Initialize Ethereum connection (Phase 2)
     */
    async initializeEthereum() {
        try {
            this.ethereumEnabled = await smartContractManager.initialize();
            if (this.ethereumEnabled) {
                logger.info('✅ Ethereum blockchain integration enabled');
            } else {
                logger.info('ℹ️  Running with simulated blockchain only');
            }
        } catch (error) {
            logger.warn('⚠️  Ethereum initialization failed, using simulated blockchain only');
            this.ethereumEnabled = false;
        }
    }

    /**
     * Store credential on blockchain
     * @param {object} credentialData - Credential data to store
     * @returns {object} Block information
     */
    async storeCredential(credentialData) {
        try {
            // Store on simulated blockchain
            const block = this.blockchain.storeCredential(credentialData);
            
            // Also store on Ethereum if enabled
            let ethereumResult = null;
            if (this.ethereumEnabled) {
                try {
                    ethereumResult = await smartContractManager.storeCredential(
                        credentialData.credentialHash,
                        credentialData.did
                    );
                } catch (ethError) {
                    logger.warn('⚠️  Ethereum storage failed:', ethError.message);
                }
            }

            return {
                simulated: {
                    blockIndex: block.index,
                    blockHash: block.hash,
                    timestamp: block.timestamp
                },
                ethereum: ethereumResult
            };
            
        } catch (error) {
            logger.error('❌ Failed to store credential on blockchain:', error.message);
            throw error;
        }
    }

    /**
     * Store DID document on blockchain
     * @param {object} didData - DID data to store
     * @returns {object} Block information
     */
    async storeDIDDocument(didData) {
        try {
            const block = this.blockchain.storeDIDDocument(didData);
            
            logger.info(`✅ DID stored on blockchain: ${didData.did}`);
            
            return {
                index: block.index,
                hash: block.hash,
                timestamp: block.timestamp
            };
            
        } catch (error) {
            logger.error('❌ Failed to store DID on blockchain:', error.message);
            throw error;
        }
    }

    /**
     * Verify credential exists on blockchain
     * @param {string} credentialHash - Hash of the credential
     * @returns {object} Verification result
     */
    async verifyCredential(credentialHash) {
        try {
            // Verify on simulated blockchain
            const simulatedExists = this.blockchain.verifyCredential(credentialHash);
            
            // Verify on Ethereum if enabled
            let ethereumResult = null;
            if (this.ethereumEnabled) {
                try {
                    ethereumResult = await smartContractManager.verifyCredential(credentialHash);
                } catch (ethError) {
                    logger.warn('⚠️  Ethereum verification failed:', ethError.message);
                }
            }

            return {
                simulated: simulatedExists,
                ethereum: ethereumResult,
                verified: simulatedExists || (ethereumResult && ethereumResult.valid)
            };
            
        } catch (error) {
            logger.error('❌ Credential verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Get credential from blockchain
     * @param {string} credentialId - Credential ID
     * @returns {object} Credential block
     */
    async getCredential(credentialId) {
        try {
            const block = this.blockchain.findCredential(credentialId);
            
            if (!block) {
                throw new Error('Credential not found on blockchain');
            }

            return block;
            
        } catch (error) {
            logger.error('❌ Failed to get credential from blockchain:', error.message);
            throw error;
        }
    }

    /**
     * Get all blocks for a specific DID
     * @param {string} did - Decentralized Identifier
     * @returns {Array} List of blocks
     */
    async getBlocksByDID(did) {
        try {
            const blocks = this.blockchain.getBlocksByDID(did);
            
            // Also fetch from Ethereum if enabled
            let ethereumCredentials = [];
            if (this.ethereumEnabled) {
                try {
                    ethereumCredentials = await smartContractManager.getCredentialsByDID(did);
                } catch (ethError) {
                    logger.warn('⚠️  Failed to fetch from Ethereum:', ethError.message);
                }
            }

            return {
                simulated: blocks,
                ethereum: ethereumCredentials
            };
            
        } catch (error) {
            logger.error('❌ Failed to get blocks by DID:', error.message);
            throw error;
        }
    }

    /**
     * Get blockchain statistics
     * @returns {object} Blockchain stats
     */
    getBlockchainStats() {
        try {
            return this.blockchain.getStats();
        } catch (error) {
            logger.error('❌ Failed to get blockchain stats:', error.message);
            throw error;
        }
    }

    /**
     * Get all blocks
     * @returns {Array} All blocks in the chain
     */
    getAllBlocks() {
        try {
            return this.blockchain.getAllBlocks();
        } catch (error) {
            logger.error('❌ Failed to get all blocks:', error.message);
            throw error;
        }
    }

    /**
     * Get specific block by index
     * @param {number} index - Block index
     * @returns {object} Block data
     */
    getBlock(index) {
        try {
            const block = this.blockchain.getBlock(index);
            
            if (!block) {
                throw new Error('Block not found');
            }

            return block;
            
        } catch (error) {
            logger.error('❌ Failed to get block:', error.message);
            throw error;
        }
    }

    /**
     * Validate blockchain integrity
     * @returns {boolean} True if blockchain is valid
     */
    validateChain() {
        try {
            return this.blockchain.isChainValid();
        } catch (error) {
            logger.error('❌ Chain validation failed:', error.message);
            return false;
        }
    }

    /**
     * Export blockchain data
     * @returns {object} Exported blockchain data
     */
    exportBlockchain() {
        try {
            return this.blockchain.exportChain();
        } catch (error) {
            logger.error('❌ Failed to export blockchain:', error.message);
            throw error;
        }
    }

    /**
     * Get Ethereum network information (if enabled)
     * @returns {object|null} Network info or null
     */
    async getEthereumNetworkInfo() {
        if (!this.ethereumEnabled) {
            return null;
        }

        try {
            return await smartContractManager.getNetworkInfo();
        } catch (error) {
            logger.error('❌ Failed to get Ethereum network info:', error.message);
            return null;
        }
    }

    /**
     * Check if Ethereum integration is enabled
     * @returns {boolean} True if Ethereum is enabled
     */
    isEthereumEnabled() {
        return this.ethereumEnabled;
    }

    /**
     * Get contract address (if Ethereum enabled)
     * @returns {string|null} Contract address or null
     */
    getContractAddress() {
        if (!this.ethereumEnabled) {
            return null;
        }
        return smartContractManager.getContractAddress();
    }

    /**
     * Add a custom block to the blockchain
     * @param {object} data - Block data
     * @returns {object} Created block
     */
    addBlock(data) {
        try {
            return this.blockchain.addBlock(data);
        } catch (error) {
            logger.error('❌ Failed to add block:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
const blockchainService = new BlockchainService();
module.exports = blockchainService;