const express = require('express');
const router = express.Router();
const connectionsController = require('../controllers/connections.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// All connections routes require authentication
router.use(verifyAuth);

// @route   POST /api/v1/connections/request
// @desc    Send a connection request to another researcher
// @access  Private
router.post('/request', connectionsController.sendRequest);

// @route   GET /api/v1/connections
// @desc    List accepted connections for the current user
// @access  Private
router.get('/', connectionsController.listConnections);

// @route   GET /api/v1/connections/pending
// @desc    List pending incoming connection requests
// @access  Private
router.get('/pending', connectionsController.listPending);

// @route   POST /api/v1/connections/:id/respond
// @desc    Accept or reject a pending connection request
// @access  Private
router.post('/:id/respond', connectionsController.respond);

// @route   DELETE /api/v1/connections/:id
// @desc    Remove/disconnect from a researcher
// @access  Private
router.delete('/:id', connectionsController.remove);

// @route   GET /api/v1/connections/status/:recipientId
// @desc    Check connection status with a specific user (for button state)
// @access  Private
router.get('/status/:recipientId', connectionsController.getStatus);

module.exports = router;
