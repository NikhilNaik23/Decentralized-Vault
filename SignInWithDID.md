# Sign in with DID - Integration Guide

Complete guide to integrate "Sign in with DID" (OAuth 2.0) with the Decentralized Identity Vault in your application.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Environment Variables](#environment-variables)
7. [Getting Client ID & Secret](#getting-client-id--secret)
8. [API Endpoints](#api-endpoints)
9. [Testing the Integration](#testing-the-integration)
10. [Security Considerations](#security-considerations)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The "Sign in with DID" feature allows users to authenticate using their decentralized identities (DIDs) stored in the Identity Vault. This uses the OAuth 2.0 Authorization Code flow with PKCE for secure authentication.

### Benefits:
- ✅ **No password management** - Users authenticate with DIDs
- ✅ **Privacy-first** - Decentralized identity control
- ✅ **User consent** - Explicit permission for data sharing
- ✅ **Flexible** - Can be used alongside traditional auth
- ✅ **Revocable** - Users can revoke app access anytime

---

## Prerequisites

Before integrating, ensure you have:

1. **Identity Vault** running:
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:5173`

2. **Your Application** with:
   - Backend API server
   - Frontend client
   - Database (MongoDB, PostgreSQL, etc.)

3. **Node.js** & **npm** installed

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Your App      │         │  Identity Vault  │         │   Your User     │
│   Frontend      │◄────────┤    Frontend      │◄────────┤   (Browser)     │
└────────┬────────┘         └──────────────────┘         └─────────────────┘
         │                                                         │
         │ 1. Initiate OAuth                                      │
         ▼                                                         │
┌─────────────────┐                                               │
│   Your App      │                                               │
│   Backend       │                                               │
└────────┬────────┘                                               │
         │                                                         │
         │ 2. Generate Auth URL                                   │
         │ 3. Redirect to Identity Vault ───────────────────────►│
         │                                                         │
         │ 4. User authorizes ◄───────────────────────────────────┤
         │                                                         │
         │ 5. Callback with code                                  │
         ◄─────────────────────────────────────────────────────────┘
         │
         │ 6. Exchange code for token
         ▼
┌──────────────────┐
│  Identity Vault  │
│    Backend       │
└────────┬─────────┘
         │
         │ 7. Return access token
         ▼
┌─────────────────┐
│   Your App      │
│   Backend       │
└────────┬────────┘
         │
         │ 8. Fetch user info
         │ 9. Create/update user
         │ 10. Generate session token
         ▼
┌─────────────────┐
│   Your App      │
│   Frontend      │
└─────────────────┘
```

---

## Backend Setup

### File Structure

```
your-app-backend/
├── src/
│   ├── config/
│   │   ├── env.js                 # Environment configuration
│   │   └── oauth.config.js        # OAuth configuration
│   ├── controllers/
│   │   └── oauth.controller.js    # OAuth logic
│   ├── routes/
│   │   └── oauth.routes.js        # OAuth endpoints
│   ├── models/
│   │   └── user.model.js          # User database model
│   └── middleware/
│       └── auth.middleware.js     # JWT authentication
├── .env                            # Environment variables
└── package.json
```

### 1. Install Dependencies

```bash
npm install axios jsonwebtoken crypto dotenv
```

### 2. Environment Configuration (`src/config/env.js`)

```javascript
import dotenv from 'dotenv';
dotenv.config();

export const envs = () => ({
  PORT: process.env.PORT || 8000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/yourapp',
  
  // OAuth Configuration
  OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
  OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI || 'http://localhost:8000/api/oauth/callback',
  
  // Identity Vault URLs
  IDENTITY_VAULT_BACKEND_URL: process.env.IDENTITY_VAULT_BACKEND_URL || 'http://localhost:5000',
  IDENTITY_VAULT_FRONTEND_URL: process.env.IDENTITY_VAULT_FRONTEND_URL || 'http://localhost:5173',
  
  // Your app frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
});
```

### 3. OAuth Configuration (`src/config/oauth.config.js`)

```javascript
import { envs } from './env.js';

export const oauthConfig = {
  identityVault: {
    // Backend API endpoints
    backendUrl: envs().IDENTITY_VAULT_BACKEND_URL,
    endpoints: {
      authorize: '/oauth/authorize',  // Not used directly
      token: '/api/oauth/token',
      userinfo: '/api/oauth/userinfo',
    },
    
    // Frontend authorization page
    frontendUrl: envs().IDENTITY_VAULT_FRONTEND_URL,
    authorizePath: '/oauth/authorize',
    
    // Your app's OAuth credentials
    clientId: envs().OAUTH_CLIENT_ID,
    clientSecret: envs().OAUTH_CLIENT_SECRET,
    redirectUri: envs().OAUTH_REDIRECT_URI,
    scope: 'basic_profile',
  },
  
  // Session configuration
  session: {
    stateExpiry: 30 * 60 * 1000, // 30 minutes (increased from 5 for better UX)
  },
};

/**
 * Generate authorization URL for Identity Vault
 */
export const getAuthorizationUrl = (state) => {
  const { identityVault } = oauthConfig;
  
  const params = new URLSearchParams({
    client_id: identityVault.clientId,
    redirect_uri: identityVault.redirectUri,
    response_type: 'code',
    scope: identityVault.scope,
    state,
  });
  
  return `${identityVault.frontendUrl}${identityVault.authorizePath}?${params.toString()}`;
};
```

### 4. OAuth Controller (`src/controllers/oauth.controller.js`)

```javascript
import axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { oauthConfig, getAuthorizationUrl } from "../config/oauth.config.js";
import { envs } from "../config/env.js";

// In-memory store for OAuth states (fallback only)
const stateStore = new Map();

// Secret for signing state tokens
const STATE_SECRET = envs().JWT_SECRET;

/**
 * Create a signed state token (stateless approach - survives server restarts)
 */
function createStateToken(data) {
  return jwt.sign(data, STATE_SECRET, { expiresIn: '30m' });
}

/**
 * Verify and decode state token
 */
function verifyStateToken(token) {
  try {
    return jwt.verify(token, STATE_SECRET);
  } catch (error) {
    console.error('State token verification failed:', error.message);
    return null;
  }
}

/**
 * Initiate OAuth login flow
 * GET /api/oauth/login
 */
export const initiateOAuthLogin = async (req, res) => {
  try {
    const isLinking = req.query.link === 'true'; // Account linking flag
    
    // Create state data
    const stateData = {
      nonce: crypto.randomBytes(16).toString("hex"), // Random nonce for security
      timestamp: Date.now(),
      redirectTo: req.query.redirect || "/",
      isLinking,
    };
    
    // Create signed JWT token as state (stateless - survives server restarts)
    const state = createStateToken(stateData);
    
    console.log('🚀 Initiating OAuth login. Linking:', isLinking);
    console.log('🔐 State token created (signed JWT)');
    
    // Also store in memory as fallback
    stateStore.set(state, stateData);
    
    // Clean up expired states
    cleanupExpiredStates();
    
    // Generate authorization URL
    const authUrl = getAuthorizationUrl(state);
    
    res.json({
      success: true,
      authUrl,
      message: "Redirect user to this URL for DID authentication",
    });
  } catch (error) {
    console.error("OAuth initiation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate OAuth flow",
    });
  }
};

/**
 * Handle OAuth callback from Identity Vault
 * GET /api/oauth/callback
 */
export const handleOAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    console.log('📥 OAuth Callback received');
    console.log('  Code:', code ? 'present' : 'missing');
    console.log('  State:', state ? state.substring(0, 30) + '...' : 'missing');
    
    if (!state) {
      console.error('❌ No state provided');
      return res.status(400).json({
        success: false,
        message: "State parameter is required. Please try signing in again.",
      });
    }
    
    // First, try to verify state as JWT (stateless approach - survives server restarts)
    let stateData = verifyStateToken(state);
    
    // If JWT verification fails, try memory store as fallback
    if (!stateData && stateStore.has(state)) {
      console.log('📦 State found in memory store (fallback)');
      stateData = stateStore.get(state);
      stateStore.delete(state); // One-time use
    }
    
    // If state is invalid
    if (!stateData) {
      console.error('❌ State validation failed');
      console.error('  This could mean:');
      console.error('    - Server restarted (memory cleared)');
      console.error('    - State expired (>30 minutes)');
      console.error('    - Invalid/tampered state token');
      
      // Redirect to frontend with error for better UX
      const frontendUrl = envs().FRONTEND_URL;
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Session expired. Please try signing in again.')}`);
    }
    
    const isLinking = stateData.isLinking || false;
    
    console.log('✅ State validated successfully');
    console.log('  Linking mode:', isLinking);
    console.log('  Redirect to:', stateData.redirectTo);
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code not provided",
      });
    }
    
    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.success) {
      return res.status(400).json({
        success: false,
        message: tokenResponse.message || "Failed to exchange code for token",
      });
    }
    
    const { access_token, did } = tokenResponse.data;
    
    // Fetch user info from Identity Vault
    const userInfoResponse = await fetchUserInfo(access_token);
    
    if (!userInfoResponse.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch user information",
      });
    }
    
    const userInfo = userInfoResponse.data;
    
    // Handle account linking flow
    if (isLinking) {
      console.log('🔗 Account linking flow - returning data for frontend');
      
      const redirectUrl = stateData.redirectTo || '/dashboard';
      const linkData = encodeURIComponent(JSON.stringify({
        access_token,
        did: userInfo.did,
        username: userInfo.username
      }));
      
      const frontendUrl = envs().FRONTEND_URL;
      return res.redirect(`${frontendUrl}/oauth/callback?link=true&data=${linkData}&redirect=${encodeURIComponent(redirectUrl)}`);
    }
    
    // Regular sign-in flow: Find or create user
    let user = await User.findOne({ did: userInfo.did });
    
    if (!user) {
      // Create new user with DID
      user = await User.create({
        name: userInfo.username || `User_${userInfo.did.slice(-8)}`,
        did: userInfo.did,
        didMethod: userInfo.did_method,
        authMethod: "did",
      });
    }
    
    // Generate JWT token for your app session
    const token = jwt.sign(
      { userId: user._id, did: user.did },
      envs().JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    console.log('✅ Authentication successful!');
    
    // Prepare user data
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email || null,
      did: user.did,
      authMethod: user.authMethod,
    };
    
    // Redirect to frontend with token and user data
    const redirectUrl = stateData.redirectTo || '/dashboard';
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    const frontendUrl = envs().FRONTEND_URL;
    
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}&user=${userDataEncoded}&redirect=${encodeURIComponent(redirectUrl)}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

