const crypto = require('crypto');
const RegisteredApp = require('../models/RegisteredApp');
const AuthCode = require('../models/AuthCode');
const AccessToken = require('../models/AccessToken');
const User = require('../models/User');
const DID = require('../models/DID');

class OAuthController {
    // Register new application
    async registerApp(req, res) {
        try {
            const { appName, redirectUris, description, website, logoUrl, scopes } = req.body;
            const userId = req.user._id;

            if (!appName || !redirectUris || redirectUris.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'App name and at least one redirect URI are required'
                });
            }

            const app = new RegisteredApp({
                appName,
                redirectUris,
                description,
                website,
                logoUrl,
                scopes: scopes || ['basic_profile'],
                ownerId: userId
            });

            await app.save();

            res.status(201).json({
                success: true,
                message: 'Application registered successfully',
                data: {
                    appId: app.appId,
                    appSecret: app.appSecret,
                    appName: app.appName,
                    redirectUris: app.redirectUris,
                    scopes: app.scopes
                }
            });
        } catch (error) {
            console.error('Error registering app:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register application',
                error: error.message
            });
        }
    }

    // Public app registration (no authentication required)
    async publicRegisterApp(req, res) {
        try {
            const { appName, redirectUri, description, website, logoUrl, developerEmail } = req.body;

            if (!appName || !redirectUri || !developerEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'App name, redirect URI, and developer email are required'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(developerEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email address'
                });
            }

            // Validate redirect URI format
            try {
                new URL(redirectUri);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid redirect URI format'
                });
            }

            const app = new RegisteredApp({
                appName,
                redirectUris: [redirectUri],
                description: description || 'No description provided',
                website: website || '',
                logoUrl: logoUrl || '',
                scopes: ['openid', 'profile', 'email'], // Default scopes
                ownerId: null, // Public registration - no owner
                developerEmail: developerEmail,
                isPublicApp: true
            });

            await app.save();

            res.status(201).json({
                success: true,
                message: 'Application registered successfully',
                data: {
                    clientId: app.appId,
                    clientSecret: app.appSecret,
                    appName: app.appName,
                    redirectUri: app.redirectUris[0]
                }
            });
        } catch (error) {
            console.error('Error in public app registration:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register application',
                error: error.message
            });
        }
    }

    // Get user's registered apps
    async getUserApps(req, res) {
        try {
            const userId = req.user._id;
            const apps = await RegisteredApp.find({ ownerId: userId, isActive: true });

            res.json({
                success: true,
                data: apps.map(app => app.toSafeObject())
            });
        } catch (error) {
            console.error('Error fetching user apps:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch applications',
                error: error.message
            });
        }
    }

    // Get app details (public info only)
    async getAppDetails(req, res) {
        try {
            const { appId } = req.params;
            const app = await RegisteredApp.findOne({ appId, isActive: true });

            if (!app) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            res.json({
                success: true,
                data: {
                    appId: app.appId,
                    appName: app.appName,
                    description: app.description,
                    website: app.website,
                    logoUrl: app.logoUrl,
                    scopes: app.scopes
                }
            });
        } catch (error) {
            console.error('Error fetching app details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch app details',
                error: error.message
            });
        }
    }

    // Authorization endpoint - Show consent screen or auto-approve if already authorized
    async authorize(req, res) {
        try {
            const { client_id, redirect_uri, scope, state, response_type, prompt } = req.query;

            // Validate parameters
            if (!client_id || !redirect_uri || !response_type) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required parameters: client_id, redirect_uri, response_type'
                });
            }

            if (response_type !== 'code') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid response_type. Only "code" is supported'
                });
            }

            // Verify app exists and redirect URI is registered
            const app = await RegisteredApp.findOne({ appId: client_id, isActive: true });
            if (!app) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid client_id'
                });
            }

            if (!app.isValidRedirectUri(redirect_uri)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid redirect_uri'
                });
            }

            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User must be authenticated',
                    loginRequired: true,
                    returnUrl: req.originalUrl
                });
            }

            // Get user's DIDs
            const dids = await DID.find({ userId: req.user._id, isActive: true });

            if (dids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No DIDs found. Please create a DID first.'
                });
            }

            // Check if user has already authorized this app (unless prompt=consent is specified)
            if (prompt !== 'consent') {
                const existingToken = await AccessToken.findOne({
                    userId: req.user._id,
                    appId: client_id,
                    revoked: false,
                    expiresAt: { $gt: new Date() }
                });

                // If user has previously authorized this app, auto-approve
                if (existingToken) {
                    // Generate authorization code automatically
                    const code = crypto.randomBytes(32).toString('hex');
                    const authCode = new AuthCode({
                        code,
                        did: existingToken.did,
                        userId: req.user._id,
                        appId: client_id,
                        scope: scope || existingToken.scope,
                        redirectUri: redirect_uri
                    });

                    await authCode.save();

                    // Build redirect URL with code
                    const redirectUrl = new URL(redirect_uri);
                    redirectUrl.searchParams.set('code', code);
                    if (state) {
                        redirectUrl.searchParams.set('state', state);
                    }

                    // Return auto-approval response
                    return res.json({
                        success: true,
                        autoApproved: true,
                        data: {
                            redirectUrl: redirectUrl.toString()
                        }
                    });
                }
            }

            // Show consent screen
            res.json({
                success: true,
                autoApproved: false,
                data: {
                    app: {
                        appId: app.appId,
                        appName: app.appName,
                        description: app.description,
                        website: app.website,
                        logoUrl: app.logoUrl
                    },
                    scope: scope || 'basic_profile',
                    state,
                    redirectUri: redirect_uri,
                    dids: dids.map(did => ({
                        did: did.did,
                        method: did.method
                    }))
                }
            });
        } catch (error) {
            console.error('Error in authorize:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization failed',
                error: error.message
            });
        }
    }

    // Approve authorization - Generate auth code
    async approveAuthorization(req, res) {
        try {
            const { client_id, redirect_uri, scope, state, did } = req.body;
            const userId = req.user._id;

            // Validate app
            const app = await RegisteredApp.findOne({ appId: client_id, isActive: true });
            if (!app || !app.isValidRedirectUri(redirect_uri)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid client or redirect URI'
                });
            }

            // Verify DID belongs to user
            const userDID = await DID.findOne({ did, userId, isActive: true });
            if (!userDID) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid DID'
                });
            }

            // Generate authorization code
            const code = crypto.randomBytes(32).toString('hex');
            const authCode = new AuthCode({
                code,
                did,
                userId,
                appId: client_id,
                scope: scope || 'basic_profile',
                redirectUri: redirect_uri
            });

            await authCode.save();

            // Build redirect URL with code
            const redirectUrl = new URL(redirect_uri);
            redirectUrl.searchParams.set('code', code);
            if (state) {
                redirectUrl.searchParams.set('state', state);
            }

            res.json({
                success: true,
                message: 'Authorization approved',
                data: {
                    redirectUrl: redirectUrl.toString()
                }
            });
        } catch (error) {
            console.error('Error approving authorization:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve authorization',
                error: error.message
            });
        }
    }

    // Token endpoint - Exchange auth code for access token
    async token(req, res) {
        try {
            const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

            if (grant_type !== 'authorization_code') {
                return res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: 'Only authorization_code grant type is supported'
                });
            }

            // Verify client credentials
            const app = await RegisteredApp.findOne({ appId: client_id, isActive: true });
            if (!app || app.appSecret !== client_secret) {
                return res.status(401).json({
                    error: 'invalid_client',
                    error_description: 'Invalid client credentials'
                });
            }

            // Find and validate auth code
            const authCode = await AuthCode.findOne({ code, appId: client_id });
            if (!authCode || !authCode.isValid()) {
                return res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'Invalid or expired authorization code'
                });
            }

            if (authCode.redirectUri !== redirect_uri) {
                return res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'Redirect URI mismatch'
                });
            }

            // Mark code as used
            authCode.used = true;
            await authCode.save();

            // Generate access token
            const tokenString = crypto.randomBytes(32).toString('hex');
            const accessToken = new AccessToken({
                token: tokenString,
                did: authCode.did,
                userId: authCode.userId,
                appId: client_id,
                scope: authCode.scope
            });

            await accessToken.save();

            res.json({
                access_token: tokenString,
                token_type: 'Bearer',
                expires_in: 86400, // 24 hours
                scope: authCode.scope,
                did: authCode.did
            });
        } catch (error) {
            console.error('Error exchanging token:', error);
            res.status(500).json({
                error: 'server_error',
                error_description: 'Failed to exchange token'
            });
        }
    }

    // UserInfo endpoint - Get user information
    async userInfo(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'invalid_token',
                    error_description: 'Missing or invalid authorization header'
                });
            }

            const token = authHeader.substring(7);
            const accessToken = await AccessToken.findOne({ token }).populate('userId');

            if (!accessToken || !accessToken.isValid()) {
                return res.status(401).json({
                    error: 'invalid_token',
                    error_description: 'Invalid or expired access token'
                });
            }

            // Update last used timestamp
            await accessToken.updateLastUsed();

            // Get DID details
            const did = await DID.findOne({ did: accessToken.did, userId: accessToken.userId });
            if (!did) {
                return res.status(404).json({
                    error: 'not_found',
                    error_description: 'DID not found'
                });
            }

            const scopes = accessToken.scope.split(' ');
            const response = {
                sub: accessToken.did,
                did: accessToken.did,
                did_method: did.method
            };

            // Include additional info based on scope
            if (scopes.includes('basic_profile')) {
                response.username = accessToken.userId.username;
                response.created_at = did.createdAt;
            }

            if (scopes.includes('email') && accessToken.userId.email) {
                response.email = accessToken.userId.email;
            }

            res.json(response);
        } catch (error) {
            console.error('Error fetching user info:', error);
            res.status(500).json({
                error: 'server_error',
                error_description: 'Failed to fetch user information'
            });
        }
    }

    // Get user's authorized apps (connected apps)
    async getAuthorizedApps(req, res) {
        try {
            const userId = req.user._id;

            // Get all active access tokens for this user
            const tokens = await AccessToken.find({
                userId,
                revoked: false,
                expiresAt: { $gt: new Date() }
            });

            // Get unique app IDs
            const appIds = [...new Set(tokens.map(t => t.appId))];

            // Fetch app details
            const apps = await RegisteredApp.find({ appId: { $in: appIds }, isActive: true });

            // Build response with last used info
            const authorizedApps = apps.map(app => {
                const appTokens = tokens.filter(t => t.appId === app.appId);
                const lastUsed = appTokens.reduce((latest, t) => {
                    return t.lastUsedAt && (!latest || t.lastUsedAt > latest) ? t.lastUsedAt : latest;
                }, null);

                return {
                    appId: app.appId,
                    appName: app.appName,
                    description: app.description,
                    website: app.website,
                    logoUrl: app.logoUrl,
                    lastUsedAt: lastUsed,
                    tokenCount: appTokens.length
                };
            });

            res.json({
                success: true,
                data: authorizedApps
            });
        } catch (error) {
            console.error('Error fetching authorized apps:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch authorized apps',
                error: error.message
            });
        }
    }

    // Revoke access for an app
    async revokeApp(req, res) {
        try {
            const { appId } = req.params;
            const userId = req.user._id;

            // Revoke all tokens for this app and user
            const result = await AccessToken.updateMany(
                { userId, appId, revoked: false },
                { $set: { revoked: true } }
            );

            res.json({
                success: true,
                message: 'App access revoked successfully',
                data: {
                    tokensRevoked: result.modifiedCount
                }
            });
        } catch (error) {
            console.error('Error revoking app:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to revoke app access',
                error: error.message
            });
        }
    }

    // Delete registered app (for developers)
    async deleteApp(req, res) {
        try {
            const { appId } = req.params;
            const userId = req.user._id;

            const app = await RegisteredApp.findOne({ appId, ownerId: userId });
            if (!app) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            // Soft delete - deactivate instead of removing
            app.isActive = false;
            await app.save();

            // Revoke all tokens for this app
            await AccessToken.updateMany(
                { appId, revoked: false },
                { $set: { revoked: true } }
            );

            res.json({
                success: true,
                message: 'Application deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting app:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete application',
                error: error.message
            });
        }
    }

    // Update app details
    async updateApp(req, res) {
        try {
            const { appId } = req.params;
            const userId = req.user._id;
            const { appName, redirectUris, description, website, logoUrl, scopes } = req.body;

            const app = await RegisteredApp.findOne({ appId, ownerId: userId });
            if (!app) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            // Update allowed fields
            if (appName) app.appName = appName;
            if (redirectUris) app.redirectUris = redirectUris;
            if (description !== undefined) app.description = description;
            if (website !== undefined) app.website = website;
            if (logoUrl !== undefined) app.logoUrl = logoUrl;
            if (scopes) app.scopes = scopes;

            await app.save();

            res.json({
                success: true,
                message: 'Application updated successfully',
                data: app.toSafeObject()
            });
        } catch (error) {
            console.error('Error updating app:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update application',
                error: error.message
            });
        }
    }

    // Regenerate app secret
    async regenerateSecret(req, res) {
        try {
            const { appId } = req.params;
            const userId = req.user._id;

            const app = await RegisteredApp.findOne({ appId, ownerId: userId });
            if (!app) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            // Generate new secret
            app.appSecret = crypto.randomBytes(32).toString('hex');
            await app.save();

            res.json({
                success: true,
                message: 'App secret regenerated successfully',
                data: {
                    appId: app.appId,
                    appSecret: app.appSecret
                }
            });
        } catch (error) {
            console.error('Error regenerating secret:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to regenerate app secret',
                error: error.message
            });
        }
    }
}

module.exports = new OAuthController();
