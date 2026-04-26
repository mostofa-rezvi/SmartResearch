const express = require('express');
const { celebrate } = require('celebrate');
const multer = require('multer');
const profileController = require('../controllers/profile.controller');
const profileValidation = require('../validations/profile.validation');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Setup multer for memory storage (we upload buffer to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(protect);

router.get('/me', profileController.getProfile);
router.get('/:id', profileController.getProfile);

router.put(
  '/me',
  celebrate(profileValidation.updateProfile),
  profileController.updateProfile
);

router.post(
  '/avatar',
  upload.single('avatar'),
  profileController.uploadAvatar
);

module.exports = router;