/**
 * Link DID to existing account
 * POST /api/oauth/link-did
 * Requires authentication
 */
export const linkDIDToAccount = async (req, res) => {
  try {
    const { accessToken } = req.body; // Access token from Identity Vault
    const userId = req.user.userId; // From auth middleware
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }
    
    // Fetch DID info from Identity Vault
    const userInfoResponse = await fetchUserInfo(accessToken);
    
    if (!userInfoResponse.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to verify DID",
      });
    }
    
    const { did, did_method } = userInfoResponse.data;
    
    // Check if DID is already linked to another account
    const existingDIDUser = await User.findOne({ did });
    if (existingDIDUser && existingDIDUser._id.toString() !== userId) {
      return res.status(409).json({
        success: false,
        message: "This DID is already linked to another account",
      });
    }
    
    // Update user with DID
    const user = await User.findByIdAndUpdate(
      userId,
      {
        did,
        didMethod: did_method,
        authMethod: "hybrid", // Supports both email and DID
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: "DID linked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        did: user.did,
        authMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error("DID linking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to link DID",
    });
  }
};

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code) {
  try {
    const { identityVault } = oauthConfig;
    const tokenUrl = `${identityVault.backendUrl}${identityVault.endpoints.token}`;
    
    const response = await axios.post(tokenUrl, {
      grant_type: "authorization_code",
      code,
      client_id: identityVault.clientId,
      client_secret: identityVault.clientSecret,
      redirect_uri: identityVault.redirectUri,
    }, {
      headers: { "Content-Type": "application/json" },
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Token exchange error:", error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || "Token exchange failed",
    };
  }
}

/**
 * Fetch user information from Identity Vault
 */
async function fetchUserInfo(accessToken) {
  try {
    const { identityVault } = oauthConfig;
    const userInfoUrl = `${identityVault.backendUrl}${identityVault.endpoints.userinfo}`;
    
    const response = await axios.get(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error("User info fetch error:", error.response?.data);
    return {
      success: false,
      message: "Failed to fetch user information",
    };
  }
}

/**
 * Clean up expired OAuth states
 */
function cleanupExpiredStates() {
  const now = Date.now();
  const expiry = oauthConfig.session.stateExpiry;
  
  for (const [state, data] of stateStore.entries()) {
    if (now - data.timestamp > expiry) {
      stateStore.delete(state);
    }
  }
}

export default {
  initiateOAuthLogin,
  handleOAuthCallback,
  linkDIDToAccount,
};
```

### 5. OAuth Routes (`src/routes/oauth.routes.js`)

```javascript
import express from "express";
import {
  initiateOAuthLogin,
  handleOAuthCallback,
  linkDIDToAccount,
} from "../controllers/oauth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/oauth/login
 * @desc    Initiate OAuth login flow
 * @access  Public
 */
router.get("/login", initiateOAuthLogin);

/**
 * @route   GET /api/oauth/callback
 * @desc    Handle OAuth callback from Identity Vault
 * @access  Public
 */
router.get("/callback", handleOAuthCallback);

/**
 * @route   POST /api/oauth/link-did
 * @desc    Link DID to existing account
 * @access  Private (requires authentication)
 */
router.post("/link-did", authenticate, linkDIDToAccount);

export default router;
```

### 6. User Model (`src/models/user.model.js`)

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    sparse: true, // Allow null for DID-only accounts
    unique: true,
  },
  password: {
    type: String,
    // Not required for DID-only accounts
  },
  did: {
    type: String,
    sparse: true, // Allow null for email-only accounts
    unique: true,
  },
  didMethod: {
    type: String,
    enum: ['vault', 'key', 'web', null],
  },
  authMethod: {
    type: String,
    enum: ['traditional', 'did', 'hybrid'],
    default: 'traditional',
  },
}, {
  timestamps: true,
});

export default mongoose.model("User", userSchema);
```

### 7. Auth Middleware (`src/middleware/auth.middleware.js`)

```javascript
import jwt from "jsonwebtoken";
import { envs } from "../config/env.js";

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    
    const decoded = jwt.verify(token, envs().JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
```

### 8. Register Routes in Main Server File

```javascript
// server.js or app.js
import express from 'express';
import cors from 'cors';
import oauthRoutes from './routes/oauth.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Register OAuth routes
app.use('/api/oauth', oauthRoutes);

// ... other routes

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
```

---

## Frontend Setup

### File Structure

```
your-app-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx              # Login page with "Sign in with DID" button
│   │   ├── OAuthCallback.jsx      # OAuth callback handler
│   │   └── Dashboard.jsx          # Dashboard with "Link DID" option
│   ├── services/
│   │   └── api.js                 # API service functions
│   └── context/
│       └── AuthContext.jsx        # Authentication context
└── package.json
```

### 1. API Service (`src/services/api.js`)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Initiate OAuth login with DID
 */
export const initiateOAuthLogin = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/oauth/login`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to initiate OAuth',
    };
  }
};

/**
 * Link DID to existing account
 */
export const linkDIDToAccount = async (accessToken) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/api/oauth/link-did`,
      { accessToken },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.success) {
      // Update stored user
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to link DID',
    };
  }
};
```

### 2. Login Page (`src/pages/Login.jsx`)

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiateOAuthLogin } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignInWithDID = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await initiateOAuthLogin();
      
      if (result.success && result.authUrl) {
        // Redirect to Identity Vault
        window.location.href = result.authUrl;
      } else {
        setError(result.message || 'Failed to initiate DID sign-in');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Welcome to Your App</h1>
      
      {/* Traditional Login Form */}
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>
      
      <div className="divider">OR</div>
      
      {/* Sign in with DID Button */}
      <button
        onClick={handleSignInWithDID}
        disabled={loading}
        className="did-sign-in-button"
      >
        {loading ? 'Loading...' : '🔐 Sign in with DID'}
      </button>
      
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Login;
```

