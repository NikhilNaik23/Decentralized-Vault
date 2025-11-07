const blockchainService = require("../services/blockchainService");
const logger = require("../utils/logger");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Get blockchain statistics
 * @route   GET /api/blockchain/stats
 * @access  Public
 */
exports.getBlockchainStats = asyncHandler(async (req, res) => {
  const stats = blockchainService.getBlockchainStats();

  res.status(200).json({
    success: true,
    data: {
      stats,
    },
  });
});

/**
 * @desc    Get all blocks
 * @route   GET /api/blockchain/blocks
 * @access  Public
 */
exports.getAllBlocks = asyncHandler(async (req, res) => {
  const blocks = blockchainService.getAllBlocks();

  res.status(200).json({
    success: true,
    data: {
      blocks,
      count: blocks.length,
    },
  });
});

/**
 * @desc    Get block by index
 * @route   GET /api/blockchain/blocks/:index
 * @access  Public
 */
exports.getBlock = asyncHandler(async (req, res) => {
  const { index } = req.params;
  const block = blockchainService.getBlock(parseInt(index));

  res.status(200).json({
    success: true,
    data: {
      block,
    },
  });
});

/**
 * @desc    Validate blockchain
 * @route   GET /api/blockchain/validate
 * @access  Public
 */
exports.validateBlockchain = asyncHandler(async (req, res) => {
  const isValid = blockchainService.validateChain();

  res.status(200).json({
    success: true,
    data: {
      isValid,
      message: isValid ? "Blockchain is valid" : "Blockchain is corrupted",
    },
  });
});

/**
 * @desc    Export blockchain
 * @route   GET /api/blockchain/export
 * @access  Private (Admin only - add role check if needed)
 */
exports.exportBlockchain = asyncHandler(async (req, res) => {
  const exportData = blockchainService.exportBlockchain();

  res.status(200).json({
    success: true,
    data: exportData,
  });
});

/**
 * @desc    Get blocks by DID
 * @route   GET /api/blockchain/did/:did
 * @access  Public
 */
exports.getBlocksByDID = asyncHandler(async (req, res) => {
  const { did } = req.params;
  const blocks = await blockchainService.getBlocksByDID(did);

  res.status(200).json({
    success: true,
    data: blocks,
  });
});

/**
 * @desc    Get Ethereum network info (if enabled)
 * @route   GET /api/blockchain/ethereum
 * @access  Public
 */
exports.getEthereumInfo = asyncHandler(async (req, res) => {
  if (!blockchainService.isEthereumEnabled()) {
    return res.status(200).json({
      success: true,
      message: "Ethereum integration is not enabled",
      data: {
        enabled: false,
      },
    });
  }

  const networkInfo = await blockchainService.getEthereumNetworkInfo();
  const contractAddress = blockchainService.getContractAddress();

  res.status(200).json({
    success: true,
    data: {
      enabled: true,
      networkInfo,
      contractAddress,
    },
  });
});
