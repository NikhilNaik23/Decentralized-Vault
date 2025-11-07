const crypto = require('crypto');

/**
 * Block class representing a single block in the blockchain
 */
class Block {
    constructor(index, previousHash, timestamp, data, hash = '', nonce = 0) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.nonce = nonce; // For proof-of-work mining
    }

    /**
     * Calculate hash for a block
     */
    static calculateHash(index, previousHash, timestamp, data, nonce) {
        const blockString = index + previousHash + timestamp + JSON.stringify(data) + nonce;
        return crypto.createHash('sha256').update(blockString).digest('hex');
    }

    /**
     * Mine the block by finding a hash that meets the difficulty requirement
     * @param {number} difficulty - Number of leading zeros required in hash
     */
    mineBlock(difficulty) {
        const target = '0'.repeat(difficulty);
        const startTime = Date.now();
        let attempts = 0;

        while (!this.hash.startsWith(target)) {
            this.nonce++;
            attempts++;
            this.hash = Block.calculateHash(
                this.index,
                this.previousHash,
                this.timestamp,
                this.data,
                this.nonce
            );
        }

        const endTime = Date.now();
        const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Block mined: ${this.hash}`);
        console.log(`   Attempts: ${attempts}, Time: ${timeTaken}s, Nonce: ${this.nonce}`);
        
        return {
            hash: this.hash,
            nonce: this.nonce,
            attempts,
            timeTaken,
        };
    }

    /**
     * Validate block hash
     */
    hasValidHash() {
        const calculatedHash = Block.calculateHash(
            this.index,
            this.previousHash,
            this.timestamp,
            this.data,
            this.nonce
        );
        return calculatedHash === this.hash;
    }

    /**
     * Create genesis block (first block in blockchain)
     */
    static createGenesisBlock() {
        const timestamp = Date.now();
        const data = {
            type: 'genesis',
            message: 'Genesis Block - Decentralized Identity Vault',
            creator: 'system',
        };
        const hash = Block.calculateHash(0, '0', timestamp, data, 0);
        
        return new Block(0, '0', timestamp, data, hash, 0);
    }

    /**
     * Convert block to JSON
     */
    toJSON() {
        return {
            index: this.index,
            previousHash: this.previousHash,
            timestamp: this.timestamp,
            data: this.data,
            hash: this.hash,
            nonce: this.nonce,
        };
    }

    /**
     * Create block from JSON
     */
    static fromJSON(json) {
        return new Block(
            json.index,
            json.previousHash,
            json.timestamp,
            json.data,
            json.hash,
            json.nonce
        );
    }
}

module.exports = Block;