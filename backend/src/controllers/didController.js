const didService = require('../services/didService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Create a new DID
 * @route   POST /api/did
 * @access  Private
 */
exports.createDID = asyncHandler(async (req, res) => {
    const { method } = req.body;

    const didDocument = await didService.createDID(req.userId, method);

    res.status(201).json({
        success: true,
        message: 'DID created successfully',
        data: {
            did: didDocument,
        },
    });
});

/**
 * @desc    Get DID document
 * @route   GET /api/did/:did
 * @access  Public
 */
exports.getDID = asyncHandler(async (req, res) => {
    const { did } = req.params;

    const didData = await didService.getDID(did);

    res.status(200).json({
        success: true,
        data: {
            did: didData,
        },
    });
});

/**
 * @desc    Resolve DID (get full document with metadata)
 * @route   GET /api/did/:did/resolve
 * @access  Public
 */
exports.resolveDID = asyncHandler(async (req, res) => {
    const { did } = req.params;

    const resolvedDID = await didService.resolveDID(did);

    res.status(200).json({
        success: true,
        data: resolvedDID,
    });
});

/**
 * @desc    Get user's DIDs
 * @route   GET /api/did/user/me
 * @access  Private
 */
exports.getMyDIDs = asyncHandler(async (req, res) => {
    const dids = await didService.listUserDIDs(req.userId);

    res.status(200).json({
        success: true,
        data: {
            dids,
            count: dids.length,
        },
    });
});

/**
 * @desc    Update DID document
 * @route   PUT /api/did/:did
 * @access  Private
 */
exports.updateDID = asyncHandler(async (req, res) => {
    const { did } = req.params;
    const updates = req.body;

    // Verify ownership
    const isOwner = await didService.verifyDIDOwnership(did, req.userId);
    if (!isOwner) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to update this DID',
        });
    }

    const updatedDID = await didService.updateDIDDocument(did, updates);

    res.status(200).json({
        success: true,
        message: 'DID updated successfully',
        data: {
            did: updatedDID,
        },
    });
});

/**
 * @desc    Add service endpoint to DID
 * @route   POST /api/did/:did/service
 * @access  Private
 */
exports.addServiceEndpoint = asyncHandler(async (req, res) => {
    const { did } = req.params;
    const { id, type, endpoint } = req.body;

    // Verify ownership
    const isOwner = await didService.verifyDIDOwnership(did, req.userId);
    if (!isOwner) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to modify this DID',
        });
    }

    const updatedDID = await didService.addServiceEndpoint(did, id, type, endpoint);

    res.status(200).json({
        success: true,
        message: 'Service endpoint added successfully',
        data: {
            did: updatedDID,
        },
    });
});

/**
 * @desc    Remove service endpoint from DID
 * @route   DELETE /api/did/:did/service
 * @access  Private
 */
exports.removeServiceEndpoint = asyncHandler(async (req, res) => {
    const { did } = req.params;
    const { serviceId } = req.body;

    // Verify ownership
    const isOwner = await didService.verifyDIDOwnership(did, req.userId);
    if (!isOwner) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to modify this DID',
        });
    }

    await didService.removeServiceEndpoint(did, serviceId);

    res.status(200).json({
        success: true,
        message: 'Service endpoint removed successfully',
    });
});

/**
 * @desc    Deactivate DID
 * @route   DELETE /api/did/:did
 * @access  Private
 */
exports.deactivateDID = asyncHandler(async (req, res) => {
    const { did } = req.params;

    // Verify ownership
    const isOwner = await didService.verifyDIDOwnership(did, req.userId);
    if (!isOwner) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to deactivate this DID',
        });
    }

    await didService.deactivateDID(did);

    res.status(200).json({
        success: true,
        message: 'DID deactivated successfully',
    });
});

/**
 * @desc    Reactivate DID
 * @route   POST /api/did/:did/reactivate
 * @access  Private
 */
exports.reactivateDID = asyncHandler(async (req, res) => {
    const { did } = req.params;

    // Verify ownership
    const isOwner = await didService.verifyDIDOwnership(did, req.userId);
    if (!isOwner) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to reactivate this DID',
        });
    }

    const reactivatedDID = await didService.reactivateDID(did);

    res.status(200).json({
        success: true,
        message: 'DID reactivated successfully',
        data: {
            did: reactivatedDID,
        },
    });
});