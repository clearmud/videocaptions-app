import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.js';
import * as videoController from '../controllers/videoController.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2000 * 1024 * 1024, // 2GB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, MOV, and MKV are allowed.'));
    }
  },
});

router.post('/generate-captions', authenticate, upload.single('video'), videoController.generateCaptions);

router.get('/history', authenticate, videoController.getVideoHistory);

router.get('/transactions', authenticate, videoController.getTransactionHistory);

export default router;
