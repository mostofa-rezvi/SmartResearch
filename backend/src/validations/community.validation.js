const { Joi, Segments } = require('celebrate');

const createPost = {
  [Segments.BODY]: Joi.object().keys({
    type: Joi.string().valid('Question', 'Thought').required(),
    title: Joi.string().required().min(5).max(200),
    content: Joi.string().required().min(10),
    tags: Joi.array().items(Joi.string()),
    group_id: Joi.number().optional().allow(null),
  }),
};

const votePost = {
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required(),
  }),
  [Segments.BODY]: Joi.object().keys({
    value: Joi.number().valid(1, -1).required(),
  }),
};

module.exports = {
  createPost,
  votePost,
};
