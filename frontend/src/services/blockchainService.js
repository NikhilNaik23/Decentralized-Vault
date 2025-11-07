import api from './api';

const blockchainService = {
  // Get blockchain statistics
  getStats: async () => {
    return await api.get('/blockchain/stats');
  },

  // Get all blocks
  getBlocks: async () => {
    return await api.get('/blockchain/blocks');
  },

  // Get a specific block
  getBlock: async (index) => {
    return await api.get(`/blockchain/block/${index}`);
  },

  // Get latest block
  getLatestBlock: async () => {
    return await api.get('/blockchain/latest');
  },

  // Validate blockchain
  validate: async () => {
    return await api.get('/blockchain/validate');
  },
};

export default blockchainService;
