const mongoose = require('mongoose');
const crypto = require('crypto');

const RegisteredAppSchema = new mongoose.Schema({
    appId: {
        type: String,
        required: true,
        unique: true,
        default: () => `app_${crypto.randomBytes(16).toString('hex')}`
    },
    appName: {
        type: String,
        required: [true, 'App name is required'],
        trim: true
    },
    appSecret: {
        type: String,
        required: true,
        default: () => crypto.randomBytes(32).toString('hex')
    },
    redirectUris: [{
        type: String,
        required: true,
        validate: {
            validator: function(uri) {
                return /^https?:\/\/.+/.test(uri);
            },
            message: 'Invalid redirect URI format'
        }
    }],
    description: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    logoUrl: {
        type: String,
        trim: true
    },
    scopes: [{
        type: String,
        enum: ['basic_profile', 'credentials', 'age_verification', 'email', 'phone', 'openid', 'profile', 'dids']
    }],
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow null for public apps
    },
    developerEmail: {
        type: String,
        trim: true
    },
    isPublicApp: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
RegisteredAppSchema.index({ appId: 1 });
RegisteredAppSchema.index({ ownerId: 1 });

// Method to validate redirect URI
RegisteredAppSchema.methods.isValidRedirectUri = function(uri) {
    return this.redirectUris.includes(uri);
};

// Method to mask app secret (for API responses)
RegisteredAppSchema.methods.toSafeObject = function() {
    const app = this.toObject();
    app.appSecret = `${app.appSecret.substring(0, 8)}...`;
    return app;
};

const RegisteredApp = mongoose.model('RegisteredApp', RegisteredAppSchema);

module.exports = RegisteredApp;
