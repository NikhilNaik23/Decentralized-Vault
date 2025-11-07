# External App Demo - Sign in with DID

This is a demo external application that demonstrates OAuth 2.0 authentication using Decentralized Identifiers (DIDs) from the Identity Vault.

## Quick Start

### 1. Register Your App

First, you need to register this demo app with the Identity Vault:

1. **Login to Identity Vault**
   - Open http://localhost:3000 (or your frontend URL)
   - Login with your existing account

2. **Access Developer Console**
   - Navigate to Developer Console (will be added to frontend)
   - Or use the API directly:

```bash
# Login first to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Register the demo app
curl -X POST http://localhost:5000/api/oauth/apps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "appName": "External App Demo",
    "redirectUris": ["http://localhost:8080"],
    "description": "Demo application showing OAuth integration",
    "scopes": ["basic_profile"]
  }'
```

3. **Save Credentials**
   - Copy the `appId` (client_id)
   - Copy the `appSecret` (client_secret)
   - ⚠️ The secret is only shown once!

### 2. Configure the Demo

Open `index.html` and update the configuration:

```javascript
const CONFIG = {
    clientId: 'app_abc123...',          // Your appId from registration
    clientSecret: 'secret_xyz789...',   // Your appSecret from registration
    identityVaultUrl: 'http://localhost:5000',
    redirectUri: 'http://localhost:8080',
    scope: 'basic_profile'
};
```

### 3. Run the Demo

Serve the HTML file using any web server on port 8080:

**Option 1: Python**
```bash
python -m http.server 8080
```

**Option 2: Node.js (http-server)**
```bash
npx http-server -p 8080
```

**Option 3: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"
- Configure it to use port 8080

### 4. Test the Flow

1. Open http://localhost:8080 in your browser
2. Click "Sign in with DID"
3. You'll be redirected to the Identity Vault
4. Login if not already authenticated
5. Choose which DID to share
6. Approve the authorization
7. You'll be redirected back with your DID information

## What Happens Behind the Scenes

### Step 1: Authorization Request
```
User clicks "Sign in with DID"
  ↓
Redirect to: http://localhost:5000/api/oauth/authorize?
  client_id=app_abc123...
  &redirect_uri=http://localhost:8080
  &response_type=code
  &scope=basic_profile
  &state=random_csrf_token
```

### Step 2: User Authorization
```
Identity Vault shows consent screen:
  - App name: "External App Demo"
  - Requested permission: "Basic Profile"
  - DID selection dropdown
  
User clicks "Approve"
```

### Step 3: Authorization Code
```
Redirect back to: http://localhost:8080?
  code=abc123xyz789...
  &state=random_csrf_token
```

### Step 4: Token Exchange
```
POST http://localhost:5000/api/oauth/token
{
  "grant_type": "authorization_code",
  "code": "abc123xyz789...",
  "client_id": "app_abc123...",
  "client_secret": "secret_xyz789...",
  "redirect_uri": "http://localhost:8080"
}

Response:
{
  "access_token": "token_abc123...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scope": "basic_profile",
  "did": "did:key:z6Mk..."
}
```

### Step 5: Get User Info
```
GET http://localhost:5000/api/oauth/userinfo
Authorization: Bearer token_abc123...

Response:
{
  "sub": "did:key:z6Mk...",
  "did": "did:key:z6Mk...",
  "did_method": "key",
  "username": "john_doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Client Secret**: In a real application, the client secret should NEVER be in frontend code. It should be stored server-side only.

2. **HTTPS**: For production, always use HTTPS for all OAuth endpoints.

3. **State Parameter**: This demo uses the state parameter to prevent CSRF attacks. Never skip this!

4. **Token Storage**: Access tokens are stored in localStorage for demo purposes. In production, use:
   - httpOnly cookies
   - Secure session storage
   - Token encryption

5. **Redirect URI**: The redirect URI must exactly match what's registered. Even trailing slashes matter!

## Troubleshooting

### "Invalid client_id"
- Make sure you registered the app first
- Check that the `clientId` in CONFIG matches your registered app

### "Invalid redirect_uri"
- The redirect URI must exactly match: `http://localhost:8080`
- If using a different port, update both the registration and CONFIG

### "CORS Error"
- The Identity Vault backend must allow your origin in CORS settings
- Check backend `.env` file: `CORS_ORIGIN=http://localhost:3000,http://localhost:8080`

### "Authorization code expired"
- Authorization codes expire after 5 minutes
- Don't wait too long between steps

### Browser doesn't redirect back
- Check browser console for errors
- Verify the Identity Vault backend is running on port 5000
- Ensure you're logged into the Identity Vault

## Next Steps

1. **Add More Scopes**: Try requesting `email` or `credentials` scope
2. **Token Refresh**: Implement token refresh logic
3. **Revocation**: Test revoking access from the Identity Vault UI
4. **Multiple Apps**: Register multiple apps and see how they're isolated

## Integration in Real Apps

To integrate "Sign in with DID" into your real application:

1. **Backend Integration**: Move OAuth logic to your backend
2. **Session Management**: Use server-side sessions
3. **Database**: Store user associations (DID → your_user_id)
4. **Error Handling**: Implement proper error pages
5. **UI Polish**: Create branded login buttons

See the full OAuth Integration Guide: `../OAUTH_INTEGRATION_GUIDE.md`

## Code Structure

```
index.html
├── Configuration (lines 89-96)
│   └── Update clientId and clientSecret here
├── Login Flow (lines 124-140)
│   └── initiateLogin() - Redirect to authorization endpoint
├── Token Exchange (lines 142-175)
│   └── exchangeCodeForToken() - Exchange code for access token
├── User Info (lines 177-199)
│   └── fetchUserInfo() - Get user data with access token
└── Display (lines 201-230)
    └── displayUserInfo() - Show user information
```

## Support

For questions or issues:
- Check the main OAuth Integration Guide
- Review backend logs for error messages
- Test endpoints with curl/Postman first
- Open an issue on GitHub

---

**Remember**: This is a demo for learning purposes. Real production apps should follow OAuth security best practices!
