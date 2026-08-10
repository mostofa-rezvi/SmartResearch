const { Joi, Segments } = require('celebrate');

const chat = {
  [Segments.BODY]: Joi.object().keys({
    query: Joi.string().required().min(1),
    session_id: Joi.number().integer().optional().allow(null),
  }),
};

const summarize = {
  [Segments.BODY]: Joi.object().keys({
    scope: Joi.string().valid('my_library', 'all', 'journal', 'ids').required(),
    journal: Joi.string().optional().allow('', null),
    ids: Joi.array().items(Joi.number().integer()).optional(),
  }),
};

const paperQa = {
  [Segments.BODY]: Joi.object().keys({
    item_id: Joi.number().integer().required(),
    question: Joi.string().required().min(1),
  }),
};

module.exports = {
  chat,
  summarize,
  paperQa,
};
