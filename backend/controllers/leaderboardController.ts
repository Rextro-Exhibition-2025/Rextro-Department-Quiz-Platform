import type { Request, Response } from "express";
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";


export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const quizIdRaw = req.query.quizId as string | undefined;
    if (!quizIdRaw) return res.status(400).json({ message: "Missing quizId query parameter" });
    const quizId = Number(quizIdRaw);
    if (Number.isNaN(quizId)) return res.status(400).json({ message: "Invalid quizId" });

    const limitRaw = req.query.limit as string | undefined;
    const limit = limitRaw ? Math.max(1, Math.min(200, Number(limitRaw))) : 50;

    const pipeline: any[] = [
      
      { $match: { quizId: quizId, submitTime: { $exists: true } } },
      {
        
        $group: {
          _id: "$student",
          correctCount: { $sum: { $cond: ["$isCorrect", 1, 0] } },
          
          completionTime: { $max: "$submitTime" },
          
          totalTimeTaken: { $sum: { $ifNull: ["$timeTaken", 0] } },
          attempts: { $sum: 1 }
        }
      },
      {
        
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
      
      
      
      
      
      { $sort: { correctCount: -1, completionTime: 1, totalTimeTaken: 1, attempts: 1 } },
      { $limit: limit }
    ];

    
    const totalQuestions = await Question.countDocuments({ quizId: quizId }).exec();

    const results = await Attempt.aggregate(pipeline).exec();

    
    const enriched = results.map((r: any) => {
      const correct = Number(r.correctCount) || 0;
      const pct = totalQuestions ? Math.round((correct / totalQuestions) * 10000) / 100 : 0;
      return { ...r, totalQuestions, correctPercentage: pct };
    });

    return res.status(200).json({ data: enriched });
  } catch (err: any) {
    console.error("getLeaderboard error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default { getLeaderboard };
