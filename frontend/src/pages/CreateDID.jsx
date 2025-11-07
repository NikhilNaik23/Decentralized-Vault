import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import didService from '../services/didService';

const CreateDID = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    method: 'vault',
    publicKeyPem: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await didService.create(formData);
      setSuccess('DID created successfully!');
      
      // Redirect to DID details after a short delay
      setTimeout(() => {
        navigate(`/dids/${response.data.did._id || response.data.did.did}`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create DID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Create New DID</h1>
          </div>
          <p className="text-gray-600">
            Create a new Decentralized Identifier for your identity vault
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}
        
        {success && (
          <Alert type="success" message={success} className="mb-6" />
        )}

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DID Method
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vault">vault (Recommended)</option>
                <option value="key">key</option>
                <option value="web">web</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The DID method determines how your identifier is created and resolved
              </p>
            </div>

            <Input
              label="Public Key PEM (Optional)"
              name="publicKeyPem"
              value={formData.publicKeyPem}
              onChange={handleChange}
              placeholder="-----BEGIN PUBLIC KEY-----"
              type="textarea"
            />
            <p className="text-sm text-gray-500 -mt-4">
              Leave empty to auto-generate a new key pair
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What is a DID?</h4>
              <p className="text-sm text-blue-800">
                A Decentralized Identifier (DID) is a globally unique identifier that enables 
                verifiable, self-sovereign digital identity. Unlike traditional identifiers, 
                DIDs are under your control and don't rely on centralized authorities.
              </p>
            </div>

            <div className="flex space-x-4">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
              >
                Create DID
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dids')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateDID;
