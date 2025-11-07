import { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Calendar, Shield } from 'lucide-react';
import vaultService from '../services/vaultService';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

const ConnectedApps = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revokingAppId, setRevokingAppId] = useState(null);

  useEffect(() => {
    fetchConnectedApps();
  }, []);

  const fetchConnectedApps = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await vaultService.getConnectedApps();
      setApps(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch connected apps');
      console.error('Error fetching connected apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (appId, appName) => {
    if (!confirm(`Are you sure you want to revoke access for "${appName}"? This will invalidate all active tokens for this app.`)) {
      return;
    }

    try {
      setRevokingAppId(appId);
      setError('');
      setSuccess('');
      
      await vaultService.revokeApp(appId);
      
      setSuccess(`Access revoked for ${appName}`);
      
      // Remove the app from the list
      setApps(apps.filter(app => app.appId !== appId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to revoke app access');
      console.error('Error revoking app:', err);
    } finally {
      setRevokingAppId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Connected Apps</h1>
        <p className="text-gray-600">
          Manage applications that have access to your decentralized identity
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" onClose={() => setSuccess('')} className="mb-6">
          {success}
        </Alert>
      )}

      {apps.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Connected Apps
            </h3>
            <p className="text-gray-600">
              You haven't authorized any applications to access your identity yet.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {apps.map((app) => (
            <Card key={app.appId} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* App Logo */}
                  <div className="flex-shrink-0">
                    {app.logoUrl ? (
                      <img
                        src={app.logoUrl}
                        alt={`${app.appName} logo`}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold"
                      style={{ display: app.logoUrl ? 'none' : 'flex' }}
                    >
                      {app.appName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* App Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {app.appName}
                      </h3>
                      {app.website && (
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          title="Visit website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {app.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {app.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Last used: {formatDate(app.lastUsedAt)}</span>
                      </div>
                      {app.tokenCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4" />
                          <span>
                            {app.tokenCount} active token{app.tokenCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 ml-4">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRevokeAccess(app.appId, app.appName)}
                    disabled={revokingAppId === app.appId}
                    className="flex items-center space-x-2"
                  >
                    {revokingAppId === app.appId ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Revoking...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Revoke Access</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">About Connected Apps</h4>
            <p className="text-sm text-blue-800 mb-2">
              These are applications you've authorized to access your decentralized identity.
              Revoking access will immediately invalidate all tokens for that app, and the app
              will no longer be able to access your information.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> When you sign in to an app you've already authorized, you'll 
              be automatically redirected without seeing the consent form again. If you revoke 
              access and later sign in again, you'll need to re-authorize the app.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConnectedApps;