### 3. OAuth Callback Handler (`src/pages/OAuthCallback.jsx`)

```jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { linkDIDToAccount } from '../services/api';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Authenticating...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processCallback = async () => {
      // Check if this is account linking flow
      const isLinking = searchParams.get('link') === 'true';
      const linkData = searchParams.get('data');
      
      // Handle account linking
      if (isLinking && linkData) {
        setMessage('Linking DID to your account...');
        
        try {
          const { access_token, did, username } = JSON.parse(decodeURIComponent(linkData));
          
          const currentToken = localStorage.getItem('token');
          if (!currentToken) {
            setStatus('error');
            setMessage('You must be logged in to link a DID');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          const result = await linkDIDToAccount(access_token);
          
          if (result.success) {
            setStatus('success');
            setMessage('DID linked successfully!');
            setTimeout(() => navigate('/dashboard'), 2000);
          } else {
            setStatus('error');
            setMessage(result.message || 'Failed to link DID');
            setTimeout(() => navigate('/dashboard'), 3000);
          }
          return;
        } catch (error) {
          console.error('Linking error:', error);
          setStatus('error');
          setMessage('An error occurred while linking DID');
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }
      }
      
      // Regular sign-in flow
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const redirectPath = searchParams.get('redirect');
      
      if (token) {
        setStatus('success');
        setMessage('Authentication successful!');
        
        // Store token
        localStorage.setItem('token', token);
        
        // Parse and store user data
        if (userParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userParam));
            localStorage.setItem('user', JSON.stringify(userData));
            login(userData);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
        
        setTimeout(() => {
          const targetPath = redirectPath || '/dashboard';
          navigate(targetPath, { replace: true });
        }, 1000);
        return;
      }
      
      // No token received
      setStatus('error');
      setMessage('Authentication failed');
      setTimeout(() => navigate('/login'), 3000);
    };

    processCallback();
  }, []);

  return (
    <div className="oauth-callback">
      {status === 'processing' && (
        <div>
          <div className="spinner" />
          <h2>Processing Authentication</h2>
          <p>{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="success-icon">✓</div>
          <h2>Success!</h2>
          <p>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="error-icon">✕</div>
          <h2>Authentication Failed</h2>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default OAuthCallback;
```

