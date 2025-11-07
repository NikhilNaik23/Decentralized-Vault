const mongoose = require('mongoose');

const AuthCodeSchema = new mongoose.Schema({
    code: {
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
    redirectUri: {
        type: String,
        required: true
    },
    codeChallenge: {
        type: String
    },
    codeChallengeMethod: {
        type: String,
        enum: ['plain', 'S256']
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for cleanup
AuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if code is still valid
AuthCodeSchema.methods.isValid = function() {
    return !this.used && this.expiresAt > new Date();
};

const AuthCode = mongoose.model('AuthCode', AuthCodeSchema);

module.exports = AuthCode;
