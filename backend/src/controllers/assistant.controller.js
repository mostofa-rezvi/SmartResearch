const assistantService = require('../services/assistant.service');
const { envelope } = require('../utils/responseEnvelope');

class AssistantController {
  async chat(req, res, next) {
    try {
      const result = await assistantService.chat(
        req.user.id, req.body.query, req.body.session_id || null
      );
      res.json(envelope(result, { degraded: result.degraded === true }));
    } catch (err) {
      next(err);
    }
  }

  async listSessions(req, res, next) {
    try {
      const sessions = await assistantService.listSessions(req.user.id);
      res.json(envelope(sessions));
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req, res, next) {
    try {
      const messages = await assistantService.getMessages(req.user.id, req.params.id);
      res.json(envelope(messages));
    } catch (err) {
      next(err);
    }
  }

  async deleteSession(req, res, next) {
    try {
      const result = await assistantService.deleteSession(req.user.id, req.params.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async summarize(req, res, next) {
    try {
      const result = await assistantService.summarize(req.user.id, req.body);
      res.json(envelope(result, { degraded: result.degraded === true }));
    } catch (err) {
      next(err);
    }
  }

  async paperQa(req, res, next) {
    try {
      const result = await assistantService.paperQa(
        req.user.id, req.body.item_id, req.body.question
      );
      res.json(envelope(result, { degraded: result.degraded === true }));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AssistantController();
