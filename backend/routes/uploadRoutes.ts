import express from 'express';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
// Temporarily removed admin auth - TODO: implement proper Google OAuth verification
// import { adminOnly } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Upload image (TODO: add proper authentication)
router.post('/upload', uploadImage);

// Delete image (TODO: add proper authentication)
router.delete('/delete', deleteImage);

export default router;
