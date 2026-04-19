const Joi = require('joi');
const ReputationService = require('../services/reputation.service');

// Joi Validation Schema
const calculateImpactSchema = Joi.object({
  standardCitations: Joi.number().integer().min(0).required(),
  highImpactCitations: Joi.number().integer().min(0).required()
});

/**
 * Thin Controller handling validation, req/res mapping, and unified error handling enveloping
 */
class ReputationController {
  
  async calculateImpact(req, res) {
    try {
      // 1. Validation Layer
      const { error, value } = calculateImpactSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { standardCitations, highImpactCitations } = value;
      const targetUserId = req.params.userId || req.user.id; // Target user or self

      // 2. Call Domain Service Layer
      const result = await ReputationService.calculateCitationImpact(targetUserId, standardCitations, highImpactCitations);

      // 3. Envelope Response according to standards
      return res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (err) {
      console.error('[ReputationController Error]', err.message);
      // Let global error middleware handle it if we had one, otherwise standard 500
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
      });
    }
  }

}

module.exports = new ReputationController();
