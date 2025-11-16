import Quiz from '../models/Quiz.js';
import type { Request, Response } from 'express';
import SchoolTeam from '../models/SchoolTeam.js';

export const getQuizWithQuestions = async (req: Request, res: Response) => {

  
  try {
    const quizId = Number(req.params.quizId);
    if (![1, 2, 3, 4, 5, 6, 7, 8].includes(quizId)) {
      return res.status(400).json({ success: false, message: 'Invalid quizId. Must be 1, 2, 3, 4, 5, 6, 7, or 8.' });
    }

    // Find the quiz and populate questions
    const quiz = await Quiz.findOne({ quizId }).populate('questions');
    if (!quiz) {
      return res.status(404).json({ success: false, message: `Quiz with quizId ${quizId} not found.` });
    }


    
    

    // Remove correctOption from each question
    const quizObj = quiz.toObject();
    quizObj.questions = (quizObj.questions || []).map((q: any) => {
      const { correctOption, ...rest } = q;
      return rest;
    });

    return res.status(200).json({
      success: true,
      quiz: quizObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching quiz',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};


function countCorrectAnswers(submittedAnswers: { questionId: number, answer: string }[], correctAnswers: { questionId: number, correctOption: string }[]): number {
 
  
  let correctCount = 0;
  submittedAnswers.forEach(sub => {
    const correct = correctAnswers.find(ca => ca.questionId === sub.questionId);
    if (correct && correct.correctOption.toLowerCase() === sub.answer.toLowerCase()) {
      correctCount++;
    }
  });
  return correctCount;
}
export const submitQuiz = async (req: Request, res: Response) => {

 
  
  
  try {
    const { quizId, submittedAnswers  } = req.body;
    const memberName = req.user?.memberName;
    const schoolName = req.user?.schoolName;

    


    

    const quiz = await Quiz.findOne({ quizId }).populate({ path: 'questions', select: 'correctOption' });

 
    const correctAnswers: { questionId: number, correctOption: string }[] = (quiz?.questions ?? []).map((q: any, idx: number) => ({
      questionId: idx,
      correctOption: q.correctOption.toLowerCase()
  
    }));



    
    if (!quiz) {
      return res.status(404).json({ success: false, message: `Quiz with quizId ${quizId} not found.` });
    }

    const correctCount = countCorrectAnswers(submittedAnswers, correctAnswers);


    const score = (correctCount/submittedAnswers.length)*100;

    console.log(score, "score");
    

    try {


  const team =  await SchoolTeam.findOneAndUpdate(
        { schoolName, "members.name": memberName },
        { $set: { "members.$.marks": score } },
        { new: true }
      );


      


      
   
      

    } catch (error) {

      console.error("Error submitting quiz:", error);
      
    }


    



    return res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
    
        quizId,
        score,
   
      }
    });





    

  }catch (error) {

    return res.status(500).json({
      success: false,
      message: 'Error submitting quiz',
      error: error instanceof Error ? error.message : 'Unknown error',
    });



    }
}

export const getLeaderBoard = async (req: Request, res: Response) => {


  

  try {

    const schools = await SchoolTeam.find().lean();
    const schoolsWithScores = schools.map(school => {
      const totalScore = school.members.reduce((acc: number, member: any) => acc + (member.marks || 0), 0);
      return {
        schoolName: school.schoolName,
        totalScore,
        members: school.members.map((member: any) => ({
          studentName: member.name,
          marks: member.marks || 0
        }))
      };
    });

    // Sort schools by total score
    schoolsWithScores.sort((a, b) => b.totalScore - a.totalScore);

    return res.status(200).json({
      success: true,
      data: schoolsWithScores
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
  }
}

export const publishAllQuizzes = async (req: Request, res: Response) => {
console.log("huuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");

  try {
    const result = await Quiz.updateMany({}, { $set: { isPublished: true } });
    console.log('publishAllQuizzes result:', result);
    return res.status(200).json({ success: true, message: 'All quizzes published successfully.', modifiedCount: (result as any).modifiedCount ?? 0 });
  }
  catch (error) {
    console.log(error);
    
    return res.status(500).json({
      success: false,
      message: 'Error publishing quizzes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

} 

export const unpublishAllQuizzes = async (req: Request, res: Response) => {

  try {
    const result = await Quiz.updateMany({}, { $set: { isPublished: false } });
    console.log('unpublishAllQuizzes result:', result);
    return res.status(200).json({ success: true, message: 'All quizzes unpublished successfully.', modifiedCount: (result as any).modifiedCount ?? 0 });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error unpublishing quizzes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

}

export const checkQuizzesPublishedStatus = async (req: Request, res: Response) => {

  try {
    const quiz = await Quiz.findOne({ quizId: 1 }); // assuming quizId 1 is ZES
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }
    return res.status(200).json({ success: true, isPublished: quiz.isPublished || false });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking quiz published status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}