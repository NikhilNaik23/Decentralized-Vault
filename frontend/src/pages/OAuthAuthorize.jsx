import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

export default function OAuthAuthorize() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appInfo, setAppInfo] = useState(null);
  const [selectedDID, setSelectedDID] = useState('');
  const [dids, setDids] = useState([]);
  const [autoRedirecting, setAutoRedirecting] = useState(false);

  useEffect(() => {
    fetchAuthorizationInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAuthorizationInfo = async () => {
    console.log('🔵 OAuthAuthorize: fetchAuthorizationInfo called');
    console.log('🔵 Current URL:', window.location.href);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔵 OAuthAuthorize: Token found:', !!token);
      console.log('🔵 OAuthAuthorize: Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        const returnUrl = window.location.pathname + window.location.search;
        console.log('🔵 OAuthAuthorize: No token, redirecting to login with returnUrl:', returnUrl);
        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      console.log('🔵 OAuthAuthorize: Fetching authorization info from backend...');
      console.log('🔵 Request URL:', `http://localhost:5000/api/oauth/authorize?${searchParams.toString()}`);
      const response = await fetch(
        `http://localhost:5000/api/oauth/authorize?${searchParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      console.log('🔵 OAuthAuthorize: Response status:', response.status);
      console.log('🔵 OAuthAuthorize: Response data:', data);

      if (response.ok) {
        // Check if auto-approved (user already authorized this app before)
        if (data.autoApproved && data.data.redirectUrl) {
          console.log('✅ Auto-approved! Redirecting to:', data.data.redirectUrl);
          setAutoRedirecting(true);
          // Small delay to show the auto-redirect message
          setTimeout(() => {
            window.location.href = data.data.redirectUrl;
          }, 500);
          return;
        }

        // Show consent form
        setAppInfo({
          ...data.data.app,
          redirectUri: searchParams.get('redirect_uri'),
          scope: data.data.scope,
          state: data.data.state,
          clientId: searchParams.get('client_id')
        });
        setDids(data.data.dids || []);
        if (data.data.dids && data.data.dids.length > 0) {
          setSelectedDID(data.data.dids[0].did);
        }
        setError('');
      } else {
        console.log('🔴 OAuthAuthorize: Request failed with status:', response.status);
        // If unauthorized, redirect to login with returnUrl
        if (response.status === 401 || response.status === 403) {
          console.log('🔴 OAuthAuthorize: Unauthorized (401/403), redirecting to login');
          const returnUrl = window.location.pathname + window.location.search;
          console.log('🔴 ReturnUrl being passed to login:', returnUrl);
          navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
          return;
        }
        setError(data.message || 'Failed to load authorization request');
      }
    } catch (err) {
      console.error('🔴 OAuthAuthorize: Caught error:', err);
      setError('Failed to load authorization request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDID) {
      setError('Please select a DID to share');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      console.log('Sending approval with:', {
        client_id: appInfo.clientId,
        redirect_uri: appInfo.redirectUri,
        scope: appInfo.scope,
        state: appInfo.state,
        did: selectedDID
      });

      const response = await fetch('http://localhost:5000/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: appInfo.clientId,
          redirect_uri: appInfo.redirectUri,
          scope: appInfo.scope,
          state: appInfo.state,
          did: selectedDID
        })
      });

      const data = await response.json();
      console.log('Approval response:', data);

      if (response.ok) {
        console.log('Redirecting to:', data.data.redirectUrl);
        window.location.href = data.data.redirectUrl;
      } else {
        console.error('Approval failed:', data);
        setError(data.message || 'Failed to approve authorization');
        setLoading(false);
      }
    } catch (err) {
      console.error('Approval error:', err);
      setError('Failed to approve authorization: ' + err.message);
      setLoading(false);
    }
  };

  const handleDeny = () => {
    const errorUrl = new URL(appInfo.redirectUri);
    errorUrl.searchParams.set('error', 'access_denied');
    errorUrl.searchParams.set('error_description', 'User denied authorization');
    if (appInfo.state) {
      errorUrl.searchParams.set('state', appInfo.state);
    }
    window.location.href = errorUrl.toString();
  };

  const parseScopePermissions = (scope) => {
    const scopes = scope?.split(' ') || [];
    const permissions = [];

    if (scopes.includes('openid') || scopes.includes('basic_profile')) {
      permissions.push({
        icon: '',
        title: 'Basic Profile',
        description: 'Your username and account creation date'
      });
    }

    if (scopes.includes('email')) {
      permissions.push({
        icon: '',
        title: 'Email Address',
        description: 'Your email address'
      });
    }

    if (scopes.includes('profile')) {
      permissions.push({
        icon: '',
        title: 'Full Profile',
        description: 'Your complete profile information'
      });
    }

    if (scopes.includes('credentials')) {
      permissions.push({
        icon: '',
        title: 'Credentials',
        description: 'Your verifiable credentials'
      });
    }

    if (scopes.includes('dids')) {
      permissions.push({
        icon: '',
        title: 'Decentralized Identifiers',
        description: 'Your DID information'
      });
    }

    return permissions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          {autoRedirecting && (
            <p className="mt-4 text-sm text-gray-600">
              Already authorized. Redirecting...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && !appInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-6">
        <Card className="max-w-md w-full p-6">
          <Alert variant="error">{error}</Alert>
          <Button onClick={() => window.close()} className="w-full mt-4">
            Close Window
          </Button>
        </Card>
      </div>
    );
  }

  const permissions = parseScopePermissions(appInfo?.scope);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-6">
          {appInfo.logoUrl ? (
            <img
              src={appInfo.logoUrl}
              alt={appInfo.appName}
              className="w-16 h-16 mx-auto mb-4 rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {appInfo.appName}
          </h1>
          <p className="text-sm text-gray-600">{appInfo.description}</p>
          {appInfo.website && (
            <a
              href={appInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              {appInfo.website}
            </a>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 text-center">
            <strong>{appInfo.appName}</strong> wants to access your Identity Vault
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            This app will be able to:
          </h3>
          <div className="space-y-3">
            {permissions.map((permission, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{permission.icon}</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {permission.title}
                  </div>
                  <div className="text-xs text-gray-600">
                    {permission.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {dids.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select which identity to share:
            </label>
            <select
              value={selectedDID}
              onChange={(e) => setSelectedDID(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            >
              {dids.map((did) => (
                <option key={did.did} value={did.did}>
                  {did.did} ({did.method})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Your decentralized identifier will be shared with this app
            </p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-yellow-900">
            <strong> Important:</strong> Only authorize apps you trust. You can revoke access
            anytime from your Connected Apps settings.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleDeny}
            variant="secondary"
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            className="flex-1"
            disabled={loading || !selectedDID}
          >
            {loading ? 'Authorizing...' : 'Authorize'}
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By authorizing, you allow <strong>{appInfo.appName}</strong> to access
            your information according to their privacy policy.
          </p>
        </div>
      </Card>
    </div>
  );
}
