const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const router = express.Router();
const chatController = require('../controllers/chatController');
const {authenticateToken} = require('../middleware/authMiddleware');

const chatUploadsDir = path.join(__dirname, '..', '..', 'uploads', 'chat');
fs.mkdirSync(chatUploadsDir, {recursive: true});

const allowedMime = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext =
      path.extname(file.originalname) ||
      (file.mimetype && file.mimetype.startsWith('video') ? '.mp4' : '.jpg');
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 80 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    if (allowedMime.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Usa imagen (JPEG, PNG, WebP) o video (MP4, MOV, WebM).'));
    }
  },
});

// Importante: /upload antes de /:chatType para no capturar "upload" como tipo
router.post('/upload', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg =
        err.message ||
        (err.code === 'LIMIT_FILE_SIZE' ? 'El archivo es demasiado grande (máx. 80 MB)' : 'Error al subir');
      return res.status(400).json({success: false, error: msg});
    }
    chatController.uploadChatMedia(req, res);
  });
});
router.get('/:chatType', authenticateToken, chatController.getMessages);
router.post('/', authenticateToken, chatController.createMessage);

module.exports = router;
