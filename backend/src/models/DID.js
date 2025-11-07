const mongoose = require('mongoose');
const { generateDID, validateDID } = require('../utils/helpers');
const { sha256 } = require('../utils/crypto');

const DIDSchema = new mongoose.Schema({
    did: {
        type: String,
        required: [true, 'DID identifier is required'],
        unique: true,
        index: true,
        validate: {
            validator: validateDID,
            message: 'Invalid DID format'
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    method: {
        type: String,
        default: 'vault',
        enum: ['vault', 'key', 'web', 'ethr']
    },
    publicKey: {
        type: String,
        required: [true, 'Public key is required']
    },
    controller: {
        type: String,
        default: null
    },
    document: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    documentHash: {
        type: String,
        default: null
    },
    authentication: {
        type: [{
            id: { type: String },
            type: { type: String },
            publicKey: { type: String }
        }],
        default: []
    },
    service: {
        type: [{
            id: { type: String },
            type: { type: String },
            serviceEndpoint: { type: String }
        }],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    blockchainTxHash: {
        type: String,
        default: null
    },
    blockchainBlockNumber: {
        type: Number,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deactivatedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Middleware to update the updatedAt field before saving
DIDSchema.pre('save', function(next) {
    // Generate DID if not present
    if (!this.did && this.method) {
        this.did = generateDID(this.method);
    }
    
    // Generate document hash if document is present
    if (this.document && Object.keys(this.document).length > 0) {
        this.documentHash = sha256(this.document);
    }
    
    // Set controller to DID itself if not specified
    if (!this.controller) {
        this.controller = this.did;
    }
    
    this.updatedAt = Date.now();
    next();
});

// Method to generate DID Document following W3C DID Core specification
DIDSchema.methods.generateDIDDocument = function() {
    const didDoc = {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        id: this.did,
        controller: this.controller || this.did,
        verificationMethod: [{
            id: `${this.did}#keys-1`,
            type: 'Ed25519VerificationKey2020',
            controller: this.did,
            publicKeyBase58: this.publicKey
        }],
        authentication: [
            `${this.did}#keys-1`
        ],
        assertionMethod: [
            `${this.did}#keys-1`
        ],
        created: this.createdAt.toISOString(),
        updated: this.updatedAt.toISOString()
    };
    
    // Add service endpoints if present
    if (this.service && this.service.length > 0) {
        didDoc.service = this.service;
    }
    
    return didDoc;
};

// Method to update DID Document
DIDSchema.methods.updateDocument = function(updates) {
    this.document = { ...this.document, ...updates };
    this.documentHash = sha256(this.document);
    this.updatedAt = Date.now();
    return this.save();
};

// Method to add service endpoint
DIDSchema.methods.addService = function(serviceId, serviceType, endpoint) {
    const service = {
        id: `${this.did}#${serviceId}`,
        type: serviceType,
        serviceEndpoint: endpoint
    };
    
    this.service.push(service);
    return this.save();
};

// Method to deactivate DID
DIDSchema.methods.deactivate = function() {
    this.isActive = false;
    this.deactivatedAt = Date.now();
    return this.save();
};

// Method to reactivate DID
DIDSchema.methods.reactivate = function() {
    this.isActive = true;
    this.deactivatedAt = null;
    return this.save();
};

// Static method to find by DID
DIDSchema.statics.findByDID = function(did) {
    return this.findOne({ did, isActive: true });
};

// Static method to find by user
DIDSchema.statics.findByUser = function(userId) {
    return this.find({ userId, isActive: true });
};

// Method to get public representation
DIDSchema.methods.toPublicObject = function() {
    return {
        _id: this._id,
        did: this.did,
        method: this.method,
        publicKey: this.publicKey,
        controller: this.controller,
        document: this.generateDIDDocument(),
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

const DID = mongoose.model('DID', DIDSchema);

module.exports = DID;