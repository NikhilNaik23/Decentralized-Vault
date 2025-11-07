const vaultService = require('../services/vaultService');
const ipfsService = require('../services/ipfsService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Store credential in decentralized mode (IPFS)
 * @route   POST /api/storage/decentralized
 * @access  Private
 */
exports.storeDecentralized = asyncHandler(async (req, res) => {
    const { type, subject, issuerDID, expirationDate, metadata } = req.body;

    // Map request fields to service layer fields
    const credentialData = {
        credentialType: type,
        credentialSubject: subject,
        issuerDID: issuerDID,
        expirationDate: expirationDate,
        metadata: metadata || {}
    };

    const credential = await vaultService.storeCredentialDecentralized(
        req.userId,
        credentialData
    );

    res.status(201).json({
        success: true,
        message: 'Credential stored in decentralized mode (IPFS)',
        data: {
            credential,
        },
    });
});

/**
 * @desc    Retrieve credential from IPFS
 * @route   GET /api/storage/decentralized/:id
 * @access  Private
 */
exports.retrieveFromIPFS = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const credential = await vaultService.retrieveCredentialFromIPFS(
        req.userId,
        id
    );

    res.status(200).json({
        success: true,
        message: 'Credential retrieved from IPFS',
        data: {
            credential,
        },
    });
});

/**
 * @desc    Get storage statistics
 * @route   GET /api/storage/stats
 * @access  Private
 */
exports.getStorageStats = asyncHandler(async (req, res) => {
    const stats = await vaultService.getStorageStats(req.userId);

    res.status(200).json({
        success: true,
        data: {
            stats,
        },
    });
});

/**
 * @desc    Get IPFS service status
 * @route   GET /api/storage/ipfs/status
 * @access  Public
 */
exports.getIPFSStatus = asyncHandler(async (req, res) => {
    const status = await ipfsService.getStatus();

    res.status(200).json({
        success: true,
        data: {
            ipfs: status,
        },
    });
});

/**
 * @desc    Get credential from IPFS gateway (public access)
 * @route   GET /api/storage/ipfs/:cid
 * @access  Public
 */
exports.getFromIPFSGateway = asyncHandler(async (req, res) => {
    const { cid } = req.params;

    const gatewayUrl = ipfsService.getGatewayUrl(cid);

    res.status(200).json({
        success: true,
        message: 'IPFS gateway URL generated',
        data: {
            cid,
            gatewayUrl,
            note: 'Use this URL to access the encrypted credential data. Decryption requires vault key.'
        },
    });
});
