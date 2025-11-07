const vaultService = require("../services/vaultService");
const logger = require("../utils/logger");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Create a new credential
 * @route   POST /api/credentials
 * @access  Private
 */
exports.createCredential = asyncHandler(async (req, res) => {
  // Debug: Log the RAW request body first
  logger.info(`🔍 RAW REQUEST BODY:`, req.body);
  logger.info(`🔍 REQUEST BODY KEYS:`, Object.keys(req.body));
  
  const { type, subject, issuerDID, issueDate, expirationDate, metadata } =
    req.body;
  
  logger.info(`🔍 IssueDate value:`, issueDate);
  logger.info(`🔍 IssueDate type:`, typeof issueDate);

  // Debug: Log what we extracted from frontend
  logger.info(`📥 Extracted fields:`, {
    type,
    hasSubject: !!subject,
    issuerDID,
    issueDate: issueDate || "NOT PROVIDED ❌",
    expirationDate: expirationDate || "NOT PROVIDED ❌",
  });

  // Map request fields to service layer fields
  const credentialData = {
    credentialType: type,
    credentialSubject: subject,
    issuerDID: issuerDID,
    issuanceDate: issueDate,
    expirationDate: expirationDate,
    metadata: metadata || {},
  };

  const credential = await vaultService.storeCredential(
    req.userId,
    credentialData
  );

  res.status(201).json({
    success: true,
    message: "Credential created successfully",
    data: {
      credential,
    },
  });
});

/**
 * @desc    Get all credentials for user
 * @route   GET /api/credentials
 * @access  Private
 */
exports.getCredentials = asyncHandler(async (req, res) => {
  const { credentialType, status, page, limit } = req.query;

  const filters = {};
  if (credentialType) filters.credentialType = credentialType;
  if (status) filters.status = status;

  const credentials = await vaultService.listCredentials(req.userId, filters);

  res.status(200).json({
    success: true,
    data: {
      credentials,
      count: credentials.length,
    },
  });
});

/**
 * @desc    Get credential by ID
 * @route   GET /api/credentials/:id
 * @access  Private
 */
exports.getCredential = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decrypt } = req.query;

  const credential = await vaultService.retrieveCredential(
    req.userId,
    id,
    decrypt === "true"
  );

  res.status(200).json({
    success: true,
    data: {
      credential,
    },
  });
});

/**
 * @desc    Update credential
 * @route   PUT /api/credentials/:id
 * @access  Private
 */
exports.updateCredential = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const credential = await vaultService.updateCredential(
    req.userId,
    id,
    updates
  );

  res.status(200).json({
    success: true,
    message: "Credential updated successfully",
    data: {
      credential,
    },
  });
});

/**
 * @desc    Delete credential
 * @route   DELETE /api/credentials/:id
 * @access  Private
 */
exports.deleteCredential = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await vaultService.deleteCredential(req.userId, id);

  res.status(200).json({
    success: true,
    message: "Credential deleted successfully",
  });
});

/**
 * @desc    Revoke credential
 * @route   POST /api/credentials/:id/revoke
 * @access  Private
 */
exports.revokeCredential = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const credential = await vaultService.revokeCredential(
    req.userId,
    id,
    reason
  );

  res.status(200).json({
    success: true,
    message: "Credential revoked successfully",
    data: {
      credential,
    },
  });
});

/**
 * @desc    Verify credential
 * @route   POST /api/credentials/:id/verify
 * @access  Public
 */
exports.verifyCredential = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const verification = await vaultService.verifyCredential(id);

  res.status(200).json({
    success: true,
    data: {
      verification,
    },
  });
});

/**
 * @desc    Verify credential by hash (PUBLIC - No Authentication Required)
 * @route   POST /api/credentials/public/verify-hash
 * @access  Public
 */
exports.verifyCredentialByHash = asyncHandler(async (req, res) => {
  const { credentialHash } = req.body;

  const blockchainService = require("../services/blockchainService");
  const Credential = require("../models/Credential");

  // Verify on blockchain (both simulated and Ethereum if enabled)
  const verification = await blockchainService.verifyCredential(credentialHash);

  // Try to find the credential to get additional metadata (non-sensitive)
  let credentialInfo = null;
  try {
    const credential = await Credential.findOne({ credentialHash });
    if (credential) {
      credentialInfo = {
        type: credential.credentialType,
        issuer: credential.issuer?.name || "Unknown",
        issuerDID: credential.issuer?.did,
        holder: credential.holder, // Who the credential was issued to
        issuanceDate: credential.issuanceDate,
        status: credential.status,
        onBlockchain: credential.onBlockchain,
      };
    }
  } catch (err) {
    // If credential not found in DB, just return blockchain verification
    logger.warn("Credential metadata not found:", err.message);
  }

  res.status(200).json({
    success: true,
    message: "Public credential verification completed",
    data: {
      credentialHash,
      verified: verification.verified,
      simulated: verification.simulated,
      ethereum: verification.ethereum,
      credential: credentialInfo,
      timestamp: new Date().toISOString(),
    },
  });
});
