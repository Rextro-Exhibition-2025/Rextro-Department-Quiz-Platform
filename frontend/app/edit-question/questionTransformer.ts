// Simple transformer for edit-question page

import { Answer, Question, QuestionApiResponse, QuizApiQuestion, QuizApiOption } from "@/types/quiz";
import { getQuizSetName, getQuizIdFromSetName } from '@/constants/quizSets';





export function transformApiQuestion(apiQ: QuestionApiResponse): Question {
  const answers: Answer[] = (apiQ.options || []).map((opt) => ({
    id: String(opt.option).toLowerCase(),
    text: opt.optionText,
    image: opt.optionImage ?? null,
  }));

  const correctAnswer = apiQ.correctOption ? String(apiQ.correctOption).toLowerCase() : answers[0]?.id ?? '';

  return {
    id: apiQ._id,
    question: apiQ.question,
    image: apiQ.questionImage ,
    answers,
    correctAnswer,
    quizSet: getQuizSetName(Number(apiQ.quizId)),
  };
}



export function transformQuestionToApi(q: Question): QuizApiQuestion {
  // Convert quizSet (department name) back to numeric quizId expected by the API
  const quizId = getQuizIdFromSetName(q.quizSet || '');

  const options: QuizApiOption[] = (q.answers || []).map((a) => ({
    option: String(a.id).toUpperCase(),
    optionText: a.text ?? '',
    optionImage: a.image ?? undefined,
  }));

  return {
    _id: q.id ?? '',
    quizId,
    question: q.question,
    questionImage: q.image ?? undefined,
    options,
    correctOption: String(q.correctAnswer || '').toUpperCase(),
    __v: 0,
  };
}