### 4. Dashboard with Link DID Option (`src/pages/Dashboard.jsx`)

```jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');

  const handleLinkDID = async () => {
    setError('');
    setLinking(true);

    try {
      // Call initiateOAuthLogin with link=true parameter
      const response = await fetch('http://localhost:8000/api/oauth/login?link=true');
      const result = await response.json();
      
      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        setError(result.message || 'Failed to initiate DID linking');
        setLinking(false);
      }
    } catch {
      setError('An error occurred');
      setLinking(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name}!</h1>
      
      <div className="profile-info">
        <h2>Profile Information</h2>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Auth Method:</strong> {user?.authMethod}</p>
        {user?.did && (
          <p><strong>DID:</strong> {user.did}</p>
        )}
      </div>
      
      {/* Show Link DID button if user doesn't have DID yet */}
      {user?.authMethod === 'traditional' && (
        <div className="link-did-section">
          <h3>Link Decentralized Identity</h3>
          <p>Add DID-based authentication to your account</p>
          <button
            onClick={handleLinkDID}
            disabled={linking}
          >
            {linking ? 'Processing...' : '🔗 Link DID'}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

### 5. Add OAuth Callback Route

```jsx
// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## Environment Variables

### Backend `.env` File

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database
MONGODB_URI=mongodb://localhost:27017/yourapp

# Identity Vault URLs
IDENTITY_VAULT_BACKEND_URL=http://localhost:5000
IDENTITY_VAULT_FRONTEND_URL=http://localhost:5173

# OAuth Configuration (Get these from Identity Vault)
OAUTH_CLIENT_ID=your_client_id_here
OAUTH_CLIENT_SECRET=your_client_secret_here
OAUTH_REDIRECT_URI=http://localhost:8000/api/oauth/callback

# Your Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env` File

```env
# API URL
VITE_API_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
```

---

## Getting Client ID & Secret

To use "Sign in with DID", you **must register your application** with the Identity Vault to receive OAuth credentials (Client ID and Client Secret).

### Prerequisites for Registration

Before registering, you need:
1. ✅ Identity Vault backend and frontend running
2. ✅ Your application's name and description
3. ✅ Your application's URL (e.g., `http://localhost:3000`)
4. ✅ Your OAuth callback URL (e.g., `http://localhost:8000/api/oauth/callback`)

---

### Step 1: Register Your App in Identity Vault

There are **three ways** to register your application:

#### Option A: Use Identity Vault Admin UI (Easiest - Recommended)

**Note:** If the Identity Vault doesn't have an admin UI yet, you'll need to create one or use Option B/C.

1. **Login to Identity Vault** as an admin user
2. **Navigate to** Settings → Connected Apps → Register New App
3. **Fill in the form:**
   - App Name: `Your App Name`
   - Description: `Brief description of your app`
   - App URL: `http://localhost:3000` (your frontend)
   - Redirect URI: `http://localhost:8000/api/oauth/callback` (your backend OAuth callback)
4. **Click "Register App"**
5. **Copy the credentials** that appear:
   - **Client ID** (e.g., `app_75bbc38a1d42f19ec39e031ecffedc81`)
   - **Client Secret** (e.g., `secret_a1b2c3d4e5f6...`)
   
   ⚠️ **Important:** Save these immediately! The client secret won't be shown again.

#### Option B: Manual Database Registration (Development/Testing)

If you have direct database access, you can register your app manually:

Connect to the Identity Vault's MongoDB database and insert a registered app document:

