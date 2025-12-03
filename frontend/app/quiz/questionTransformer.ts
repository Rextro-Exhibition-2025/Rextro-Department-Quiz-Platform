import { QuizApiOption, QuizApiQuestion, QuizApiResponse } from "@/types/quiz";
import { QuizQuestion } from "./page";

export function transformQuizApiResponse(apiResponse: QuizApiResponse): QuizQuestion[] {
    
  return apiResponse.questions.map((q: QuizApiQuestion, idx: number) => ({
    id: idx + 1, 
    question: q.question,
    image: q.questionImage || null,
    answers: q.options.map((opt: QuizApiOption) => ({
      id: opt.option.toLowerCase(), 
      text: opt.optionText || null,
      image: opt.optionImage || null,
    })),
  }));
}