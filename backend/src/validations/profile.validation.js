const { Joi, Segments } = require('celebrate');

const updateProfile = {
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string(),
    bio: Joi.string().max(500).allow(''),
    institution_id: Joi.number().integer(),
    skills: Joi.array().items(Joi.number().integer()),
    domains: Joi.array().items(Joi.number().integer()),
    goals: Joi.array().items(Joi.number().integer()),
    onboarding_completed: Joi.boolean(),
  }),
};

const uploadAvatar = {
  // Multer handles the file, but we can validate other fields if needed
};

module.exports = {
  updateProfile,
  uploadAvatar,
};
