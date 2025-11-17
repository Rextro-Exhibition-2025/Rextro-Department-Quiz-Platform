import { Router } from "express";
import { openAttempt, submitAttempt } from "../controllers/attemptController.js";
import { protect } from "../middleware/authMiddleware.js";

const AttemptRouter = Router();

// Protected endpoints for recording opens and submits
AttemptRouter.post("/open", protect, openAttempt);
AttemptRouter.post("/submit", protect, submitAttempt);

export default AttemptRouter;
