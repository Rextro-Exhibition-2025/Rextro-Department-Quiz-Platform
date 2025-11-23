import { Router } from "express";
import { openAttempt, submitAttempt, getAttemptsForQuiz } from "../controllers/attemptController.js";
import { protect } from "../middleware/authMiddleware.js";

const AttemptRouter = Router();

// Protected endpoints for recording opens and submits
AttemptRouter.post("/open", protect, openAttempt);
AttemptRouter.post("/submit", protect, submitAttempt);
// Return attempts for the current user for a specific quiz
AttemptRouter.get("/quiz/:quizId", protect, getAttemptsForQuiz);

export default AttemptRouter;
