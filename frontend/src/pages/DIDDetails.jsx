import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Key, Link, Trash2, Edit, QrCode, Copy, Shield, Download } from 'lucide-react';
import QRCodeGenerator from 'qrcode';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import didService from '../services/didService';
import { formatDate, formatDID } from '../utils/formatters';
import { copyToClipboard } from '../utils/helpers';

const DIDDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [did, setDID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    fetchDID();
  }, [id]);

  useEffect(() => {
    if (did && did.did) {
      generateQRCode(did.did);
    }
  }, [did]);

  const generateQRCode = async (didString) => {
    try {
      const url = await QRCodeGenerator.toDataURL(didString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const fetchDID = async () => {
    try {
      setLoading(true);
      const data = await didService.getDID(id);
      setDID(data.data.did);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load DID');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      alert('Copied to clipboard!');
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${did.did.substring(0, 20)}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this DID?')) {
      return;
    }

    try {
      await didService.deactivateDID(id);
      alert('DID deactivated successfully!');
      fetchDID();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate DID');
    }
  };

  const handleReactivate = async () => {
    try {
      await didService.reactivateDID(id);
      alert('DID reactivated successfully!');
      fetchDID();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate DID');
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

  if (error || !did) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600">{error || 'DID not found'}</p>
            <Button onClick={() => navigate('/dids')} className="mt-4">
              Back to DIDs
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
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DID Details</h1>
            <p className="text-gray-600 mt-1">Manage your decentralized identifier</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQR(!showQR)}>
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? 'Hide' : 'Show'} QR
            </Button>
            <Button variant="outline" onClick={() => navigate('/dids')}>
              Back
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              did.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {did.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        {/* QR Code (if shown) */}
        {showQR && (
          <Card className="mb-6">
            <div className="flex flex-col items-center py-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="DID QR Code" 
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">Generating QR Code...</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-600 text-center max-w-md">
                Scan this QR code to share your DID
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(did.did)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy DID
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadQR}
                  disabled={!qrCodeUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* DID Information */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            <Key className="inline w-5 h-5 mr-2" />
            DID Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DID
              </label>
              <div className="flex items-center gap-2">
                <p className="text-gray-900 font-mono text-sm flex-1 break-all">
                  {did.did}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(did.did)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <p className="text-gray-900">{did.method}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <p className="text-gray-900">{formatDate(did.createdAt)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Updated
                </label>
                <p className="text-gray-900">{formatDate(did.updatedAt)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Public Key */}
        {did.publicKey && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              <Shield className="inline w-5 h-5 mr-2" />
              Public Key
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Type
                </label>
                <p className="text-gray-900">{did.publicKey.type || 'Ed25519VerificationKey2020'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-mono text-xs flex-1 break-all bg-gray-50 p-2 rounded">
                    {did.publicKey.publicKeyBase58 || did.publicKey}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(did.publicKey.publicKeyBase58 || did.publicKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Service Endpoints */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              <Link className="inline w-5 h-5 mr-2" />
              Service Endpoints
            </h2>
            <Button
              size="sm"
              onClick={() => navigate(`/dids/${id}/add-service`)}
            >
              Add Service
            </Button>
          </div>

          {did.service && did.service.length > 0 ? (
            <div className="space-y-3">
              {did.service.map((service, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.type}</p>
                      <p className="text-sm text-gray-600 mt-1">{service.serviceEndpoint}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // Handle remove service
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No service endpoints configured</p>
          )}
        </Card>

        {/* DID Document */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">DID Document</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(did.document || did, null, 2)}
          </pre>
        </Card>

        {/* Actions */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {did.isActive ? (
              <Button variant="danger" onClick={handleDeactivate}>
                Deactivate DID
              </Button>
            ) : (
              <Button onClick={handleReactivate}>
                Reactivate DID
              </Button>
            )}
            
            <Button variant="outline" onClick={() => navigate(`/dids/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit DID
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default DIDDetails;
