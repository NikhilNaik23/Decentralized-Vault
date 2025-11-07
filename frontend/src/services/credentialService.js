import api from './api';

const credentialService = {
  // Create a new credential
  create: async (credentialData) => {
    return await api.post('/credentials', credentialData);
  },

  // Store credential (alias for create)
  storeCredential: async (credentialData) => {
    return await api.post('/credentials', credentialData);
  },

  // Get all user's credentials
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/credentials${params ? `?${params}` : ''}`);
  },

  // Get a specific credential
  getCredential: async (credentialId) => {
    return await api.get(`/credentials/${credentialId}`);
  },

  // Get a specific credential (alias)
  getById: async (credentialId) => {
    return await api.get(`/credentials/${credentialId}`);
  },

  // Update credential
  update: async (credentialId, updateData) => {
    return await api.put(`/credentials/${credentialId}`, updateData);
  },

  // Delete credential
  deleteCredential: async (credentialId) => {
    return await api.delete(`/credentials/${credentialId}`);
  },

  // Delete credential (alias)
  delete: async (credentialId) => {
    return await api.delete(`/credentials/${credentialId}`);
  },

  // Verify credential
  verifyCredential: async (credentialId) => {
    return await api.post(`/credentials/${credentialId}/verify`);
  },

  // Verify credential (alias)
  verify: async (credentialId) => {
    return await api.post(`/credentials/${credentialId}/verify`);
  },

  // Revoke credential
  revokeCredential: async (credentialId, reason) => {
    return await api.post(`/credentials/${credentialId}/revoke`, { reason });
  },

  // Revoke credential (alias)
  revoke: async (credentialId, reason) => {
    return await api.post(`/credentials/${credentialId}/revoke`, { reason });
  },

  // Share credential
  share: async (credentialId, shareData) => {
    return await api.post(`/credentials/${credentialId}/share`, shareData);
  },

  // PUBLIC VERIFICATION (No authentication required)
  // Verify credential by hash without login
  verifyByHash: async (credentialHash) => {
    return await api.post('/credentials/public/verify-hash', { credentialHash });
  },
};

export default credentialService;
