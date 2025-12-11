import { Router } from "express";
import { openAttempt, submitAttempt, getAttemptsForQuiz } from "../controllers/attemptController.js";
import { protect } from "../middleware/authMiddleware.js";

const AttemptRouter = Router();
AttemptRouter.post("/open", protect, openAttempt);
AttemptRouter.post("/submit", protect, submitAttempt);
AttemptRouter.get("/quiz/:quizId", protect, getAttemptsForQuiz);

export default AttemptRouter;
