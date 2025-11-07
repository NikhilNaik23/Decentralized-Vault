# Decentralized Identity Vault

A blockchain-based decentralized identity management system with secure credential storage, OAuth 2.0 integration, and public verification capabilities.

## 🚀 Features

- **Decentralized Identifiers (DIDs)** - Create and manage multiple DIDs using different methods (vault, key, web)
- **Secure Credential Storage** - AES-256-GCM encrypted vault for storing credentials
- **Blockchain Integration** - Simulated blockchain with optional Ethereum Sepolia testnet support
- **Public Verification** - Verify credential authenticity without exposing personal data
- **OAuth 2.0 Integration** - "Sign in with DID" for external applications
- **Connected Apps Management** - View and revoke access to authorized applications
- **Auto-Approval** - Seamless repeat sign-ins for previously authorized apps

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│   - DID Management                      │
│   - Credential Storage                  │
│   - OAuth Authentication                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      Node.js + Express Backend          │
│   - REST API                            │
│   - JWT Authentication                  │
│   - Blockchain Integration              │
└──────────┬──────────────────────────────┘
           │
           ├─────────────┬─────────────┐
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ MongoDB  │  │Simulated │  │ Ethereum │
    │ Database │  │Blockchain│  │ (Sepolia)│
    └──────────┘  └──────────┘  └──────────┘
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB 7.0 |
| Blockchain | Custom JavaScript (Simulated) |
| Optional Blockchain | Ethereum Sepolia + Solidity |
| Encryption | AES-256-GCM |
| Authentication | JWT + OAuth 2.0 |
| Containerization | Docker + Docker Compose |

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 18+ (for local development)
- **Git** for version control

## 🐳 Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DecentralizedIdentityVault
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health

### 4. Stop Services

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v
```

## 🖥️ Local Development Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server
npm run dev
```

**Backend runs on:** http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on:** http://localhost:5173

### MongoDB Setup (Local)

Make sure MongoDB is running on `localhost:27017` without authentication:

```bash
# Windows (PowerShell)
Start-Service MongoDB

# Linux/Mac
sudo systemctl start mongod
```

## 📁 Project Structure

```
DecentralizedIdentityVault/
├── backend/
│   ├── src/
│   │   ├── blockchain/          # Blockchain implementation
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # MongoDB models
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utility functions
│   ├── blockchain-data/         # Blockchain storage
│   ├── contracts/               # Ethereum smart contracts
│   ├── logs/                    # Application logs
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── context/             # React context
│   │   ├── hooks/               # Custom hooks
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   └── utils/               # Utility functions
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/identity-vault

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Encryption
ENCRYPTION_KEY=your-encryption-key
ENCRYPTION_ALGORITHM=aes-256-gcm

# Blockchain
BLOCKCHAIN_DIFFICULTY=4

# Ethereum (Optional)
ETHEREUM_ENABLED=false
ETHEREUM_NETWORK=sepolia
ETHEREUM_RPC_URL=
ETHEREUM_PRIVATE_KEY=
ETHEREUM_CONTRACT_ADDRESS=

# IPFS
IPFS_ENABLED=true
IPFS_GATEWAY=https://ipfs.io/ipfs/

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### DID Management

- `GET /api/did` - Get all user DIDs
- `POST /api/did/create` - Create new DID
- `GET /api/did/:id` - Get specific DID
- `DELETE /api/did/:id` - Delete DID

### Credential Management

- `GET /api/credentials` - Get all credentials
- `POST /api/credentials` - Create new credential
- `GET /api/credentials/:id` - Get specific credential
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential
- `POST /api/credentials/:id/revoke` - Revoke credential

### Blockchain

- `GET /api/blockchain` - Get blockchain info
- `GET /api/blockchain/blocks` - Get all blocks
- `POST /api/blockchain/verify` - Verify credential hash

### Public Verification

- `POST /api/credentials/public/verify-hash` - Verify credential (no auth required)

### OAuth 2.0

- `GET /api/oauth/authorize` - Authorization endpoint
- `POST /api/oauth/token` - Token endpoint
- `GET /api/oauth/userinfo` - User info endpoint
- `GET /api/oauth/connected-apps` - Get connected apps
- `POST /api/oauth/connected-apps/:appId/revoke` - Revoke app access

## 🎯 User Guide

### 1. Register and Create DID

1. Navigate to http://localhost (or http://localhost:5173 for dev)
2. Click "Register" and create an account
3. After login, go to "DIDs" → "Create DID"
4. Select a DID method (vault, key, or web)
5. Your DID will be generated

### 2. Add Credentials

1. Go to "Credentials" → "Add Credential"
2. Fill in credential details:
   - Type (Educational, Professional, etc.)
   - Subject information
   - Select issuer DID
   - Set issue and expiration dates
3. Credential is encrypted and stored
4. Hash is stored on blockchain

### 3. Verify Credentials Publicly

1. Go to "Verify" page (no login required)
2. Enter the credential hash
3. View verification results with blockchain proof

### 4. OAuth Integration ("Sign in with DID")

1. Register your app at `/developers/register`
2. Get Client ID and Client Secret
3. Implement OAuth flow in your application
4. Users can sign in with their DID
5. Users can manage connected apps and revoke access

### 5. Manage Connected Apps

1. Go to "Connected Apps"
2. View all apps you've authorized
3. See last used time and active tokens
4. Click "Revoke Access" to remove app access

## 🔧 Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Restart specific service
docker-compose restart backend

# Execute command in container
docker-compose exec backend npm run test
docker-compose exec mongodb mongosh

# Check container status
docker-compose ps
```

