const { Joi, Segments } = require('celebrate');

const search = {
  [Segments.QUERY]: Joi.object().keys({
    query: Joi.string().required().min(2),
  }),
};

const savePaper = {
  [Segments.BODY]: Joi.object().keys({
    title: Joi.string().required(),
    doi: Joi.string().required(),
    journal: Joi.string().required(),
  }),
};

module.exports = {
  search,
  savePaper,
};
