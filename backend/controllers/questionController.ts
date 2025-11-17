
import jwt from "jsonwebtoken";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import type { Request, Response } from "express";



export const createQuestion = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('📝 Received question data:', JSON.stringify(req.body, null, 2));

    // Validate that each option has either text or image
    if (req.body.options && Array.isArray(req.body.options)) {
      for (let i = 0; i < req.body.options.length; i++) {
        const option = req.body.options[i];
        if (!option.optionText && !option.optionImage) {
          res.status(400).json({
            success: false,
            message: `Option ${option.option || i + 1} must have either text or image`,
          });
          return;
        }
      }
    }

    let quiz = await Quiz.findOne({ quizId: req.body.quizId });

    if (!quiz) {
      // Safety: if the quiz doc is missing, create it so questions can be added.
      // This prevents 404s when frontend and DB get out of sync.
      console.warn(`Quiz with quizId ${req.body.quizId} not found. Creating new quiz document.`);
      quiz = await Quiz.create({ quizId: req.body.quizId, questions: [] });
      console.log(`Created quiz document for quizId ${req.body.quizId}`);
    }

    // Check if quiz already has 40 or more questions
    const currentQuestionCount = quiz.questions?.length || 0;
    if (currentQuestionCount >= 40) {
      res.status(400).json({
        success: false,
        message: `Quiz ${req.body.quizId} already has the maximum number of questions (15). Cannot add more questions.`,
        currentQuestionCount: currentQuestionCount
      });
      return;
    }

    // Create the question
    console.log('✅ Creating question in database...');
    const question = await Question.create(req.body);
    console.log('✅ Question created with ID:', question._id);

    // Add the question to the quiz
    if (!quiz.questions) {
      quiz.questions = [];
    }
    quiz.questions.push(question._id as any);
    await quiz.save();
    console.log('✅ Question added to quiz:', quiz.quizId);

    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('❌ Error creating question:', error);
    res.status(400).json({
      success: false,
      message: "Error Adding Question",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const editQuestion =  async (req: Request, res: Response): Promise<any> => {
  try{
    const questionId = req.params.questionId;
    const updatedData = req.body;

    // Validate that each option has either text or image
    if (updatedData.options && Array.isArray(updatedData.options)) {
      for (let i = 0; i < updatedData.options.length; i++) {
        const option = updatedData.options[i];
        if (!option.optionText && !option.optionImage) {
          res.status(400).json({
            success: false,
            message: `Option ${option.option || i + 1} must have either text or image`,
          });
          return;
        }
      }
    }

    const question = await Question.findByIdAndUpdate(questionId, updatedData, { new: true });
    if(!question){
      return res.status(404).json({ success: false, message: `Question with ID ${questionId} not found.` });
    }
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    console.error('❌ Error editing question:', error);
    res.status(400).json({
      success: false,
      message: "Error Editing Question",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<any> => { 

  try {
    const questionId = req.params.questionId;
    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: `Question with ID ${questionId} not found.` });
    }

  
    // Also remove the question from any quizzes that reference it
    await Quiz.updateMany(
      { questions: question._id },
      { $pull: { questions: question._id } }
    );
    res.status(200).json({ success: true, message: `Question with ID ${questionId} deleted successfully.` });
  } catch (error) {
    console.error('❌ Error deleting question:', error);
    res.status(400).json({
      success: false,
      message: "Error Deleting Question",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getAllQuestions = async (req: Request, res: Response): Promise<any> => {

  try {

    const questions = await Question.find();
    res.status(200).json({ success: true, data: questions });
    
  } catch (error) {

    console.error('❌ Error fetching questions:', error);
    res.status(400).json({
      success: false,
      message: "Error Fetching Questions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
  }

}


export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const questionId = req.params.questionId;
    console.log("Fetching question with ID:", questionId);

    const question = await Question.findById(questionId);
    if(!question){
      res.status(404).json({ success: false, message: `Question with ID ${questionId} not found.` });
    }
   res.status(200).json({ success: true, data: question });
  } catch (error) {
    console.error('❌ Error fetching question by ID:', error);
    res.status(400).json({
      success: false,
      message: "Error Fetching Question",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}