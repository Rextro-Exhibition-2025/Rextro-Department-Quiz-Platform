import express from 'express';
import { getMe, registerUser, linkGoogleAccount, loginUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/oauth/link', linkGoogleAccount);
router.get('/me', protect, getMe);

export default router;