```javascript
// Connect to MongoDB
use identity_vault;

// Insert your app registration
db.registeredapps.insertOne({
  appId: "app_" + Date.now() + Math.random().toString(36).substring(2),
  appName: "Your App Name",
  description: "Your app description",
  appUrl: "http://localhost:3000",
  redirectUris: ["http://localhost:8000/api/oauth/callback"],
  clientSecret: "your_generated_secret_" + Math.random().toString(36).substring(2),
  createdBy: "admin",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// View your registered app
db.registeredapps.find().pretty();
```

**After insertion:**
```javascript
// View your registered app
db.registeredapps.find().pretty();

// Copy these values:
// appId → This is your OAUTH_CLIENT_ID
// clientSecret → This is your OAUTH_CLIENT_SECRET
```

**Example Output:**
```json
{
  "_id": ObjectId("..."),
  "appId": "app_75bbc38a1d42f19ec39e031ecffedc81",
  "clientSecret": "secret_a1b2c3d4e5f6g7h8i9j0",
  "appName": "Your App Name",
  "redirectUris": ["http://localhost:8000/api/oauth/callback"],
  "active": true
}
```

#### Option C: API Registration (Programmatic)

If the Identity Vault has an app registration API endpoint:

**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/register-app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "appName": "Your App Name",
    "description": "Your app description",
    "appUrl": "http://localhost:3000",
    "redirectUris": ["http://localhost:8000/api/oauth/callback"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Application registered successfully",
  "app": {
    "appId": "app_abc123...",
    "clientSecret": "secret_xyz789...",
    "appName": "Your App Name",
    "redirectUris": ["http://localhost:8000/api/oauth/callback"]
  }
}
```

**Save these credentials immediately!**

---

### Important Notes About App Registration

⚠️ **Security:**
- Client Secret is like a password - keep it secret!
- Never commit client secrets to Git
- Store in environment variables only
- Rotate secrets periodically in production

⚠️ **Redirect URIs:**
- Must match **exactly** (including protocol, port, path)
- `http://localhost:8000/api/oauth/callback` ≠ `http://localhost:8000/api/oauth/callback/`
- You can register multiple redirect URIs for different environments

⚠️ **Multiple Environments:**
```javascript
// Register separate apps for each environment
// Development
appId: "app_dev_123..."
redirectUris: ["http://localhost:8000/api/oauth/callback"]

// Staging
appId: "app_staging_456..."
redirectUris: ["https://staging-api.yourapp.com/api/oauth/callback"]

// Production
appId: "app_prod_789..."
redirectUris: ["https://api.yourapp.com/api/oauth/callback"]
```

---

### Step 2: Update Your .env File

After receiving your credentials, add them to your backend `.env` file:

```env
# OAuth Configuration
OAUTH_CLIENT_ID=app_75bbc38a1d42f19ec39e031ecffedc81
OAUTH_CLIENT_SECRET=secret_a1b2c3d4e5f6g7h8i9j0
OAUTH_REDIRECT_URI=http://localhost:8000/api/oauth/callback

# Identity Vault URLs
IDENTITY_VAULT_BACKEND_URL=http://localhost:5000
IDENTITY_VAULT_FRONTEND_URL=http://localhost:5173

# Your Frontend URL
FRONTEND_URL=http://localhost:3000
```

⚠️ **Never commit the `.env` file to version control!**

Add to your `.gitignore`:
```
.env
.env.local
.env.production
```

---

### Step 3: Restart Your Backend

After updating `.env`, restart your backend server to load the new credentials:

```bash
# Stop the server (Ctrl+C)
# Start again
npm start
```

---

### Step 4: Verify Registration

Test your OAuth flow:

```bash
# Test initiate OAuth
curl http://localhost:8000/api/oauth/login

# Should return
{
  "success": true,
  "authUrl": "http://localhost:5173/oauth/authorize?client_id=app_abc123...&..."
}
```

---

### How to Create App Registration in Identity Vault (For Identity Vault Admins)

If the Identity Vault doesn't have an app registration feature yet, here's how to add it:

#### Backend: Create Registration Endpoint

**File: `decentralized-identity-vault-backend/src/controllers/adminController.js`**

```javascript
import RegisteredApp from '../models/RegisteredApp.js';
import crypto from 'crypto';

/**
 * Register a new OAuth application
 * POST /api/admin/register-app
 */
export const registerApp = async (req, res) => {
  try {
    const { appName, description, appUrl, redirectUris } = req.body;
    
    // Validate required fields
    if (!appName || !redirectUris || redirectUris.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'App name and at least one redirect URI are required',
      });
    }
    
    // Generate unique app ID and secret
    const appId = `app_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = `secret_${crypto.randomBytes(32).toString('hex')}`;
    
    // Create registered app
    const registeredApp = await RegisteredApp.create({
      appId,
      clientSecret,
      appName,
      description,
      appUrl,
      redirectUris,
      createdBy: req.user?.userId || 'admin', // From auth middleware
      active: true,
    });
    
    res.status(201).json({
      success: true,
      message: 'Application registered successfully',
      app: {
        appId: registeredApp.appId,
        clientSecret: registeredApp.clientSecret, // Only shown once!
        appName: registeredApp.appName,
        description: registeredApp.description,
        redirectUris: registeredApp.redirectUris,
      },
      warning: 'Save the client secret now! It will not be shown again.',
    });
  } catch (error) {
    console.error('App registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register application',
    });
  }
};

/**
 * Get all registered apps (without secrets)
 * GET /api/admin/apps
 */
