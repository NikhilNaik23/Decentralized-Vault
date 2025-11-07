import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Calendar, FileText, ExternalLink, Trash2, Edit } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import credentialService from '../services/credentialService';
import { formatDate, formatHash } from '../utils/formatters';

const CredentialDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchCredential();
  }, [id]);

  const fetchCredential = async () => {
    try {
      setLoading(true);
      const data = await credentialService.getCredential(id);
      setCredential(data.data.credential);
    } catch (err) {
      setError(err.message || 'Failed to load credential');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      await credentialService.verifyCredential(id);
      alert('Credential verified successfully!');
      fetchCredential();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify credential');
    } finally {
      setVerifying(false);
    }
  };

  const handleRevoke = async () => {
    const reason = prompt('Please provide a reason for revoking this credential:');
    if (!reason || reason.trim().length < 5) {
      alert('Revocation reason must be at least 5 characters long');
      return;
    }

    if (!window.confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      return;
    }

    try {
      setRevoking(true);
      await credentialService.revokeCredential(id, reason);
      alert('Credential revoked successfully!');
      navigate('/credentials');
    } catch (err) {
      alert(err.message || 'Failed to revoke credential');
    } finally {
      setRevoking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this credential? This action cannot be undone.')) {
      return;
    }

    try {
      await credentialService.deleteCredential(id);
      alert('Credential deleted successfully!');
      navigate('/credentials');
    } catch (err) {
      alert(err.message || 'Failed to delete credential');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error || !credential) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600">{error || 'Credential not found'}</p>
            <Button onClick={() => navigate('/credentials')} className="mt-4">
              Back to Credentials
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credential Details</h1>
            <p className="text-gray-600 mt-1">View and manage credential information</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/credentials')}
            >
              Back
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              credential.status === 'active'
                ? 'bg-green-100 text-green-800'
                : credential.status === 'revoked'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {credential.status?.toUpperCase()}
          </span>
          {credential.verified && (
            <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Shield className="w-4 h-4 mr-1" />
              Verified
            </span>
          )}
        </div>

        {/* Main Information */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Credential Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <p className="text-gray-900">{credential.type}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuer
              </label>
              <p className="text-gray-900">
                {typeof credential.issuer === 'object' 
                  ? credential.issuer?.name || credential.issuer?.did 
                  : credential.issuer}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject (DID)
              </label>
              <p className="text-gray-900 font-mono text-sm break-all">
                {credential.holder || credential.did || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Issue Date
                </label>
                <p className="text-gray-900">
                  {formatDate(credential.issuanceDate || credential.issueDate)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Date the credential was officially issued
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Expiry Date
                </label>
                <p className="text-gray-900">
                  {credential.expirationDate || credential.expiryDate 
                    ? formatDate(credential.expirationDate || credential.expiryDate) 
                    : 'No expiry'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {credential.expirationDate || credential.expiryDate 
                    ? 'Credential expires on this date' 
                    : 'This credential does not expire'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Created At
              </label>
              <p className="text-gray-900">
                {formatDate(credential.createdAt)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Date the credential was stored in the vault
              </p>
            </div>
          </div>
        </Card>

        {/* Credential Data */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            <FileText className="inline w-5 h-5 mr-2" />
            Credential Subject Data
          </h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(credential.credentialSubject || credential.subject || credential.data || {}, null, 2)}
          </pre>
        </Card>

        {/* Verification Hash - For Public Verification */}
        {credential.credentialHash && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">
              <Shield className="inline w-5 h-5 mr-2" />
              Public Verification Hash
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Credential Hash (Copy this for public verification)
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-blue-900 font-mono text-sm break-all bg-white p-3 rounded flex-1 border border-blue-300">
                    {credential.credentialHash}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(credential.credentialHash);
                      alert('Hash copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Share this hash to allow anyone to verify this credential without logging in at /verify
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Blockchain Information */}
        {credential.blockchainTxHash && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Blockchain Proof</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Hash
                </label>
                <p className="text-gray-900 font-mono text-sm break-all">
                  {credential.blockchainTxHash}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block Number
                </label>
                <p className="text-gray-900">{credential.blockchainBlockNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anchored At
                </label>
                <p className="text-gray-900">{formatDate(credential.createdAt)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {credential.status === 'active' && !credential.verified && (
              <Button
                onClick={handleVerify}
                disabled={verifying}
              >
                <Shield className="w-4 h-4 mr-2" />
                {verifying ? 'Verifying...' : 'Verify Credential'}
              </Button>
            )}

            {credential.status === 'active' && (
              <Button
                variant="danger"
                onClick={handleRevoke}
                disabled={revoking}
              >
                {revoking ? 'Revoking...' : 'Revoke Credential'}
              </Button>
            )}

            <Button
              variant="danger"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Credential
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default CredentialDetails;
