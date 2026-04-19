const { Joi, Segments } = require('celebrate');

const createGroup = {
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10),
    focus_area: Joi.string().required(),
    type: Joi.string().valid('public', 'private').default('public'),
  }),
};

const joinGroup = {
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

module.exports = {
  createGroup,
  joinGroup,
};
