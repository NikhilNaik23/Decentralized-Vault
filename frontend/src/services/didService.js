import api from './api';

const didService = {
  // Create a new DID
  create: async (didData) => {
    return await api.post('/did', didData);
  },

  // Get all user's DIDs
  getAll: async () => {
    return await api.get('/did');
  },

  // Get a specific DID
  getDID: async (didId) => {
    return await api.get(`/did/${didId}`);
  },

  // Get a specific DID (alias)
  getById: async (didId) => {
    return await api.get(`/did/${didId}`);
  },

  // Resolve a DID
  resolve: async (did) => {
    return await api.get(`/did/resolve/${encodeURIComponent(did)}`);
  },

  // Update DID
  update: async (didId, updateData) => {
    return await api.put(`/did/${didId}`, updateData);
  },

  // Add service endpoint to DID
  addService: async (didId, serviceData) => {
    return await api.post(`/did/${didId}/service`, serviceData);
  },

  // Remove service endpoint from DID
  removeService: async (didId, serviceId) => {
    return await api.delete(`/did/${didId}/service/${serviceId}`);
  },

  // Deactivate DID
  deactivateDID: async (didId) => {
    return await api.post(`/did/${didId}/deactivate`);
  },

  // Deactivate DID (alias)
  deactivate: async (didId) => {
    return await api.post(`/did/${didId}/deactivate`);
  },

  // Reactivate DID
  reactivateDID: async (didId) => {
    return await api.post(`/did/${didId}/reactivate`);
  },

  // Reactivate DID (alias)
  reactivate: async (didId) => {
    return await api.post(`/did/${didId}/reactivate`);
  },
};

export default didService;
