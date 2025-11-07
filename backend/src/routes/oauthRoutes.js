const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public endpoint - Register app without authentication
router.post('/apps/public-register', oauthController.publicRegisterApp);

// Developer endpoints - Manage registered apps
router.post('/apps', authMiddleware, oauthController.registerApp);
router.get('/apps', authMiddleware, oauthController.getUserApps);
router.get('/apps/:appId', oauthController.getAppDetails);
router.put('/apps/:appId', authMiddleware, oauthController.updateApp);
router.delete('/apps/:appId', authMiddleware, oauthController.deleteApp);
router.post('/apps/:appId/regenerate-secret', authMiddleware, oauthController.regenerateSecret);

// OAuth 2.0 Authorization Flow
router.get('/authorize', authMiddleware, oauthController.authorize);
router.post('/authorize', authMiddleware, oauthController.approveAuthorization);
router.post('/token', oauthController.token);
router.get('/userinfo', oauthController.userInfo);

// User endpoints - Manage authorized apps
router.get('/connected-apps', authMiddleware, oauthController.getAuthorizedApps);
router.post('/connected-apps/:appId/revoke', authMiddleware, oauthController.revokeApp);

module.exports = router;
