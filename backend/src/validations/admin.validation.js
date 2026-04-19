const { Joi, Segments } = require('celebrate');

const invite = {
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().required().min(2),
    email: Joi.string().required().email(),
  }),
};

module.exports = {
  invite,
};
