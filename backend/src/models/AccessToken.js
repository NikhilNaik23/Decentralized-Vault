const mongoose = require('mongoose');

const AccessTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    did: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appId: {
        type: String,
        required: true
    },
    scope: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    revoked: {
        type: Boolean,
        default: false
    },
    lastUsedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for cleanup and queries
AccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AccessTokenSchema.index({ userId: 1, appId: 1 });

// Method to check if token is still valid
AccessTokenSchema.methods.isValid = function() {
    return !this.revoked && this.expiresAt > new Date();
};

// Update last used timestamp
AccessTokenSchema.methods.updateLastUsed = function() {
    this.lastUsedAt = new Date();
    return this.save();
};

const AccessToken = mongoose.model('AccessToken', AccessTokenSchema);

module.exports = AccessToken;
