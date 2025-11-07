import api from './api';

const vaultService = {
  // Get vault statistics
  getStats: async () => {
    return await api.get('/vault/stats');
  },

  // Export vault data
  exportData: async () => {
    return await api.get('/vault/export');
  },

  // Get connected/authorized apps
  getConnectedApps: async () => {
    return await api.get('/oauth/connected-apps');
  },

  // Revoke app access
  revokeApp: async (appId) => {
    return await api.post(`/oauth/connected-apps/${appId}/revoke`);
  },
};

export default vaultService;
