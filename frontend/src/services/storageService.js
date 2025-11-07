import api from './api';

/**
 * Storage Service - Decentralized storage operations
 */

// Store credential in decentralized mode (IPFS)
export const storeDecentralized = async (credentialData) => {
    const response = await api.post('/storage/decentralized', credentialData);
    return response.data;
};

// Retrieve credential from IPFS
export const retrieveFromIPFS = async (credentialId) => {
    const response = await api.get(`/storage/decentralized/${credentialId}`);
    return response.data;
};

// Get storage statistics
export const getStorageStats = async () => {
    const response = await api.get('/storage/stats');
    return response.data;
};

// Get IPFS service status (public - no auth)
export const getIPFSStatus = async () => {
    const response = await api.get('/storage/ipfs/status');
    return response.data;
};

// Get IPFS gateway URL for CID (public - no auth)
export const getIPFSGatewayUrl = async (cid) => {
    const response = await api.get(`/storage/ipfs/${cid}`);
    return response.data;
};

export default {
    storeDecentralized,
    retrieveFromIPFS,
    getStorageStats,
    getIPFSStatus,
    getIPFSGatewayUrl,
};
