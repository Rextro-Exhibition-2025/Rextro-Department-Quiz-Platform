import { QuizApiOption, QuizApiQuestion, QuizApiResponse } from "@/types/quiz";
import { QuizQuestion } from "./page";

export function transformQuizApiResponse(apiResponse: QuizApiResponse): QuizQuestion[] {
    
  return apiResponse.questions.map((q: QuizApiQuestion, idx: number) => ({
<<<<<<< HEAD
    id: idx + 1, 
    question: q.question,
    image: q.questionImage || null,
    answers: q.options.map((opt: QuizApiOption) => ({
      id: opt.option.toLowerCase(), 
=======
    id: idx + 1, // or use q.quizId if you want
    question: q.question,
    image: q.questionImage || null,
    answers: q.options.map((opt: QuizApiOption) => ({
      id: opt.option.toLowerCase(), // 'A' -> 'a'
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
      text: opt.optionText || null,
      image: opt.optionImage || null,
    })),
  }));
}