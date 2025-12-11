import type { Request, Response } from "express";
import mongoose from "mongoose";
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import User from "../models/User.js";

export const openAttempt = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      console.log(
        "openAttempt: no req.user attached. Authorization header:",
        req.headers.authorization
      );
      console.log("openAttempt: cookies:", (req as any).cookies);
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const { quizId, questionId } = req.body;
    if (!quizId || !questionId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "quizId and questionId are required",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid questionId" });
    }

    const question = await Question.findById(questionId).lean();
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    let attempt = await Attempt.findOne({
      student: studentId,
      quizId,
      question: questionId,
    });

    // If attempt exists and was correct, return it (don't reopen)
    if (attempt && attempt.isCorrect) {
      return res.status(200).json({ success: true, data: attempt });
    }

    // If attempt exists but was incorrect (TRY_AGAIN), we can update openTime or just return it
    if (attempt && attempt.openTime) {
      // Optional: Update openTime for the retry if you want to track duration of the *new* attempt
      attempt.openTime = new Date();
      await attempt.save();
      return res.status(200).json({ success: true, data: attempt });
    }

    if (!attempt) {
      const user = await User.findById(studentId).lean();
      const studentSchoolId = user?.studentId;

      attempt = new Attempt({
        student: studentId,
        studentId: studentSchoolId,
        quizId,
        question: questionId,
        openTime: new Date(),
      });
      await attempt.save();
      return res.status(201).json({ success: true, data: attempt });
    }

    attempt.openTime = new Date();
    await attempt.save();
    return res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    console.error("Error in openAttempt:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error opening attempt",
        error: error instanceof Error ? error.message : String(error),
      });
  }
};

export const submitAttempt = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const { quizId, questionId, answer } = req.body;
    if (!quizId || !questionId || typeof answer === "undefined") {
      return res
        .status(400)
        .json({
          success: false,
          message: "quizId, questionId and answer are required",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid questionId" });
    }

    const question = await Question.findById(questionId).lean();
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    const normalizedAnswer = String(answer).trim().toUpperCase();
    const correctOption = String(question.correctOption).toUpperCase();
    const isCorrect = normalizedAnswer === correctOption;

    let attempt = await Attempt.findOne({
      student: studentId,
      quizId,
      question: questionId,
    });
    if (!attempt) {
      const user = await User.findById(studentId).lean();
      const studentSchoolId = user?.studentId;
      attempt = new Attempt({
        student: studentId,
        studentId: studentSchoolId,
        quizId,
        question: questionId,
      });
    }

    // --- MODIFIED LOGIC START ---
    // Only block submission if they have ALREADY answered it correctly.
    // If they answered incorrectly before, allow them to overwrite/retry.
    if (attempt.submitTime && attempt.isCorrect) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Already answered correctly",
          data: attempt,
        });
    }
    // --- MODIFIED LOGIC END ---

    const submitTime = new Date();
    attempt.submitTime = submitTime;
    attempt.answer = String(answer);
    attempt.isCorrect = isCorrect;

    // Recalculate time taken based on the most recent openTime
    if (attempt.openTime) {
      const timeTakenSeconds = Math.max(
        0,
        Math.round(
          (submitTime.getTime() - new Date(attempt.openTime).getTime()) / 1000
        )
      );
      attempt.timeTaken = timeTakenSeconds;
    }

    await attempt.save();

    return res.status(200).json({ success: true, data: attempt, isCorrect });
  } catch (error) {
    console.error("Error in submitAttempt:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error submitting attempt",
        error: error instanceof Error ? error.message : String(error),
      });
  }
};

export const getAttemptsForQuiz = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const { quizId } = req.params;
    if (!quizId) {
      return res
        .status(400)
        .json({ success: false, message: "quizId parameter is required" });
    }

    const attempts = await Attempt.find({ student: studentId, quizId }).lean();
    return res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    console.error("Error in getAttemptsForQuiz:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching attempts",
        error: error instanceof Error ? error.message : String(error),
      });
  }
};

export default { openAttempt, submitAttempt, getAttemptsForQuiz };
