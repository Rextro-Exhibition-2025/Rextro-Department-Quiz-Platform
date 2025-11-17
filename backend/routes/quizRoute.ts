import { Router } from "express";
import { checkQuizzesPublishedStatus, getLeaderBoard, getQuizWithQuestions, publishAllQuizzes, submitQuiz, unpublishAllQuizzes } from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminAuthMiddleware.js";


const QuizRouter = Router();



QuizRouter.route("/submit-quiz")
  .post( protect , submitQuiz);

QuizRouter.route("/get-leaderboard")
  .get(getLeaderBoard);


QuizRouter.route("/check-quiz-published-status")
.get(checkQuizzesPublishedStatus);


QuizRouter.route("/publish-all-quizzes")
.post(adminOnly, publishAllQuizzes);

QuizRouter.route("/unpublish-all-quizzes")
.post(adminOnly, unpublishAllQuizzes);



QuizRouter.route("/:quizId")
  .get(getQuizWithQuestions);

export default QuizRouter;

