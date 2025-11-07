import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import credentialService from '../services/credentialService';

const PublicVerification = () => {
    const [credentialHash, setCredentialHash] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setVerificationResult(null);

        try {
            const response = await credentialService.verifyByHash(credentialHash);
            setVerificationResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setCredentialHash('');
        setVerificationResult(null);
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Public Credential Verification
                </h1>
                <p className="text-gray-600">
                    Verify the authenticity of credentials using blockchain verification.
                    No login required.
                </p>
            </div>

            {/* Info Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">How It Works</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Enter the credential hash you received</li>
                                <li>Our system checks the blockchain for verification</li>
                                <li>Get instant confirmation of credential authenticity</li>
                                <li>No account or login required</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Verification Form */}
            <Card>
                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label htmlFor="hash" className="block text-sm font-medium text-gray-700 mb-2">
                            Credential Hash
                        </label>
                        <Input
                            id="hash"
                            type="text"
                            value={credentialHash}
                            onChange={(e) => setCredentialHash(e.target.value)}
                            placeholder="Enter 64-character credential hash (e.g., a3f5b9c8d2e1...)"
                            required
                            className="font-mono text-sm"
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            The credential hash is a 64-character hexadecimal string provided by the credential issuer.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="error">
                            {error}
                        </Alert>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={loading || !credentialHash}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Verify Credential
                                </>
                            )}
                        </Button>

                        {verificationResult && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </form>
            </Card>

            {/* Verification Result */}
            {verificationResult && (
                <Card className={`mt-6 ${verificationResult.verified ? 'border-2 border-green-500' : 'border-2 border-red-500'}`}>
                    {/* Header */}
                    <div className={`flex items-center gap-4 pb-4 border-b-2 ${verificationResult.verified ? 'border-green-200' : 'border-red-200'}`}>
                        <div className="flex-shrink-0">
                            {verificationResult.verified ? (
                                <svg className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-2xl font-bold ${verificationResult.verified ? 'text-green-900' : 'text-red-900'}`}>
                                {verificationResult.verified ? '✅ Credential Verified' : '❌ Verification Failed'}
                            </h3>
                            <p className={`mt-1 text-sm ${verificationResult.verified ? 'text-green-700' : 'text-red-700'}`}>
                                {verificationResult.verified
                                    ? 'This credential has been verified on the blockchain and is authentic.'
                                    : 'This credential could not be verified. It may not exist or has been tampered with.'}
                            </p>
                        </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="mt-6 space-y-4">
                        {/* Credential Hash */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">📄</span>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Credential Hash</h4>
                                    <p className="text-xs font-mono text-gray-900 break-all bg-white p-2 rounded border">
                                        {verificationResult.credentialHash}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Unique identifier verified against blockchain records
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Credential Info (if available) */}
                        {verificationResult.credential && (
                            <>
                                {/* Issuer Information */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🏛️</span>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Issued By</h4>
                                            <p className="text-base font-semibold text-gray-900">
                                                {verificationResult.credential.issuer}
                                            </p>
                                            {verificationResult.credential.issuerDID && (
                                                <p className="text-xs font-mono text-gray-600 mt-1 break-all">
                                                    Issuer DID: {verificationResult.credential.issuerDID}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Holder/Recipient Information */}
                                {verificationResult.credential.holder && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">👤</span>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Issued To</h4>
                                                <p className="text-xs font-mono text-gray-900 break-all bg-white p-2 rounded border">
                                                    {verificationResult.credential.holder}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Credential holder's DID
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Credential Type */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">📋</span>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Credential Type</h4>
                                            <p className="text-sm text-gray-900">
                                                {verificationResult.credential.type}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Issue Date */}
                                {verificationResult.credential.issuanceDate && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📅</span>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Issue Date</h4>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(verificationResult.credential.issuanceDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">
                                            {verificationResult.credential.status === 'active' ? '✅' : '🔴'}
                                        </span>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Status</h4>
                                            <p className={`text-sm font-semibold ${
                                                verificationResult.credential.status === 'active' 
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }`}>
                                                {verificationResult.credential.status.charAt(0).toUpperCase() + 
                                                 verificationResult.credential.status.slice(1)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Blockchain Status */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">⛓️</span>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Blockchain Verification Status</h4>
                                    
                                    {/* Simulated Blockchain */}
                                    <div className="flex items-center justify-between py-2 px-3 bg-white rounded border mb-2">
                                        <span className="text-sm text-gray-700">Simulated Blockchain:</span>
                                        <span className={`text-sm font-semibold flex items-center gap-1 ${verificationResult.simulated ? 'text-green-600' : 'text-gray-400'}`}>
                                            {verificationResult.simulated ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Verified
                                                </>
                                            ) : (
                                                <>✗ Not Found</>
                                            )}
                                        </span>
                                    </div>

                                    {/* Ethereum Blockchain */}
                                    {verificationResult.ethereum && (
                                        <div className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                            <span className="text-sm text-gray-700">Ethereum Blockchain:</span>
                                            <span className={`text-sm font-semibold flex items-center gap-1 ${verificationResult.ethereum.valid ? 'text-green-600' : 'text-gray-400'}`}>
                                                {verificationResult.ethereum.valid ? (
                                                    <>
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Verified
                                                    </>
                                                ) : (
                                                    <>✗ Not Found</>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Verification Details */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">🔐</span>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Verification Method</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• SHA-256 Hash Verification</li>
                                        <li>• Blockchain Immutable Audit Trail</li>
                                        <li>• Cryptographic Proof of Authenticity</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Verification Time */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">📅</span>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Verification Time</h4>
                                    <p className="text-sm text-gray-900">
                                        {verificationResult.timestamp 
                                            ? new Date(verificationResult.timestamp).toLocaleString()
                                            : new Date().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Message */}
                    {verificationResult.verified && (
                        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-sm text-green-800">
                                ✅ <strong>This credential is authentic</strong> and has not been tampered with. 
                                The credential hash matches the record on the blockchain.
                            </p>
                        </div>
                    )}

                    {!verificationResult.verified && (
                        <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                            <p className="text-sm text-red-800">
                                ⚠️ <strong>Verification failed.</strong> This credential hash was not found on any blockchain. 
                                Please verify the hash is correct or contact the credential issuer.
                            </p>
                        </div>
                    )}
                </Card>
            )}

            {/* Additional Info */}
            <Card className="mt-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About Public Verification</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    <p>
                        <strong>🔐 Secure:</strong> Only the credential hash is checked, no personal data is exposed.
                    </p>
                    <p>
                        <strong>⛓️ Blockchain-Backed:</strong> Verification is performed against immutable blockchain records.
                    </p>
                    <p>
                        <strong>🌐 Cross-Organization:</strong> Any organization can verify credentials without special access.
                    </p>
                    <p>
                        <strong>⚡ Instant:</strong> Get immediate verification results without waiting.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default PublicVerification;
