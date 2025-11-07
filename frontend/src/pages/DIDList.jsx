import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Shield, CheckCircle, XCircle, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import didService from '../services/didService';
import { formatTimeAgo, truncateString } from '../utils/helpers';

const DIDList = () => {
  const [dids, setDids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDIDs();
  }, []);

  const fetchDIDs = async () => {
    try {
      setLoading(true);
      const response = await didService.getAll();
      setDids(response.data?.dids || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load DIDs');
    } finally {
      setLoading(false);
    }
  };

  const filteredDIDs = dids.filter(did =>
    did.did?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    did.controller?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-gray-900">Decentralized Identifiers</h1>
            <p className="mt-2 text-gray-600">Manage your DIDs</p>
          </div>
          <Link to="/dids/create" className="mt-4 sm:mt-0">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Create DID
            </Button>
          </Link>
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
              placeholder="Search DIDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* DIDs List */}
        {filteredDIDs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredDIDs.map((did) => (
              <Card key={did._id} className="hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Shield className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {truncateString(did.did, 20, 10)}
                      </h3>
                      {did.isActive ? (
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Created:</span> {formatTimeAgo(did.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium">Services:</span> {did.service?.length || 0}
                      </p>
                      <p>
                        <span className="font-medium">Public Keys:</span> {did.publicKey?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex space-x-2">
                    <Link to={`/dids/${did._id}`}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No DIDs found' : 'No DIDs yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first decentralized identifier to get started'
                }
              </p>
              {!searchTerm && (
                <Link to="/dids/create">
                  <Button>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First DID
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

export default DIDList;
