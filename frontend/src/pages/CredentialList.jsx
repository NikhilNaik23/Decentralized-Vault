import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import credentialService from '../services/credentialService';
import { formatTimeAgo } from '../utils/helpers';

const CredentialList = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await credentialService.getAll();
      setCredentials(response.data?.credentials || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const filteredCredentials = credentials.filter(cred => {
    const searchLower = searchTerm.toLowerCase();
    const type = cred.credentialType?.toLowerCase() || cred.type?.toLowerCase() || '';
    const issuerName = typeof cred.issuer === 'object' ? cred.issuer?.name?.toLowerCase() : cred.issuer?.toLowerCase() || '';
    const issuerDid = typeof cred.issuer === 'object' ? cred.issuer?.did?.toLowerCase() : '';
    
    return type.includes(searchLower) || 
           issuerName.includes(searchLower) || 
           issuerDid.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credentials</h1>
            <p className="mt-2 text-gray-600">Manage your verifiable credentials</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Link to="/credentials/ipfs">
              <Button variant="secondary">
                <Plus className="h-5 w-5 mr-2" />
                Store on IPFS
              </Button>
            </Link>
            <Link to="/credentials/add">
              <Button>
                <Plus className="h-5 w-5 mr-2" />
                Add Credential
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Credentials List */}
        {filteredCredentials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredentials.map((credential) => (
              <Card key={credential._id} className="hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  {credential.onBlockchain && credential.status === 'active' ? (
                    <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      <XCircle className="h-3 w-3 mr-1" />
                      {credential.status === 'revoked' ? 'Revoked' : credential.status === 'expired' ? 'Expired' : 'Unverified'}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {credential.credentialType || credential.type || 'Credential'}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <span className="font-medium">Issuer:</span>{' '}
                    {typeof credential.issuer === 'object' 
                      ? credential.issuer?.name || credential.issuer?.did?.substring(0, 20) + '...'
                      : credential.issuer?.substring(0, 20) + '...'}
                  </p>
                  <p>
                    <span className="font-medium">Issued:</span>{' '}
                    {formatTimeAgo(credential.issuanceDate || credential.createdAt)}
                  </p>
                  {credential.expirationDate && (
                    <p>
                      <span className="font-medium">Expires:</span>{' '}
                      {formatTimeAgo(credential.expirationDate)}
                    </p>
                  )}
                </div>

                <Link to={`/credentials/${credential._id}`}>
                  <Button variant="outline" size="sm" fullWidth>
                    View Details
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No credentials found' : 'No credentials yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Add your first verifiable credential to get started'
                }
              </p>
              {!searchTerm && (
                <Link to="/credentials/add">
                  <Button>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Credential
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CredentialList;
