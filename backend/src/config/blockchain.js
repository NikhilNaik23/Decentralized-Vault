const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // Simulated Blockchain Configuration
  simulated: {
    difficulty: parseInt(process.env.BLOCKCHAIN_DIFFICULTY, 10) || 4,
    miningReward: parseInt(process.env.BLOCKCHAIN_MINING_REWARD, 10) || 10,
    genesisBlock: {
      timestamp: '01/01/2024',
      data: 'Genesis Block - Decentralized Identity Vault',
      previousHash: '0',
    },
  },
  
  // Ethereum Blockchain Configuration (Phase 2)
  ethereum: {
    network: process.env.ETHEREUM_NETWORK || 'sepolia',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    privateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
    contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS || '',
    chainId: 11155111, // Sepolia chain ID
    gasLimit: 3000000,
    gasPrice: null, // Auto-calculate
    abi: [
      {
        "inputs": [
          {"internalType": "string", "name": "credentialHash", "type": "string"},
          {"internalType": "string", "name": "did", "type": "string"}
        ],
        "name": "storeCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "string", "name": "credentialHash", "type": "string"}],
        "name": "verifyCredential",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "string", "name": "did", "type": "string"}],
        "name": "getCredentialsByDID",
        "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
  },
  
  // Blockchain Storage Settings
  storage: {
    persistToFile: true,
    filePath: './blockchain-data/chain.json',
    backupInterval: 3600000, // 1 hour in milliseconds
  },
};