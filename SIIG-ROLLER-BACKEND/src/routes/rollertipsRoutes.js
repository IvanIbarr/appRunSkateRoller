const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const rollertipsController = require('../controllers/rollertipsController');
const {optionalAuth, authenticateToken} = require('../middleware/authMiddleware');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'rollertips');
fs.mkdirSync(uploadsDir, {recursive: true});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
    const safeName = `rollertip-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/quicktime'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Usa MP4 o MOV.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {fileSize: 1024 * 1024 * 1024}, // 1 GB
});

router.post('/', optionalAuth, upload.single('video'), rollertipsController.createRollerTip);
router.get('/', rollertipsController.listRollerTips);
router.get('/user/:userId', optionalAuth, rollertipsController.listRollerTipsByUser);
router.get(
  '/creators/:userId',
  rollertipsController.getCreatorPublicProfile,
);
router.post('/:id/reactions', optionalAuth, rollertipsController.addReaction);
router.post('/:id/comments', optionalAuth, rollertipsController.addComment);
router.post('/:id/comments/:commentId/reactions', optionalAuth, rollertipsController.addCommentReaction);
router.delete('/:id/comments/:commentId', authenticateToken, rollertipsController.deleteComment);
router.delete('/:id', authenticateToken, rollertipsController.deleteRollerTip);

module.exports = router;
