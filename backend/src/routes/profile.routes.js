const express = require('express');
const { celebrate } = require('celebrate');
const multer = require('multer');
const profileController = require('../controllers/profile.controller');
const profileValidation = require('../validations/profile.validation');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Setup multer for memory storage (we upload buffer to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(verifyAuth);

// ── Specific /me/* routes MUST be defined before /:id ────────────────────────

// Credential Dashboard: append-only profile change history
router.get('/me/audit-log', profileController.getAuditLog);

// Credential Dashboard: achievement / badge catalogue with current progress
router.get('/me/achievements', profileController.getAchievements);

// Own profile (GET)
router.get('/me', profileController.getProfile);

// Any other profile by ID (GET)
router.get('/:id', profileController.getProfile);

// Update own profile (PUT)
router.put(
  '/me',
  celebrate(profileValidation.updateProfile),
  profileController.updateProfile
);

// Upload avatar (POST)
router.post(
  '/avatar',
  upload.single('avatar'),
  profileController.uploadAvatar
);

module.exports = router;
