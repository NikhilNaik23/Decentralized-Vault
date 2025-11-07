import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import storageService from '../services/storageService';

const StorageStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await storageService.getStorageStats();
            console.log('Storage stats response:', response);
            // The API wrapper already extracts response.data, so we just need response.stats
            setStats(response.stats || response.data?.stats);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err.response?.data?.message || 'Failed to fetch storage statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-screen">
                    <LoadingSpinner />
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <Alert variant="error">{error}</Alert>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Storage Statistics
                    </h1>
                    <p className="text-gray-600">
                        Overview of your credential storage distribution across centralized and decentralized systems.
                    </p>
                </div>

            {/* IPFS Status */}
            <Card className={`mb-6 ${stats?.ipfsEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {stats?.ipfsEnabled ? (
                                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.018.702l-4.518 4.518a1 1 0 01-1.414 0L6 13.314V17a1 1 0 01-1 1H3a1 1 0 01-1-1v-3.686a1 1 0 01.293-.707l9-9a1 1 0 011.414 0l9 9a1 1 0 010 1.414z" />
                                </svg>
                            ) : (
                                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                IPFS Decentralized Storage
                            </h3>
                            <p className={`text-sm ${stats?.ipfsEnabled ? 'text-green-700' : 'text-gray-500'}`}>
                                Status: {stats?.ipfsEnabled ? 'Enabled' : 'Disabled'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">
                            {stats?.percentageDecentralized || 0}%
                        </p>
                        <p className="text-sm text-gray-500">Decentralized</p>
                    </div>
                </div>
            </Card>

            {/* Storage Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-3">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-4xl font-bold text-blue-900 mb-1">{stats?.total || 0}</p>
                        <p className="text-sm font-medium text-blue-700">Total Credentials</p>
                    </div>
                </Card>

                {/* Centralized */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-3">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                        </div>
                        <p className="text-4xl font-bold text-purple-900 mb-1">{stats?.centralized || 0}</p>
                        <p className="text-sm font-medium text-purple-700">Centralized (MongoDB)</p>
                    </div>
                </Card>

                {/* Decentralized */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-full mb-3">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <p className="text-4xl font-bold text-green-900 mb-1">{stats?.decentralized || 0}</p>
                        <p className="text-sm font-medium text-green-700">Decentralized (IPFS)</p>
                    </div>
                </Card>

                {/* Hybrid */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-full mb-3">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <p className="text-4xl font-bold text-orange-900 mb-1">{stats?.hybrid || 0}</p>
                        <p className="text-sm font-medium text-orange-700">Hybrid (Both)</p>
                    </div>
                </Card>
            </div>

            {/* Visual Distribution */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Distribution</h3>
                
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Distribution Overview</span>
                        <span className="text-sm text-gray-500">{stats?.total || 0} total</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        {stats?.total > 0 ? (
                            <div className="flex h-full">
                                {stats.centralized > 0 && (
                                    <div
                                        className="bg-purple-600 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${(stats.centralized / stats.total) * 100}%` }}
                                    >
                                        {stats.centralized > 0 && `${stats.centralized}`}
                                    </div>
                                )}
                                {stats.decentralized > 0 && (
                                    <div
                                        className="bg-green-600 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${(stats.decentralized / stats.total) * 100}%` }}
                                    >
                                        {stats.decentralized > 0 && `${stats.decentralized}`}
                                    </div>
                                )}
                                {stats.hybrid > 0 && (
                                    <div
                                        className="bg-orange-600 flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${(stats.hybrid / stats.total) * 100}%` }}
                                    >
                                        {stats.hybrid > 0 && `${stats.hybrid}`}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                No credentials yet
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>🟣 Centralized</span>
                        <span>🟢 Decentralized</span>
                        <span>🟠 Hybrid</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-gray-900">Centralized</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            Stored in MongoDB database. Fast access, traditional storage.
                        </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-gray-900">Decentralized</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            Stored on IPFS. Distributed, no single point of failure.
                        </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-orange-600 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-gray-900">Hybrid</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            Stored in both MongoDB and IPFS. Maximum redundancy.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Recommendations */}
            {stats && stats.total > 0 && (
                <Card className="mt-6 bg-blue-50 border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        💡 Recommendations
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800">
                        {parseFloat(stats.percentageDecentralized) < 50 && stats.ipfsEnabled && (
                            <p>
                                • Consider storing more credentials on IPFS for better decentralization ({stats.percentageDecentralized}% currently decentralized)
                            </p>
                        )}
                        {!stats.ipfsEnabled && (
                            <p>
                                • Enable IPFS to start using decentralized storage and reduce centralization risks
                            </p>
                        )}
                        {stats.hybrid === 0 && stats.ipfsEnabled && (
                            <p>
                                • Try hybrid storage for critical credentials to ensure redundancy across both systems
                            </p>
                        )}
                        {parseFloat(stats.percentageDecentralized) >= 70 && (
                            <p className="text-green-800">
                                ✓ Excellent! You're using decentralized storage effectively ({stats.percentageDecentralized}% decentralized)
                            </p>
                        )}
                    </div>
                </Card>
            )}
        </div>
        </Layout>
    );
};

export default StorageStats;
