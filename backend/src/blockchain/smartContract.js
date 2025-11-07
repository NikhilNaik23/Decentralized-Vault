const { ethers } = require('ethers');
const logger = require('../utils/logger');
const blockchainConfig = require('../config/blockchain');

/**
 * Smart Contract Manager for Ethereum Integration (Phase 2)
 * Manages interaction with Ethereum blockchain for credential verification
 */
class SmartContractManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.isConnected = false;
    }

    /**
     * Initialize connection to Ethereum network
     */
    async initialize() {
        try {
            const { rpcUrl, privateKey, contractAddress, abi } = blockchainConfig.ethereum;
            
            if (!rpcUrl || !privateKey || !contractAddress) {
                logger.warn('⚠️  Ethereum configuration incomplete, smart contract features disabled');
                return false;
            }

            // Connect to Ethereum provider
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Create wallet/signer
            this.signer = new ethers.Wallet(privateKey, this.provider);
            
            // Connect to smart contract
            this.contract = new ethers.Contract(contractAddress, abi, this.signer);
            
            // Test connection
            const network = await this.provider.getNetwork();
            logger.info(`✅ Connected to Ethereum ${network.name} (Chain ID: ${network.chainId})`);
            
            this.isConnected = true;
            return true;
            
        } catch (error) {
            logger.error('❌ Failed to initialize Ethereum connection:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Store credential hash on Ethereum blockchain
     * @param {string} credentialHash - Hash of the credential
     * @param {string} did - Decentralized Identifier
     */
    async storeCredential(credentialHash, did) {
        if (!this.isConnected) {
            throw new Error('Ethereum not connected. Initialize first.');
        }

        try {
            logger.info('📤 Storing credential on Ethereum...');
            
            const tx = await this.contract.storeCredential(credentialHash, did, {
                gasLimit: blockchainConfig.ethereum.gasLimit,
            });
            
            logger.info(`⏳ Transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            
            logger.info(`✅ Credential stored on Ethereum (Block: ${receipt.blockNumber})`);
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
            };
            
        } catch (error) {
            logger.error('❌ Failed to store credential on Ethereum:', error.message);
            throw error;
        }
    }

    /**
     * Verify credential exists on Ethereum blockchain
     * @param {string} credentialHash - Hash of the credential to verify
     */
    async verifyCredential(credentialHash) {
        if (!this.isConnected) {
            throw new Error('Ethereum not connected. Initialize first.');
        }

        try {
            const exists = await this.contract.verifyCredential(credentialHash);
            
            logger.info(`🔍 Credential verification: ${exists ? '✅ Valid' : '❌ Not Found'}`);
            
            return {
                valid: exists,
                credentialHash,
            };
            
        } catch (error) {
            logger.error('❌ Failed to verify credential on Ethereum:', error.message);
            throw error;
        }
    }

    /**
     * Get all credentials for a specific DID
     * @param {string} did - Decentralized Identifier
     */
    async getCredentialsByDID(did) {
        if (!this.isConnected) {
            throw new Error('Ethereum not connected. Initialize first.');
        }

        try {
            const credentials = await this.contract.getCredentialsByDID(did);
            
            logger.info(`📋 Retrieved ${credentials.length} credentials for DID: ${did}`);
            
            return credentials;
            
        } catch (error) {
            logger.error('❌ Failed to get credentials from Ethereum:', error.message);
            throw error;
        }
    }

    /**
     * Get Ethereum account balance
     */
    async getBalance() {
        if (!this.isConnected || !this.signer) {
            return '0';
        }

        try {
            const balance = await this.provider.getBalance(this.signer.address);
            return ethers.formatEther(balance);
        } catch (error) {
            logger.error('❌ Failed to get balance:', error.message);
            return '0';
        }
    }

    /**
     * Get contract address
     */
    getContractAddress() {
        return this.contract ? this.contract.target : null;
    }

    /**
     * Get signer address
     */
    getSignerAddress() {
        return this.signer ? this.signer.address : null;
    }

    /**
     * Check if connected to Ethereum
     */
    isEthereumConnected() {
        return this.isConnected;
    }

    /**
     * Get network information
     */
    async getNetworkInfo() {
        if (!this.isConnected) {
            return null;
        }

        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getFeeData();
            
            return {
                name: network.name,
                chainId: network.chainId.toString(),
                blockNumber,
                gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
            };
        } catch (error) {
            logger.error('❌ Failed to get network info:', error.message);
            return null;
        }
    }
}

// Export singleton instance
const smartContractManager = new SmartContractManager();

module.exports = smartContractManager;