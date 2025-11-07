const mongoose = require('mongoose');
const { sha256 } = require('../utils/crypto');
const { v4: uuidv4 } = require('uuid');

const CredentialSchema = new mongoose.Schema({
    credentialId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4(),
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User',
        index: true
    },
    did: {
        type: String,
        required: [true, 'DID is required'],
        ref: 'DID',
        index: true
    },
    credentialType: {
        type: String,
        required: [true, 'Credential type is required'],
        enum: [
            'EducationalCredential',
            'EmploymentCredential',
            'IdentityCredential',
            'HealthCredential',
            'FinancialCredential',
            'GovernmentCredential',
            'ProfessionalCredential'
        ]
    },
    credentialSubject: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Credential subject is required']
    },
    credentialData: {
        // Encrypted credential data
        encryptedData: {
            type: String,
            required: true
        },
        iv: {
            type: String,
            required: true
        }
    },
    credentialHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    issuer: {
        did: {
            type: String,
            required: true
        },
        name: {
            type: String,
            default: 'Self'
        }
    },
    holder: {
        type: String,
        required: true
    },
    issuanceDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    expirationDate: {
        type: Date,
        default: null
    },
    proof: {
        type: {
            type: String,
            default: 'Ed25519Signature2020'
        },
        created: {
            type: Date,
            default: Date.now
        },
        proofPurpose: {
            type: String,
            default: 'assertionMethod'
        },
        verificationMethod: {
            type: String,
            default: null
        },
        proofValue: {
            type: String,
            default: null
        }
    },
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired', 'suspended'],
        default: 'active'
    },
    blockchainTxHash: {
        type: String,
        default: null
    },
    blockchainBlockNumber: {
        type: Number,
        default: null
    },
    onBlockchain: {
        type: Boolean,
        default: false
    },
    // Decentralized storage (IPFS)
    ipfsCID: {
        type: String,
        default: null,
        index: true
    },
    storageType: {
        type: String,
        enum: ['centralized', 'decentralized', 'hybrid'],
        default: 'centralized'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    revokedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
CredentialSchema.index({ userId: 1, credentialType: 1 });
CredentialSchema.index({ did: 1, status: 1 });
CredentialSchema.index({ 'issuer.did': 1 });
CredentialSchema.index({ holder: 1 });

// Pre-save middleware to generate credential hash
CredentialSchema.pre('save', function(next) {
    if (!this.credentialHash) {
        // Create hash from credential subject and issuance data
        const hashData = {
            credentialId: this.credentialId,
            credentialType: this.credentialType,
            credentialSubject: this.credentialSubject,
            issuer: this.issuer,
            issuanceDate: this.issuanceDate
        };
        this.credentialHash = sha256(hashData);
    }
    
    // Set holder to DID if not specified
    if (!this.holder && this.did) {
        this.holder = this.did;
    }
    
    this.updatedAt = Date.now();
    next();
});

// Method to check if credential is expired
CredentialSchema.methods.isExpired = function() {
    if (!this.expirationDate) {
        return false;
    }
    return this.expirationDate < Date.now();
};

// Method to check if credential is valid
CredentialSchema.methods.isValid = function() {
    return this.status === 'active' && !this.isExpired();
};

// Method to revoke credential
CredentialSchema.methods.revoke = function(reason = null) {
    this.status = 'revoked';
    this.revokedAt = Date.now();
    if (reason) {
        this.metadata.revocationReason = reason;
    }
    return this.save();
};

// Method to suspend credential
CredentialSchema.methods.suspend = function(reason = null) {
    this.status = 'suspended';
    if (reason) {
        this.metadata.suspensionReason = reason;
    }
    return this.save();
};

// Method to reactivate credential
CredentialSchema.methods.reactivate = function() {
    if (this.status === 'suspended') {
        this.status = 'active';
        delete this.metadata.suspensionReason;
        return this.save();
    }
    throw new Error('Only suspended credentials can be reactivated');
};

// Method to generate Verifiable Credential format (W3C standard)
CredentialSchema.methods.toVerifiableCredential = function() {
    const vc = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.w3.org/2018/credentials/examples/v1'
        ],
        id: this.credentialId,
        type: ['VerifiableCredential', this.credentialType],
        issuer: this.issuer.did,
        issuanceDate: this.issuanceDate.toISOString(),
        credentialSubject: {
            id: this.holder,
            ...this.credentialSubject
        }
    };
    
    if (this.expirationDate) {
        vc.expirationDate = this.expirationDate.toISOString();
    }
    
    if (this.proof && this.proof.proofValue) {
        vc.proof = this.proof;
    }
    
    return vc;
};

// Static method to find active credentials by user
CredentialSchema.statics.findByUser = function(userId) {
    return this.find({ userId, status: 'active' }).sort('-createdAt');
};

// Static method to find active credentials by DID
CredentialSchema.statics.findByDID = function(did) {
    return this.find({ did, status: 'active' }).sort('-createdAt');
};

// Static method to find credential by hash
CredentialSchema.statics.findByHash = function(credentialHash) {
    return this.findOne({ credentialHash });
};

// Method to remove sensitive data for API response
CredentialSchema.methods.toJSON = function() {
    const credential = this.toObject();
    
    // Remove internal fields
    delete credential.__v;
    delete credential.credentialData; // Don't expose encrypted data
    
    return credential;
};

// Method to get safe object (with decrypted data for authorized requests)
CredentialSchema.methods.toSafeObject = function() {
    const credential = this.toObject();
    delete credential.__v;
    return credential;
};

const Credential = mongoose.model('Credential', CredentialSchema);

module.exports = Credential;