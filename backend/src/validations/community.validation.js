const { Joi, Segments } = require('celebrate');

const createPost = {
  [Segments.BODY]: Joi.object().keys({
    type: Joi.string().valid('Question', 'Thought', 'question', 'thought').required(),
    title: Joi.string().optional().max(200).allow('', null),
    content: Joi.string().required().min(10),
    tags: Joi.array().items(Joi.string()).optional().default([]),
    group_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().pattern(/^[0-9]+$/)).optional().allow(null),
  }),
};

const votePost = {
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required(),
  }),
  [Segments.BODY]: Joi.object().keys({
    value: Joi.number().valid(1, -1, 0).required(),
  }),
};

const reactPost = {
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required(),
  }),
  [Segments.BODY]: Joi.object().keys({
    reaction_type: Joi.string().valid('insightful', 'support', 'curious', 'celebrate', 'love').required(),
  }),
};

const addComment = {
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required(),
  }),
  [Segments.BODY]: Joi.object().keys({
    content: Joi.string().required().min(1).max(2000),
  }),
};

module.exports = {
  createPost,
  votePost,
  reactPost,
  addComment,
};
