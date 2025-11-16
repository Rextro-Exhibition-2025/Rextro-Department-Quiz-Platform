import express from 'express';
import { getMe, getMemberOfSchoolTeam, loginMember, logoutMember, updateStateOfMember } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginMember);
router.get('/logout', protect, logoutMember);
router.get('/me', protect, getMe);
router.put('/update-state', protect, updateStateOfMember);
router.get('/school-member', getMemberOfSchoolTeam); // Alias for /me

export default router;