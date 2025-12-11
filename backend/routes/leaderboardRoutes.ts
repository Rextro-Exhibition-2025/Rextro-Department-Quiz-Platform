import express from "express";
import leaderboardController from "../controllers/leaderboardController.js";

const router = express.Router();

// Public leaderboard for a quiz
router.get("/", leaderboardController.getLeaderboard);

export default router;
