const vaultService = require('../services/vaultService');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get vault statistics
 * @route   GET /api/vault/stats
 * @access  Private
 */
exports.getVaultStats = asyncHandler(async (req, res) => {
    const stats = await vaultService.getVaultStatistics(req.userId);

    res.status(200).json({
        success: true,
        data: {
            stats,
        },
    });
});

/**
 * @desc    Export vault data
 * @route   GET /api/vault/export
 * @access  Private
 */
exports.exportVault = asyncHandler(async (req, res) => {
    const exportData = await vaultService.exportVault(req.userId);

    res.status(200).json({
        success: true,
        message: 'Vault exported successfully',
        data: exportData,
    });
});

/**
 * @desc    Get blockchain info
 * @route   GET /api/vault/blockchain
 * @access  Private
 */
exports.getBlockchainInfo = asyncHandler(async (req, res) => {
    const stats = blockchainService.getBlockchainStats();
    const isEthereumEnabled = blockchainService.isEthereumEnabled();
    
    let ethereumInfo = null;
    if (isEthereumEnabled) {
        ethereumInfo = await blockchainService.getEthereumNetworkInfo();
    }

    res.status(200).json({
        success: true,
        data: {
            simulated: stats,
            ethereum: ethereumInfo,
            ethereumEnabled: isEthereumEnabled,
        },
    });
});