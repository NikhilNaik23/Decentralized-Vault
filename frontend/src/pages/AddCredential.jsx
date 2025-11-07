import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Shield, Calendar, Search } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import credentialService from '../services/credentialService';
import didService from '../services/didService';
import { formatDate, formatRelativeTime } from '../utils/formatters';

const AddCredential = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dids, setDids] = useState([]);
  const [formData, setFormData] = useState({
    type: '',
    issuer: '',
    subject: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    data: '{}',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch user's DIDs for subject selection
    fetchDIDs();
  }, []);

  const fetchDIDs = async () => {
    try {
      const response = await didService.getAll();
      // Response structure after API interceptor: { success, data: { dids, count } }
      if (response && response.data && response.data.dids) {
        setDids(response.data.dids);
      }
    } catch (err) {
      console.error('Failed to fetch DIDs:', err.message || err);
      // Don't show error to user, just leave DIDs empty for manual entry
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type.trim()) {
      newErrors.type = 'Credential type is required';
    }
    if (!formData.issuer.trim()) {
      newErrors.issuer = 'Issuer is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject DID is required';
    } else {
      // Validate DID format
      const didRegex = /^did:vault:[a-f0-9]{32,}$/;
      if (!didRegex.test(formData.subject)) {
        newErrors.subject = 'Invalid DID format. Should be: did:vault:identifier';
      }
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    // Validate JSON data
    try {
      JSON.parse(formData.data);
    } catch {
      newErrors.data = 'Invalid JSON format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Parse the credential data JSON
      const parsedData = JSON.parse(formData.data);
      
      // Add the subject's DID to the parsed data so backend can identify the holder
      const subjectData = {
        ...parsedData,
        did: formData.subject // Add the student's DID here
      };
      
      const dataToSubmit = {
        type: formData.type,
        issuerDID: formData.issuer, // Backend expects issuerDID (LPU's DID)
        subject: subjectData, // Backend expects subject as object with DID
        issueDate: formData.issueDate, // Send the issue date from form
        expirationDate: formData.expiryDate || undefined, // Backend expects expirationDate
        metadata: {}, // Optional metadata
      };

      console.log('🔍 Frontend - Data being sent to backend:', JSON.stringify(dataToSubmit, null, 2));
      console.log('🔍 Frontend - Student DID:', formData.subject);
      console.log('🔍 Frontend - Subject Data:', subjectData);
      console.log('🔍 Frontend - Issue Date:', formData.issueDate);

      await credentialService.storeCredential(dataToSubmit);
      alert('Credential added successfully! The student can now view it in their vault.');
      navigate('/credentials');
    } catch (err) {
      console.error('❌ Frontend - Error creating credential:', err);
      alert(err.message || 'Failed to add credential');
    } finally {
      setLoading(false);
    }
  };

  const credentialTypes = [
    'EducationalCredential',
    'EmploymentCredential',
    'IdentityCredential',
    'HealthCredential',
    'FinancialCredential',
    'GovernmentCredential',
    'ProfessionalCredential',
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add New Credential</h1>
          <p className="text-gray-600 mt-1">Store a verifiable credential in your vault</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Credential Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                Credential Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a type</option>
                {credentialTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Issuer DID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issuer DID *
              </label>
              {dids.length > 0 ? (
                <select
                  name="issuer"
                  value={formData.issuer}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select an Issuer DID</option>
                  {dids.map(did => (
                    <option key={did._id} value={did.did}>
                      {did.did}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  name="issuer"
                  value={formData.issuer}
                  onChange={handleChange}
                  placeholder="did:vault:123456789abcdefghi"
                  error={errors.issuer}
                />
              )}
              {errors.issuer && (
                <p className="mt-1 text-sm text-red-600">{errors.issuer}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The DID of the issuer (usually your DID if you're self-issuing)
              </p>
            </div>

            {/* Subject DID - Manual Entry for Student DID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject (Student) DID *
              </label>
              <Input
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="did:vault:student123456789abcdef"
                error={errors.subject}
                className="font-mono text-sm"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                👤 Enter the student's DID (the person receiving the credential)
              </p>
              <p className="mt-1 text-xs text-blue-600">
                💡 <strong>University Use Case:</strong> Ask the student for their DID and enter it here
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Issue Date *
                </label>
                <Input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  error={errors.issueDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Expiry Date (Optional)
                </label>
                <Input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Credential Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credential Data (JSON) *
              </label>
              <textarea
                name="data"
                value={formData.data}
                onChange={handleChange}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder='{"degree": "Bachelor of Science", "field": "Computer Science", "university": "Your University", "graduationYear": 2025}'
              />
              {errors.data && (
                <p className="mt-1 text-sm text-red-600">{errors.data}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter valid JSON data for the credential (see example below)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Secure Storage</p>
                  <p>
                    Your credential will be encrypted using AES-256-GCM encryption and 
                    anchored on the blockchain for verification.
                  </p>
                </div>
              </div>
            </div>

            {/* University Use Case Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-2">🏫 University Use Case</p>
                <div className="space-y-1">
                  <p><strong>Step 1:</strong> Student creates an account and generates their DID</p>
                  <p><strong>Step 2:</strong> Student shares their DID with the university (via email, portal, etc.)</p>
                  <p><strong>Step 3:</strong> University enters the student's DID in the "Subject DID" field above</p>
                  <p><strong>Step 4:</strong> University issues the credential, which is stored on the blockchain</p>
                </div>
              </div>
            </div>

            {/* Example JSON */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">📋 Example JSON for Educational Credential:</p>
              <pre className="text-xs text-gray-700 overflow-x-auto bg-white p-3 rounded border">
{`{
  "degree": "Bachelor of Computer Science",
  "major": "Software Engineering",
  "university": "Lovely Professional University",
  "studentName": "John Doe",
  "rollNumber": "12345678",
  "graduationYear": 2025,
  "cgpa": 9.2,
  "honors": "First Class with Distinction"
}`}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                {loading ? 'Adding Credential...' : 'Add Credential'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/credentials')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddCredential;
