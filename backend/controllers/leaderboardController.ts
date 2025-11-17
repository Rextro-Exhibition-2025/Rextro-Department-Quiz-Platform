import type { Request, Response } from "express";
import Attempt from "../models/Attempt.js";

// GET /api/leaderboard?quizId=1&limit=50
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const quizIdRaw = req.query.quizId as string | undefined;
    if (!quizIdRaw) return res.status(400).json({ message: "Missing quizId query parameter" });
    const quizId = Number(quizIdRaw);
    if (Number.isNaN(quizId)) return res.status(400).json({ message: "Invalid quizId" });

    const limitRaw = req.query.limit as string | undefined;
    const limit = limitRaw ? Math.max(1, Math.min(200, Number(limitRaw))) : 50;

    const pipeline: any[] = [
      // include only submitted attempts for the specified quiz
      { $match: { quizId: quizId, submitTime: { $exists: true } } },
      {
        // group by student (ObjectId reference)
        $group: {
          _id: "$student",
          correctCount: { $sum: { $cond: ["$isCorrect", 1, 0] } },
          // when the user finished the quiz (completion time)
          completionTime: { $max: "$submitTime" },
          // sum the timeTaken across all attempts (used for tiebreaking)
          totalTimeTaken: { $sum: { $ifNull: ["$timeTaken", 0] } },
          attempts: { $sum: 1 }
        }
      },
      {
        // join user details for display (name, studentId)
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          studentRef: "$_id",
          studentId: { $ifNull: ["$user.studentId", "$_id"] },
          name: { $ifNull: ["$user.name", null] },
          correctCount: 1,
          completionTime: 1,
          totalTimeTaken: 1,
          attempts: 1
        }
      },
      // Sort per requested rules:
      // 1) correctCount desc (more correct answers = better)
      // 2) completionTime asc (earlier completion = better)
      // 3) totalTimeTaken asc (less total time spent = better)
      // 4) attempts asc (fewer attempts = better)
      { $sort: { correctCount: -1, completionTime: 1, totalTimeTaken: 1, attempts: 1 } },
      { $limit: limit }
    ];

    const results = await Attempt.aggregate(pipeline).exec();

    return res.status(200).json({ data: results });
  } catch (err: any) {
    console.error("getLeaderboard error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default { getLeaderboard };
