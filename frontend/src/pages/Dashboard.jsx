import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Box, TrendingUp, Plus, Eye } from 'lucide-react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import vaultService from '../services/vaultService';
import blockchainService from '../services/blockchainService';
import { formatTimeAgo } from '../utils/helpers';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vaultData, blockchainData] = await Promise.all([
        vaultService.getStats(),
        blockchainService.getStats(),
      ]);
      
      setStats(vaultData.data.stats || vaultData.data);
      setBlockchainStats(blockchainData.data.stats || blockchainData.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your decentralized identity vault</p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total DIDs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalDIDs || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credentials</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCredentials || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Box className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Blockchain Blocks</p>
                <p className="text-2xl font-bold text-gray-900">{blockchainStats?.totalBlocks || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vault Status</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Link to="/dids/create">
                <Button variant="primary" fullWidth className="justify-start">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New DID
                </Button>
              </Link>
              <Link to="/credentials/add">
                <Button variant="secondary" fullWidth className="justify-start">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Credential
                </Button>
              </Link>
              <Link to="/blockchain">
                <Button variant="outline" fullWidth className="justify-start">
                  <Eye className="h-5 w-5 mr-2" />
                  View Blockchain
                </Button>
              </Link>
            </div>
          </Card>

          <Card title="Blockchain Status">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Blocks</span>
                <span className="font-semibold">{blockchainStats?.totalBlocks || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Difficulty</span>
                <span className="font-semibold">{blockchainStats?.difficulty || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chain Valid</span>
                <span className={`font-semibold ${blockchainStats?.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {blockchainStats?.isValid ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Latest Block</span>
                <span className="font-semibold text-sm">
                  {blockchainStats?.latestBlock?.timestamp 
                    ? formatTimeAgo(blockchainStats.latestBlock.timestamp)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card title="Recent DIDs">
          {stats?.recentDIDs && stats.recentDIDs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDIDs.map((did) => (
                <div
                  key={did._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{did.did}</p>
                      <p className="text-sm text-gray-500">
                        Created {formatTimeAgo(did.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Link to={`/dids/${did._id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No DIDs yet</p>
              <Link to="/dids/create">
                <Button variant="primary" size="sm" className="mt-3">
                  Create Your First DID
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
