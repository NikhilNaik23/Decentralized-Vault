const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateDID } = require('../utils/helpers');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    did: {
        type: String,
        required: false, // Generated automatically in pre-save hook
        unique: true,
        index: true
    },
    publicKey: {
        type: String,
        default: null
    },
    privateKey: {
        type: String,
        default: null,
        select: false // Never include private key in queries
    },
    vaultKey: {
        type: String,
        required: true,
        select: false // Encryption key for user's vault
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
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

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ did: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash password if it has been modified
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to generate DID if not present
userSchema.pre('save', function(next) {
    if (!this.did) {
        this.did = generateDID('vault');
    }
    this.updatedAt = Date.now();
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
    // Reset attempts if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    // Otherwise increment attempts
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0, lastLogin: Date.now() },
        $unset: { lockUntil: 1 }
    });
};

// Static method to find by username
userSchema.statics.findByUsername = function(username) {
    return this.findOne({ username });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by DID
userSchema.statics.findByDID = function(did) {
    return this.findOne({ did });
};

// Method to sanitize user object (remove sensitive data)
userSchema.methods.toSafeObject = function() {
    const user = this.toObject();
    delete user.password;
    delete user.privateKey;
    delete user.vaultKey;
    delete user.__v;
    delete user.loginAttempts;
    delete user.lockUntil;
    return user;
};

// Virtual for user's credentials
userSchema.virtual('credentials', {
    ref: 'Credential',
    localField: '_id',
    foreignField: 'userId'
});

const User = mongoose.model('User', userSchema);

module.exports = User;