export const getRegisteredApps = async (req, res) => {
  try {
    const apps = await RegisteredApp.find()
      .select('-clientSecret') // Don't return secrets
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      apps,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch apps',
    });
  }
};
```

**File: `decentralized-identity-vault-backend/src/routes/adminRoutes.js`**

```javascript
import express from 'express';
import { registerApp, getRegisteredApps } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication and admin role
router.post('/register-app', authenticate, requireAdmin, registerApp);
router.get('/apps', authenticate, requireAdmin, getRegisteredApps);

export default router;
```

**Register in main server file:**

```javascript
// server.js
import adminRoutes from './routes/adminRoutes.js';

app.use('/api/admin', adminRoutes);
```

#### Frontend: Create Registration UI (Optional)

**File: `decentralized-identity-vault-frontend/src/pages/Admin/RegisterApp.jsx`**

```jsx
import React, { useState } from 'react';

const RegisterApp = () => {
  const [formData, setFormData] = useState({
    appName: '',
    description: '',
    appUrl: '',
    redirectUris: [''],
  });
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/register-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCredentials(data.app);
        // Reset form
        setFormData({
          appName: '',
          description: '',
          appUrl: '',
          redirectUris: [''],
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to register app');
    } finally {
      setLoading(false);
    }
  };

  const addRedirectUri = () => {
    setFormData({
      ...formData,
      redirectUris: [...formData.redirectUris, ''],
    });
  };

  return (
    <div className="register-app-page">
      <h1>Register OAuth Application</h1>
      
      {/* Show credentials after successful registration */}
      {credentials && (
        <div className="credentials-display" style={{ background: '#fff3cd', padding: '20px', marginBottom: '20px' }}>
          <h2>⚠️ Save These Credentials Now!</h2>
          <p>The client secret will not be shown again.</p>
          
          <div style={{ background: '#fff', padding: '15px', marginTop: '10px' }}>
            <p><strong>App Name:</strong> {credentials.appName}</p>
            <p><strong>Client ID:</strong> <code>{credentials.appId}</code></p>
            <p><strong>Client Secret:</strong> <code>{credentials.clientSecret}</code></p>
            <p><strong>Redirect URIs:</strong></p>
            <ul>
              {credentials.redirectUris.map((uri, i) => (
                <li key={i}><code>{uri}</code></li>
              ))}
            </ul>
          </div>
          
          <button onClick={() => setCredentials(null)}>Register Another App</button>
        </div>
      )}
      
      {/* Registration Form */}
      {!credentials && (
        <form onSubmit={handleSubmit}>
          <div>
            <label>App Name *</label>
            <input
              type="text"
              value={formData.appName}
              onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
              required
              placeholder="My Awesome App"
            />
          </div>
          
          <div>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your application"
            />
          </div>
          
          <div>
            <label>App URL</label>
            <input
              type="url"
              value={formData.appUrl}
              onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })}
              placeholder="http://localhost:3000"
            />
          </div>
          
          <div>
            <label>Redirect URIs *</label>
            {formData.redirectUris.map((uri, index) => (
              <input
                key={index}
                type="url"
                value={uri}
                onChange={(e) => {
                  const newUris = [...formData.redirectUris];
                  newUris[index] = e.target.value;
                  setFormData({ ...formData, redirectUris: newUris });
                }}
                placeholder="http://localhost:8000/api/oauth/callback"
                required
              />
            ))}
            <button type="button" onClick={addRedirectUri}>+ Add Another URI</button>
          </div>
          
          {error && <p className="error">{error}</p>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register Application'}
          </button>
        </form>
      )}
    </div>
  );
};

export default RegisterApp;
```

---

## API Endpoints

### Backend Endpoints (Your App)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/oauth/login` | Initiate OAuth flow | No |
| GET | `/api/oauth/callback` | Handle OAuth callback | No |
| POST | `/api/oauth/link-did` | Link DID to account | Yes |

### Identity Vault Endpoints (Used by Your Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/oauth/token` | Exchange code for token |
| GET | `/api/oauth/userinfo` | Get user information |

### Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login.jsx | Login page with "Sign in with DID" |
| `/oauth/callback` | OAuthCallback.jsx | Handle OAuth redirect |
| `/dashboard` | Dashboard.jsx | User dashboard with "Link DID" |

---

## Testing the Integration

### 1. Start All Services

```bash
# Terminal 1: Identity Vault Backend
cd decentralized-identity-vault-backend
npm start
# Should run on http://localhost:5000

# Terminal 2: Identity Vault Frontend
cd decentralized-identity-vault-frontend
npm run dev
# Should run on http://localhost:5173

# Terminal 3: Your App Backend
cd your-app-backend
npm start
# Should run on http://localhost:8000

# Terminal 4: Your App Frontend
cd your-app-frontend
npm run dev
# Should run on http://localhost:3000
```

### 2. Test OAuth Flow

**Test 1: Sign in with DID (New User)**

1. Go to `http://localhost:3000/login`
2. Click "Sign in with DID"
3. Should redirect to Identity Vault (`http://localhost:5173/oauth/authorize`)
4. Login to Identity Vault (if not already logged in)
5. Click "Authorize"
6. Should redirect back to your app
7. Should be logged in with a new account

**Test 2: Sign in with DID (Existing DID User)**

1. Logout
2. Click "Sign in with DID" again
3. Should auto-authorize (skip consent screen)
4. Should log into the same account

**Test 3: Link DID to Email Account**

1. Register with email/password
2. Go to Dashboard
3. Click "Link DID"
4. Authorize with a DID
5. Should link successfully
6. Account now supports both login methods

