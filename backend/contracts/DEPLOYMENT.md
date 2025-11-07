# Ethereum Smart Contract Deployment Guide

## Prerequisites

1. Install Hardhat or Truffle for contract compilation and deployment
2. Get Sepolia testnet ETH from a faucet
3. Create an Infura or Alchemy account for RPC access

## Setup with Hardhat

### 1. Install Hardhat
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Initialize Hardhat
```bash
npx hardhat init
```

### 3. Configure hardhat.config.js
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.ETHEREUM_PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

### 4. Compile Contract
```bash
npx hardhat compile
```

### 5. Create Deployment Script

Create `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying IdentityVaultContract...");

  const IdentityVault = await hre.ethers.getContractFactory("IdentityVaultContract");
  const identityVault = await IdentityVault.deploy();

  await identityVault.waitForDeployment();

  const address = await identityVault.getAddress();
  console.log("IdentityVaultContract deployed to:", address);
  
  // Update .env file with contract address
  console.log("\nAdd this to your .env file:");
  console.log(`ETHEREUM_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 6. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 7. Verify Contract (Optional)
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Testing Smart Contract Locally

### 1. Start Local Hardhat Node
```bash
npx hardhat node
```

### 2. Deploy to Local Network
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Run Tests
```bash
npx hardhat test
```

## Get Testnet ETH

### Sepolia Faucets:
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia
- https://sepolia-faucet.pk910.de/

## Smart Contract Functions

### storeCredential(credentialHash, did)
Store a credential hash on the blockchain

### verifyCredential(credentialHash)
Verify if a credential exists

### getCredentialsByDID(did)
Get all credentials for a specific DID

### getCredentialDetails(credentialHash)
Get detailed information about a credential

### getTotalCredentials()
Get total number of stored credentials

## Integration with Backend

After deployment, update your `.env` file:
```
ETHEREUM_CONTRACT_ADDRESS=0xYourDeployedContractAddress
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_PRIVATE_KEY=your-private-key
```

The backend will automatically connect to the smart contract on startup if properly configured.

## Gas Estimation

Typical gas costs on Sepolia:
- Store Credential: ~100,000-150,000 gas
- Verify Credential: ~30,000 gas (view function, no gas cost)
- Get Credentials by DID: ~50,000 gas (view function, no gas cost)

## Security Notes

1. Never commit private keys to version control
2. Use environment variables for sensitive data
3. Keep private keys secure
4. Use separate wallets for development and production
5. Consider using multi-signature wallets for production
