import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import storageService from '../services/storageService';
import didService from '../services/didService';

const DecentralizedStorage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: 'EducationalCredential',
        subject: {
            degree: '',
            major: '',
            institution: '',
            graduationYear: '',
        },
        issuerDID: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [ipfsStatus, setIpfsStatus] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchUserDID();
        checkIPFSStatus();
    }, []);

    const fetchUserDID = async () => {
        try {
            const response = await didService.getAll();
            if (response.data && response.data.dids && response.data.dids.length > 0) {
                const activeDID = response.data.dids.find(did => did.isActive);
                const selectedDID = activeDID || response.data.dids[0];
                setFormData(prev => ({
                    ...prev,
                    issuerDID: selectedDID?.did || ''
                }));
            }
        } catch (err) {
            console.error('Failed to fetch DID:', err);
        }
    };

    const checkIPFSStatus = async () => {
        try {
            const response = await storageService.getIPFSStatus();
            if (response && response.data && response.data.ipfs) {
                setIpfsStatus(response.data.ipfs);
            } else {
                // Set default status if response structure is unexpected
                setIpfsStatus({
                    enabled: true, // Allow form to work in simulated mode
                    mode: 'simulated',
                    message: 'IPFS service status unavailable'
                });
            }
        } catch (err) {
            console.error('Failed to check IPFS status:', err);
            // Set error status but still allow form to work
            setIpfsStatus({
                enabled: true, // Allow simulated mode to work
                mode: 'simulated',
                message: 'Unable to connect to IPFS service. Using simulated mode.'
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setResult(null);

        try {
            const response = await storageService.storeDecentralized(formData);
            setSuccess('Credential stored successfully on IPFS!');
            setResult(response.data.credential);
            
            // Reset form after 2 seconds and navigate
            setTimeout(() => {
                navigate('/credentials');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to store credential on IPFS');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Decentralized Storage (IPFS)
                </h1>
                <p className="text-gray-600">
                    Store your credentials on IPFS for true decentralization and distributed access.
                </p>
            </div>

            {/* IPFS Status */}
            {ipfsStatus && (
                <Card className={`mb-6 ${ipfsStatus.enabled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {ipfsStatus.enabled ? (
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${ipfsStatus.enabled ? 'text-green-800' : 'text-yellow-800'}`}>
                                IPFS Status: {ipfsStatus.enabled ? 'Enabled' : 'Disabled'}
                            </h3>
                            <p className={`mt-1 text-sm ${ipfsStatus.enabled ? 'text-green-700' : 'text-yellow-700'}`}>
                                {ipfsStatus.message}
                            </p>
                            {ipfsStatus.mode === 'simulated' && (
                                <p className="mt-1 text-xs text-gray-600">
                                    Running in simulated mode for demonstration. Configure real IPFS for production.
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {!ipfsStatus?.enabled && (
                <Alert variant="warning" className="mb-6">
                    IPFS is currently disabled. Enable IPFS in backend configuration to use decentralized storage.
                </Alert>
            )}

            {/* Info Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">About Decentralized Storage</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Credentials stored on distributed IPFS network</li>
                                <li>No single point of failure</li>
                                <li>Content-addressed storage (immutable)</li>
                                <li>Data encrypted before upload (only you can decrypt)</li>
                                <li>Blockchain stores verification hash</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Form */}
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credential Type
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={loading || !ipfsStatus?.enabled}
                        >
                            <option value="EducationalCredential">Educational Credential</option>
                            <option value="EmploymentCredential">Employment Credential</option>
                            <option value="IdentityCredential">Identity Credential</option>
                            <option value="HealthCredential">Health Credential</option>
                            <option value="FinancialCredential">Financial Credential</option>
                            <option value="GovernmentCredential">Government Credential</option>
                            <option value="ProfessionalCredential">Professional Credential</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Degree/Certificate"
                            name="subject.degree"
                            value={formData.subject.degree}
                            onChange={handleChange}
                            placeholder="e.g., Bachelor of Science"
                            required
                            disabled={loading || !ipfsStatus?.enabled}
                        />
                        <Input
                            label="Major/Field"
                            name="subject.major"
                            value={formData.subject.major}
                            onChange={handleChange}
                            placeholder="e.g., Computer Science"
                            required
                            disabled={loading || !ipfsStatus?.enabled}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Institution"
                            name="subject.institution"
                            value={formData.subject.institution}
                            onChange={handleChange}
                            placeholder="e.g., MIT"
                            required
                            disabled={loading || !ipfsStatus?.enabled}
                        />
                        <Input
                            label="Graduation Year"
                            name="subject.graduationYear"
                            type="number"
                            value={formData.subject.graduationYear}
                            onChange={handleChange}
                            placeholder="e.g., 2024"
                            required
                            disabled={loading || !ipfsStatus?.enabled}
                        />
                    </div>

                    <Input
                        label="Issuer DID"
                        name="issuerDID"
                        value={formData.issuerDID}
                        onChange={handleChange}
                        placeholder="did:vault:..."
                        required
                        disabled={loading || !ipfsStatus?.enabled}
                        readOnly
                    />

                    {error && <Alert variant="error">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Button
                        type="submit"
                        disabled={loading || !ipfsStatus?.enabled}
                        className="w-full"
                    >
                        {loading ? 'Storing on IPFS...' : 'Store on IPFS'}
                    </Button>
                </form>
            </Card>

            {/* Result */}
            {result && (
                <Card className="mt-6 bg-green-50 border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">
                        ✓ Stored Successfully on IPFS
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded border">
                            <p className="text-xs font-medium text-gray-500 mb-1">Credential ID</p>
                            <p className="text-sm font-mono text-gray-900 break-all">{result.credentialId}</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <p className="text-xs font-medium text-gray-500 mb-1">IPFS CID</p>
                            <p className="text-sm font-mono text-gray-900 break-all">{result.ipfsCID}</p>
                        </div>
                        {result.ipfsGatewayUrl && (
                            <div className="bg-white p-3 rounded border">
                                <p className="text-xs font-medium text-gray-500 mb-1">IPFS Gateway URL</p>
                                <a
                                    href={result.ipfsGatewayUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline break-all"
                                >
                                    {result.ipfsGatewayUrl}
                                </a>
                            </div>
                        )}
                        <div className="bg-white p-3 rounded border">
                            <p className="text-xs font-medium text-gray-500 mb-1">Storage Type</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {result.storageType}
                            </span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default DecentralizedStorage;
