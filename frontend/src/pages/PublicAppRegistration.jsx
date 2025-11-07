import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';

export default function PublicAppRegistration() {
  const [formData, setFormData] = useState({
    appName: '',
    redirectUri: '',
    website: '',
    description: '',
    logoUrl: '',
    developerEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/oauth/apps/public-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setCredentials({
          clientId: data.data.clientId,
          clientSecret: data.data.clientSecret,
          appName: formData.appName
        });
        // Clear form
        setFormData({
          appName: '',
          redirectUri: '',
          website: '',
          description: '',
          logoUrl: '',
          developerEmail: ''
        });
      } else {
        setError(data.message || 'Failed to register app');
      }
    } catch (err) {
      setError('Failed to register app: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    alert(`${field} copied to clipboard!`);
  };

  if (credentials) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 App Registered Successfully!
            </h1>
            <p className="text-gray-600">
              Your app <strong>{credentials.appName}</strong> has been registered
            </p>
          </div>

          <Alert variant="warning" className="mb-6">
            <strong>⚠️ Important:</strong> Save these credentials now! The client secret will not be shown again.
          </Alert>

          {/* Client ID */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={credentials.clientId}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(credentials.clientId, 'Client ID')}
                variant="secondary"
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Client Secret */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client Secret
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={credentials.clientSecret}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(credentials.clientSecret, 'Client Secret')}
                variant="secondary"
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Integration Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Save your Client ID and Client Secret securely</li>
              <li>Redirect users to: <code className="bg-blue-100 px-1 rounded">http://localhost:5174/oauth/authorize</code></li>
              <li>Exchange authorization code for access token at: <code className="bg-blue-100 px-1 rounded">/api/oauth/token</code></li>
              <li>Access user info at: <code className="bg-blue-100 px-1 rounded">/api/oauth/userinfo</code></li>
            </ol>
          </div>

          {/* Example Integration */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Example OAuth URL:</h3>
            <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
{`http://localhost:5174/oauth/authorize?
  client_id=${credentials.clientId}&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=openid profile email&
  state=RANDOM_STATE&
  response_type=code`}
            </pre>
          </div>

          <Button
            onClick={() => {
              setCredentials(null);
              setError('');
            }}
            className="w-full"
          >
            Register Another App
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Your Application
          </h1>
          <p className="text-gray-600">
            Get OAuth credentials to integrate "Sign in with DID" into your app
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Name *
            </label>
            <Input
              type="text"
              name="appName"
              value={formData.appName}
              onChange={handleChange}
              placeholder="My Awesome App"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developer Email *
            </label>
            <Input
              type="email"
              name="developerEmail"
              value={formData.developerEmail}
              onChange={handleChange}
              placeholder="developer@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll use this to contact you about your application
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redirect URI *
            </label>
            <Input
              type="url"
              name="redirectUri"
              value={formData.redirectUri}
              onChange={handleChange}
              placeholder="https://yourapp.com/callback"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Where users will be redirected after authorization
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <Input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourapp.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="A brief description of what your app does..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL (Optional)
            </label>
            <Input
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="https://yourapp.com/logo.png"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Before You Register
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Your app will appear in the user consent screen</li>
              <li>Users can revoke access anytime from their settings</li>
              <li>Store your client secret securely - it won't be shown again</li>
              <li>Follow OAuth 2.0 best practices for security</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Application'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Need help integrating? Check our{' '}
            <a href="/docs/oauth" className="text-blue-600 hover:underline">
              OAuth Documentation
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
