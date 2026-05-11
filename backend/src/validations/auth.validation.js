const { Joi, Segments } = require('celebrate');

const register = {
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().required().min(2),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    status: Joi.string().required(),
    institution: Joi.string().required(),
    personal_website: Joi.string().uri().allow('').optional(),
    linkedin_url: Joi.string().uri().allow('').optional(),
    google_scholar_url: Joi.string().uri().allow('').optional(),
    researchgate_url: Joi.string().uri().allow('').optional(),
  }),
};

const login = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const verifyOtp = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().required().email(),
    otp: Joi.string().required().length(6),
  }),
};

const onboardingComplete = {
  [Segments.BODY]: Joi.object().keys({
    interests: Joi.array().items(Joi.string()).min(3).required(),
    preferences: Joi.object().required(),
  }),
};

module.exports = {
  register,
  login,
  verifyOtp,
  onboardingComplete,
};