**Test 4: Prevent Duplicate Linking**

1. Create two accounts: Email Account A, DID Account B
2. Login to Account A (email)
3. Try to link DID B (already used by Account B)
4. Should show error: "This DID is already linked to another account"
5. Should stay logged into Account A

### 3. Verify Database

```javascript
// Check users collection
db.users.find().pretty();

// Should see users with:
// - authMethod: "did" (DID-only users)
// - authMethod: "traditional" (Email-only users)
// - authMethod: "hybrid" (Both email and DID)
```

---

## Security Considerations

### 1. State Parameter

✅ **Implemented**: Random 32-byte hex string
- Prevents CSRF attacks
- One-time use (deleted after validation)
- 5-minute expiry

### 2. Client Secret Protection

⚠️ **Important**:
- Never expose client secret in frontend code
- Store in backend environment variables only
- Use secure methods to generate secrets

### 3. Token Storage

✅ **Best Practices**:
- Store JWT in `localStorage` or `httpOnly` cookies
- Set appropriate token expiry (7 days recommended)
- Implement refresh token mechanism for production

### 4. HTTPS in Production

⚠️ **Required**:
```env
# Production environment
IDENTITY_VAULT_BACKEND_URL=https://vault.yourdomain.com
IDENTITY_VAULT_FRONTEND_URL=https://vault-app.yourdomain.com
OAUTH_REDIRECT_URI=https://yourapp.com/api/oauth/callback
FRONTEND_URL=https://yourapp.com
```

### 5. CORS Configuration

```javascript
// Backend CORS setup
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourapp.com',
    'https://vault-app.yourdomain.com'
  ],
  credentials: true,
}));
```

### 6. Rate Limiting

```javascript
// Add rate limiting to OAuth endpoints
import rateLimit from 'express-rate-limit';

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many OAuth requests, please try again later',
});

router.get('/login', oauthLimiter, initiateOAuthLogin);
```

---

## Troubleshooting

### Issue 1: "Invalid client_id"

**Cause**: Client ID not registered or incorrect

**Solution**:
```bash
# Verify app registration in Identity Vault database
db.registeredapps.find({ appId: "your_client_id" }).pretty();

# Check .env file
echo $OAUTH_CLIENT_ID
```

### Issue 2: "Invalid redirect_uri"

**Cause**: Redirect URI doesn't match registered value

**Solution**:
```javascript
// Make sure redirect URIs match exactly
// Database: "http://localhost:8000/api/oauth/callback"
// .env: OAUTH_REDIRECT_URI=http://localhost:8000/api/oauth/callback
// No trailing slash, exact protocol and port
```

### Issue 3: "State validation failed"

**Cause**: State expired or duplicate callback

**Solution**:
- States expire after 5 minutes - authorize faster
- Browser making duplicate requests - this is handled gracefully
- Clear browser cache and try again

### Issue 4: Token not stored in frontend

**Cause**: OAuth callback not receiving token parameter

**Solution**:
```javascript
// Check backend logs
console.log('🔗 Redirecting to:', fullRedirectUrl);

// Check browser console
console.log('Token received:', searchParams.get('token'));

// Verify URL format:
// http://localhost:3000/oauth/callback?token=eyJ...&user=%7B%22id%22...
```

### Issue 5: CORS errors

**Cause**: Backend not allowing frontend origin

