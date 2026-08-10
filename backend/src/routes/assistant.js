const express = require('express');
const { celebrate } = require('celebrate');
const assistantController = require('../controllers/assistant.controller');
const assistantValidation = require('../validations/assistant.validation');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   POST /api/v1/assistant/chat
// @desc    Agentic RAG chat — create/find session, proxy ML, persist turns
router.post('/chat',
  [verifyAuth, celebrate(assistantValidation.chat)],
  assistantController.chat
);

// @route   GET /api/v1/assistant/sessions
// @desc    List the caller's chat sessions
router.get('/sessions',
  [verifyAuth],
  assistantController.listSessions
);

// @route   GET /api/v1/assistant/sessions/:id/messages
// @desc    Messages for a session the caller owns (403 otherwise)
router.get('/sessions/:id/messages',
  [verifyAuth],
  assistantController.getMessages
);

// @route   DELETE /api/v1/assistant/sessions/:id
// @desc    Delete the caller's session (messages cascade)
router.delete('/sessions/:id',
  [verifyAuth],
  assistantController.deleteSession
);

// @route   POST /api/v1/assistant/summarize
// @desc    Volume summary over a scope of library items
router.post('/summarize',
  [verifyAuth, celebrate(assistantValidation.summarize)],
  assistantController.summarize
);

// @route   POST /api/v1/assistant/paper-qa
// @desc    Question-answering grounded in a single library item
router.post('/paper-qa',
  [verifyAuth, celebrate(assistantValidation.paperQa)],
  assistantController.paperQa
);

module.exports = router;
