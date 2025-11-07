const Block = require('./Block');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const blockchainConfig = require('../config/blockchain');

/**
 * Blockchain class managing the entire chain
 */
class Blockchain {
    constructor() {
        this.chain = [];
        this.difficulty = blockchainConfig.simulated.difficulty;
        this.miningReward = blockchainConfig.simulated.miningReward;
        this.pendingTransactions = [];
        
        // Initialize or load blockchain
        this.initialize();
    }

    /**
     * Initialize blockchain - create genesis block or load from storage
     */
    initialize() {
        if (blockchainConfig.storage.persistToFile && this.loadFromFile()) {
            logger.info('📦 Blockchain loaded from storage');
        } else {
            this.chain = [Block.createGenesisBlock()];
            logger.info('⛓️  New blockchain created with genesis block');
        }
    }

    /**
     * Get the latest block in the chain
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Add a new block to the blockchain
     * @param {object} data - Data to store in the block
     */
    addBlock(data) {
        const latestBlock = this.getLatestBlock();
        const newIndex = latestBlock.index + 1;
        const timestamp = Date.now();
        
        const newBlock = new Block(
            newIndex,
            latestBlock.hash,
            timestamp,
            data
        );

        // Mine the block (proof-of-work)
        logger.info(`⛏️  Mining block ${newIndex}...`);
        newBlock.mineBlock(this.difficulty);
        
        // Add to chain
        this.chain.push(newBlock);
        
        // Persist to storage
        if (blockchainConfig.storage.persistToFile) {
            this.saveToFile();
        }
        
        logger.info(`✅ Block ${newIndex} added to blockchain`);
        return newBlock;
    }

    /**
     * Store credential data in blockchain
     */
    storeCredential(credentialData) {
        const blockData = {
            type: 'credential',
            credentialId: credentialData.credentialId,
            did: credentialData.did,
            credentialHash: credentialData.credentialHash,
            timestamp: Date.now(),
            issuer: credentialData.issuer || 'self',
        };
        
        return this.addBlock(blockData);
    }

    /**
     * Store DID document in blockchain
     */
    storeDIDDocument(didData) {
        const blockData = {
            type: 'did-document',
            did: didData.did,
            documentHash: didData.documentHash,
            publicKey: didData.publicKey,
            timestamp: Date.now(),
        };
        
        return this.addBlock(blockData);
    }

    /**
     * Validate the entire blockchain
     */
    isChainValid() {
        // Check genesis block
        const genesisBlock = this.chain[0];
        const validGenesis = genesisBlock.index === 0 && 
                            genesisBlock.previousHash === '0';
        
        if (!validGenesis) {
            logger.error('❌ Genesis block is invalid');
            return false;
        }

        // Validate each block
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if block hash is valid
            if (!currentBlock.hasValidHash()) {
                logger.error(`❌ Block ${i} has invalid hash`);
                return false;
            }

            // Check if previous hash matches
            if (currentBlock.previousHash !== previousBlock.hash) {
                logger.error(`❌ Block ${i} has invalid previous hash`);
                return false;
            }

            // Check proof-of-work (difficulty)
            const target = '0'.repeat(this.difficulty);
            if (!currentBlock.hash.startsWith(target)) {
                logger.error(`❌ Block ${i} doesn't meet difficulty requirement`);
                return false;
            }
        }

        logger.info('✅ Blockchain is valid');
        return true;
    }

    /**
     * Get all blocks
     */
    getAllBlocks() {
        return this.chain.map(block => block.toJSON());
    }

    /**
     * Get block by index
     */
    getBlock(index) {
        if (index >= 0 && index < this.chain.length) {
            return this.chain[index].toJSON();
        }
        return null;
    }

    /**
     * Get blocks by DID
     */
    getBlocksByDID(did) {
        return this.chain
            .filter(block => 
                block.data && 
                (block.data.did === did || block.data.holder === did)
            )
            .map(block => block.toJSON());
    }

    /**
     * Search credentials by ID
     */
    findCredential(credentialId) {
        for (let i = this.chain.length - 1; i >= 0; i--) {
            const block = this.chain[i];
            if (block.data && 
                block.data.type === 'credential' && 
                block.data.credentialId === credentialId) {
                return block.toJSON();
            }
        }
        return null;
    }

    /**
     * Verify credential exists in blockchain
     */
    verifyCredential(credentialHash) {
        return this.chain.some(block => 
            block.data && 
            block.data.credentialHash === credentialHash
        );
    }

    /**
     * Get blockchain statistics
     */
    getStats() {
        return {
            totalBlocks: this.chain.length,
            difficulty: this.difficulty,
            latestBlock: this.getLatestBlock().toJSON(),
            isValid: this.isChainValid(),
            totalCredentials: this.chain.filter(b => 
                b.data && b.data.type === 'credential'
            ).length,
            totalDIDs: this.chain.filter(b => 
                b.data && b.data.type === 'did-document'
            ).length,
        };
    }

    /**
     * Save blockchain to file
     */
    saveToFile() {
        try {
            const dataDir = path.dirname(blockchainConfig.storage.filePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            const data = JSON.stringify(this.chain.map(block => block.toJSON()), null, 2);
            fs.writeFileSync(blockchainConfig.storage.filePath, data);
            logger.info('💾 Blockchain saved to file');
        } catch (error) {
            logger.error('❌ Failed to save blockchain:', error.message);
        }
    }

    /**
     * Load blockchain from file
     */
    loadFromFile() {
        try {
            if (fs.existsSync(blockchainConfig.storage.filePath)) {
                const data = fs.readFileSync(blockchainConfig.storage.filePath, 'utf8');
                const blocks = JSON.parse(data);
                
                this.chain = blocks.map(blockData => Block.fromJSON(blockData));
                
                // Validate loaded chain
                if (!this.isChainValid()) {
                    logger.warn('⚠️  Loaded blockchain is invalid, starting fresh');
                    return false;
                }
                
                return true;
            }
        } catch (error) {
            logger.error('❌ Failed to load blockchain:', error.message);
        }
        return false;
    }

    /**
     * Export blockchain data
     */
    exportChain() {
        return {
            blocks: this.getAllBlocks(),
            stats: this.getStats(),
            exportedAt: new Date().toISOString(),
        };
    }
}

module.exports = Blockchain;