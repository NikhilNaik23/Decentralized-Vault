import { useState, useEffect } from 'react';
import { Box, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import blockchainService from '../services/blockchainService';
import { formatDate, truncateString } from '../utils/helpers';

const Blockchain = () => {
  const [stats, setStats] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const [statsData, blocksData] = await Promise.all([
        blockchainService.getStats(),
        blockchainService.getBlocks(),
      ]);
      
      setStats(statsData.data?.stats || statsData.data);
      setBlocks(blocksData.data?.blocks || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load blockchain data');
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
          <div className="flex items-center space-x-3 mb-3">
            <Box className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h1>
          </div>
          <p className="text-gray-600">
            View the blockchain that secures your decentralized identity data
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Blocks</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalBlocks || 0}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Difficulty</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.difficulty || 0}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Credentials</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalCredentials || 0}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Chain Valid</p>
              <div className="flex items-center justify-center mt-2">
                {stats?.isValid ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600 mr-2" />
                    <p className="text-xl font-bold text-green-600">Yes</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-8 w-8 text-red-600 mr-2" />
                    <p className="text-xl font-bold text-red-600">No</p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Blocks List */}
        <Card title="Blocks">
          {blocks.length > 0 ? (
            <div className="space-y-4">
              {blocks.reverse().map((block) => (
                <div
                  key={block.index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <Box className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Block #{block.index}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(block.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Nonce: {block.nonce}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Hash</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                        {truncateString(block.hash, 16, 16)}
                      </code>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Previous Hash</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                        {block.previousHash === '0' 
                          ? 'Genesis Block' 
                          : truncateString(block.previousHash, 16, 16)
                        }
                      </code>
                    </div>
                  </div>

                  {/* {block.data && (
                    <div className="mt-3">
                      <p className="text-gray-600 text-sm mb-1">Data</p>
                      <div className="bg-gray-100 rounded p-2">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(block.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )} */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Box className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No blocks found</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Blockchain;
