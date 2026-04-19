const authService = require('../services/auth.service');
const { envelope } = require('../utils/responseEnvelope');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(envelope(user, { message: 'Registration successful' }));
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.verifyOtp(req.body.email, req.body.otp);

      // Set cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(envelope({ token: accessToken, user }));
    } catch (err) {
      next(err);
    }
  }

  async onboardingComplete(req, res, next) {
    try {
      const result = await authService.completeOnboarding(req.user.id, req.body);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