**Solution**:
```javascript
// Backend: Add CORS for frontend URL
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

### Issue 6: "This DID is already linked"

**Cause**: Trying to link a DID that's already used (This is correct behavior!)

**Solution**:
- This is expected when preventing account hijacking
- Use a different DID or unlink from the other account first
- Each DID can only be linked to one account

---

## Production Checklist

Before deploying to production:

- [ ] Use HTTPS for all URLs
- [ ] Generate secure client secrets (64+ characters)
- [ ] Store secrets in secure vault (AWS Secrets Manager, etc.)
- [ ] Enable rate limiting on OAuth endpoints
- [ ] Implement proper error logging (Sentry, etc.)
- [ ] Use Redis for state storage instead of in-memory Map
- [ ] Add refresh token mechanism
- [ ] Implement proper session management
- [ ] Add CSRF protection middleware
- [ ] Enable httpOnly cookies for tokens
- [ ] Add user consent management UI
- [ ] Implement token revocation
- [ ] Add audit logging for OAuth events
- [ ] Set up monitoring and alerts
- [ ] Test with various browsers and devices
- [ ] Review and update CORS policies
- [ ] Add proper error pages
- [ ] Implement graceful error recovery

---

## Additional Resources

### Documentation
- OAuth 2.0 Specification: https://oauth.net/2/
- JWT Best Practices: https://datatracker.ietf.org/doc/html/rfc8725
- DID Specification: https://www.w3.org/TR/did-core/

### Example Implementation
- Full working example: See TodoApp in this repository
  - Backend: `TodoApp/backend/src/controller/oauth.controller.js`
  - Frontend: `TodoApp/frontend/src/pages/OAuthCallback.jsx`

### Support
For issues or questions:
- Check GitHub Issues
- Review backend logs: `npm start` output
- Review browser console: F12 → Console
- Check network tab: F12 → Network → Filter "oauth"

---

## Summary

You now have a complete "Sign in with DID" integration! 🎉

**Key Features:**
- ✅ OAuth 2.0 Authorization Code flow
- ✅ CSRF protection with signed JWT state tokens (survives server restarts)
- ✅ Secure token exchange
- ✅ Account linking support
- ✅ Duplicate DID prevention
- ✅ Graceful error handling
- ✅ **Auto-approval for previously authorized apps** (skip consent on repeat sign-ins)
- ✅ **Stateless state management** (no memory issues on server restart)

**Next Steps:**
1. Register your app in Identity Vault
2. Copy the code snippets
3. Update environment variables
4. Test the integration
5. Deploy to production with HTTPS

Happy coding! 🚀

---

## Advanced Features

### Auto-Approval for Returning Users

The Identity Vault automatically remembers when a user has previously authorized your app. On subsequent sign-ins:

**First Time Sign-In:**
1. User clicks "Sign in with DID"
2. Redirected to Identity Vault
3. **Sees consent screen** with permissions
4. Clicks "Authorize"
5. Gets redirected back to your app

**Subsequent Sign-Ins (Same User + Same App):**
1. User clicks "Sign in with DID"
2. Redirected to Identity Vault
3. **Automatically approved** (no consent screen!)
4. Immediately redirected back to your app
5. ✨ Seamless sign-in experience!

**How It Works:**
- Identity Vault checks for existing valid access tokens
- If found, generates new auth code automatically
- Skips the consent screen entirely
- Reduces friction for returning users

**User Control:**
- Users can revoke app access anytime from "Connected Apps" page
- After revocation, consent screen appears again on next sign-in
- This is standard OAuth behavior (same as Google, GitHub, etc.)

**Force Consent Screen:**
To always show the consent screen, add `prompt=consent` to the authorization URL:

```javascript
// In oauth.config.js - getAuthorizationUrl function
export const getAuthorizationUrl = (state, forceConsent = false) => {
  const { identityVault } = oauthConfig;
  
  const params = new URLSearchParams({
    client_id: identityVault.clientId,
    redirect_uri: identityVault.redirectUri,
    response_type: 'code',
    scope: identityVault.scope,
    state,
  });
  
  // Force consent screen (useful for testing)
  if (forceConsent) {
    params.set('prompt', 'consent');
  }
  
  return `${identityVault.frontendUrl}${identityVault.authorizePath}?${params.toString()}`;
};
```

### Stateless State Management (Server Restart Safe)

**Problem:** Traditional OAuth implementations store state in memory (Map/Object), which gets cleared when the server restarts. This causes "Invalid state parameter" errors for users mid-authentication.

**Solution:** Use signed JWT tokens as the state parameter:

**Benefits:**
- ✅ Survives server restarts
- ✅ No database needed for state storage
- ✅ Stateless - works across load balancers
- ✅ 30-minute expiry (vs 5 minutes for memory-based)
- ✅ Tamper-proof (signed with JWT_SECRET)

**How It Works:**
```javascript
// State is a JWT containing:
{
  nonce: "abc123...",         // Random value
  timestamp: 1234567890,      // Creation time
  redirectTo: "/dashboard",   // Where to redirect after auth
  isLinking: false,           // Account linking flag
  exp: 1234569690            // Expiry (30 min)
}

// Signed with your JWT_SECRET
const state = jwt.sign(stateData, JWT_SECRET, { expiresIn: '30m' });
```

**Validation:**
```javascript
// Verify state token (works even after server restart)
const stateData = jwt.verify(state, JWT_SECRET);
// If valid, proceed with OAuth flow
```

**Fallback:**
The implementation also stores state in memory as a fallback. The system tries JWT first, then falls back to memory if needed.

### Managing Connected Apps

Users can view and revoke app access from the Identity Vault:

**Navigate to:** Identity Vault → Connected Apps

**Users can:**
- See all apps they've authorized
- View when they last used each app
- See how many active tokens each app has
- **Revoke access** to any app

**After Revoking:**
- All access tokens for that app are invalidated
- App can no longer access user data
- Next sign-in shows consent screen again

**Example UI:**
```
┌────────────────────────────────────────┐
│ Connected Apps                          │
├────────────────────────────────────────┤
│                                         │
│  📱 My Todo App                         │
│  A task management application          │
│  Last used: 5 minutes ago               │
│  Active tokens: 1                       │
│  [Revoke Access]                        │
│                                         │
├────────────────────────────────────────┤
│                                         │
│  📊 Analytics Dashboard                 │
│  Business analytics platform            │
│  Last used: 2 days ago                  │
│  Active tokens: 2                       │
│  [Revoke Access]                        │
│                                         │
└────────────────────────────────────────┘
```

### Production Considerations for Auto-Approval

**Security:**
- Auto-approval is secure when implemented correctly
- Token validation happens on every API request
- Users can revoke access anytime
- Access tokens expire (24 hours by default)

**User Experience:**
- Reduces friction for returning users
- Industry standard (Google, GitHub, Facebook all do this)
- Consent shown only when necessary

**When Consent Appears:**
- First time authorizing an app
- After user revokes app access
- When app requests new/different permissions
- When `prompt=consent` parameter is used

### Troubleshooting Auto-Approval

**Issue:** Consent screen appears every time

**Cause:** Access tokens being revoked or expired

**Check:**
```javascript
// In Identity Vault database
db.accesstokens.find({
  userId: ObjectId("user_id"),
  appId: "your_app_id",
  revoked: false,
  expiresAt: { $gt: new Date() }
});

// Should return at least one token
// If empty, consent screen will appear
```

**Issue:** State validation fails after server restart

**Solution:** Make sure you're using the JWT-based state (see code above)

```javascript
// Check if using JWT state
const stateData = verifyStateToken(state);
if (stateData) {
  console.log('✅ Using JWT state (restart-safe)');
} else {
  console.log('❌ JWT verification failed, falling back to memory');
}
```