## 🧪 Testing

### Run Tests (Local)

```bash
# Backend tests
cd backend
npm test

# Run specific test file
npm test -- tests/unit/blockchain.test.js

# Run integration tests
npm run test:integration
```

### Run Tests (Docker)

```bash
docker-compose exec backend npm test
```

## 🚀 Deployment

### Production Build

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start in production mode
docker-compose up -d
```

### Environment Variables for Production

Update `docker-compose.yml` or create `.env` file with production values:

```env
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/identity-vault
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-strong-key>
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Problem:** Backend can't connect to MongoDB

**Solution:**
```bash
# Check MongoDB container is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Frontend Can't Reach Backend

**Problem:** API calls failing from frontend

**Solution:** Check `VITE_API_URL` in frontend `.env`:
- Docker: `http://localhost:5000/api`
- Local dev: `http://localhost:5000/api`

### Port Already in Use

**Problem:** Port 80, 5000, or 27017 already in use

**Solution:** 
1. Stop other services using those ports
2. Or modify ports in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"    # Frontend on 8080 instead of 80
  - "5001:5000"  # Backend on 5001 instead of 5000
```

### Containers Not Starting

```bash
# Check Docker daemon is running
docker ps

# View all container logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 🔐 Security Features

- **AES-256-GCM Encryption** for credential storage
- **JWT Authentication** with secure token signing
- **OAuth 2.0** Authorization Code flow with PKCE
- **SHA-256** cryptographic hashing for blockchain
- **Rate Limiting** on API endpoints
- **CORS Protection** with configurable origins
- **Input Validation** on all endpoints
- **SQL Injection Protection** via MongoDB ODM

## 📊 Performance

- **API Response Time:** < 100ms (average)
- **Blockchain Verification:** < 500ms
- **Credential Storage:** < 200ms
- **Public Verification:** < 300ms

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- W3C DID Specification
- Verifiable Credentials Data Model
- OAuth 2.0 Framework
- Ethereum Community
- Open Source Community

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: your-email@example.com

## 🔗 Related Projects

- [TodoApp](../TodoApp) - Example app with DID authentication integration
- [Sign In with DID Guide](../SignInWithDID.md) - Integration documentation

---

**Built with ❤️ using blockchain technology and modern DevOps practices**
