"use client";
import { Check, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createStudentApi } from '@/interceptors/student';


interface Answer {
  id: string;
  text: string | null;
  image: string | null;
}

export interface QuizQuestion {
  id: number;
  questionId?: string | null;
  question: string;
  image: string | null;
  answers: Answer[];
}


interface SelectedAnswers {
  [questionIndex: number]: string;
}

interface CompletionData {
  name: string;
  answers: SelectedAnswers;
  score: number;
  completedAt: string;
  totalQuestions: number;
  answeredQuestions: number;
}



export default function Quiz(): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session, status } = useSession();
  const mockUser = { name: (session as any)?.user?.name ?? 'Student', id: (session as any)?.user?.id ?? 0 } as any;
  const quizIdParam = searchParams?.get('quizId');
  const quizId = quizIdParam ? Number(quizIdParam) : null;

  

  
  const [currentQuestion, setCurrentQuestion] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('quizCurrentQuestion');
        if (saved) return Math.max(0, Number(saved));
      } catch {}
    }
    return 0;
  });
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('quizSelectedAnswers');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quizSelectedAnswers', JSON.stringify(selectedAnswers));
      } catch {}
    }
  }, [selectedAnswers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('quizCurrentQuestion', String(currentQuestion));
    } catch {}
  }, [currentQuestion]);


  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCompletionCard, setShowCompletionCard] = useState<boolean>(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);

  
  const updateActivity = () => {};
  const checkInactivity = () => {};

  
  const calculateScore = (): number => {
    const totalQuestions = quizData.length || 1;
    let correctAnswers = 0;

    
    const correctAnswerKey: { [key: number]: string } = {
      0: 'c',
      1: 'd',
      2: 'a'
    };

    Object.keys(selectedAnswers).forEach(qIdx => {
      const qi = Number(qIdx);
      const sel = selectedAnswers[qi];
      if (correctAnswerKey[qi] && sel === correctAnswerKey[qi]) correctAnswers++;
    });

    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  
  const updateQuizState = async (): Promise<void> => { return; };

  const handleSubmitQuiz = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      const score = calculateScore();
      const answeredCount = Object.keys(selectedAnswers).length;

      const submissionData: CompletionData = {
        name: mockUser.name || '',
        answers: selectedAnswers,
        score,
        completedAt: new Date().toISOString(),
        totalQuestions: quizData.length,
        answeredQuestions: answeredCount
      };

      
      try {
        localStorage.setItem('quizResult', JSON.stringify(submissionData));
        localStorage.removeItem('quizSelectedAnswers');
        localStorage.removeItem('quizCurrentQuestion');
      } catch {}

      
      try {
        const api = await createStudentApi();
        if (quizId) {
          const entries = Object.entries(selectedAnswers);
          await Promise.all(entries.map(async ([qIdx, ans]) => {
            const questionIndex = Number(qIdx);
            const questionId = quizData[questionIndex]?.questionId;
            if (!questionId) {
              console.warn(`Skipping submit: missing questionId for index ${questionIndex}`);
              return;
            }
            try {
              await api.post('/attempts/submit', { quizId, questionId, answer: String(ans) });
            } catch (e) {
              console.warn(`Failed to submit attempt for question ${questionId}:`, e);
            }
          }));
        }
      } catch (err) {
        console.warn('Failed to submit attempts to server:', err);
      }

      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch {}
      }

      setCompletionData(submissionData);
      setShowCompletionCard(true);
      setIsSubmitting(false);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  }, [selectedAnswers, quizData.length, quizId]);

  
  useEffect(() => {
    let mounted = true;

    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      
      router.push('/login');
      return;
    }

    const qParam = quizId;
    if (!qParam || Number.isNaN(qParam)) {
      
      if (mounted) {
        setQuizData([]);
        setIsAuthenticated(true);
        setLoading(false);
      }
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const api = await createStudentApi();
        const resp = await api.get(`/quizzes/${qParam}`);
        const body: any = resp?.data ?? {};
        const quiz = body?.quiz;
        const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

        const mapped: QuizQuestion[] = questions.map((q: any, idx: number) => ({
          id: idx,
          questionId: q._id ?? q.id ?? null,
          question: q.question ?? '',
          image: q.questionImage ?? null,
          answers: Array.isArray(q.options) ? q.options.map((opt: any) => ({ id: (opt.option ?? '').toLowerCase(), text: opt.optionText ?? null, image: opt.optionImage ?? null })) : []
        }));

        if (mounted) {
          setQuizData(mapped);
          setIsAuthenticated(true);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching quiz:', err);
        if (mounted) {
          setQuizData([]);
          setIsAuthenticated(true);
          setLoading(false);
        }
      }
    })();

    return () => { mounted = false };
  }, [quizIdParam, status]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qParam = searchParams?.get('q');
    if (!qParam) return;
    const parsed = Number(qParam);
    if (Number.isNaN(parsed) || parsed < 0) return;
    if (quizData.length === 0) return;

    const clamped = Math.max(0, Math.min(parsed, quizData.length - 1));
    setCurrentQuestion(clamped);
  }, [searchParams, quizData.length]);
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    const disableTextSelection = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('selectstart', disableTextSelection);
    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('selectstart', disableTextSelection);
    };
  }, []);

  const totalQuestions = quizData.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const displayScore = completionData ? `${completionData.score.toFixed(2)}` : `${calculateScore().toFixed(2)}`;

  const handleGoToLeaderboard = (): void => {
    setShowCompletionCard(false);
    router.push('/leaderboard');
  };

  const handleAnswerSelect = (answerId: string): void => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion]: answerId }));
  };
  const currentQuestionData = quizData[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#df7500]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 relative" style={{ backgroundImage: 'url("/Container.png")', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.6)', zIndex: 1 }} />

      <div className="max-w-4xl mx-auto" style={{ position: 'relative', zIndex: 2 }}>
        <div className="sticky top-0 z-10 bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Quiz Challenge</h1>
            <div>
              <button onClick={() => router.back()} className="flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-white hover:opacity-90 shadow-lg" style={{ backgroundColor: '#651321' }}>
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="my-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">{currentQuestion + 1}. {currentQuestionData?.question ?? 'No question available'}</h2>

            {currentQuestionData?.image && (
              <div className="mb-6 flex justify-center">
                <img src={currentQuestionData.image} alt="Question illustration" className="w-full max-w-2xl h-auto object-contain rounded-xl shadow-md hover:shadow-lg transition-shadow bg-white" style={{ maxHeight: '400px' }} />
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {Array.isArray(currentQuestionData?.answers) && currentQuestionData.answers.map((answer) => (
              <button key={answer.id} onClick={() => handleAnswerSelect(answer.id)} className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedAnswer === answer.id ? 'shadow-md' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`} style={selectedAnswer === answer.id ? { borderColor: '#DF7500', backgroundColor: '#DF7500008' } : {}}>
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswer === answer.id ? 'text-white' : 'border-gray-300'}`} style={selectedAnswer === answer.id ? { borderColor: '#DF7500', backgroundColor: '#DF7500' } : {}}>
                    {selectedAnswer === answer.id && (<Check size={16} className="text-white" />)}
                  </div>
                  <div className="flex-1">
                    {answer.image && !answer.text && (<img src={answer.image} alt={`Option ${answer.id}`} className="w-full max-w-2xl h-auto object-contain rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer mx-auto" style={{ maxHeight: '400px' }} />)}
                    {answer.text && !answer.image && (<span className="text-gray-800 font-medium text-lg">{answer.text}</span>)}
                    {answer.text && answer.image && (<div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-3 md:space-y-0"><img src={answer.image} alt={`Option ${answer.id}`} className="w-full md:w-96 h-auto object-contain rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer" style={{ maxHeight: '300px' }} /><span className="text-gray-800 font-medium text-lg">{answer.text}</span></div>)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {currentQuestion === totalQuestions - 1 && (
          <div className="mt-6 text-center">
            <button className="text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200" style={{ backgroundColor: selectedAnswers[currentQuestion] ? '#651321' : '#785158', cursor: selectedAnswers[currentQuestion] ? 'pointer' : 'not-allowed' }} onClick={handleSubmitQuiz} disabled={!selectedAnswers[currentQuestion]}>
              Submit Quiz
            </button>
          </div>
        )}
      </div>

      {showCompletionCard && completionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
          <div className="relative max-w-2xl w-full mx-4">
            <div className="p-6 bg-white/95 rounded-2xl border border-white/30 shadow-lg">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#df7500] to-[#651321] rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-[#651321] mb-2">Quiz Completed!</h2>
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-white/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Student</div>
                    <div className="font-semibold text-[#651321]">{completionData.name}</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Score</div>
                    <div className="font-bold text-2xl text-[#df7500]">{displayScore !== 'N/A' ? `${displayScore}%` : 'N/A'}</div>
                  </div>
                </div> */}
                <div className="mt-4 text-sm text-gray-600">Answered {completionData.answeredQuestions} of {completionData.totalQuestions} questions</div>
                <div className="mt-6 flex items-center justify-center space-x-4">
                  <button onClick={() => { setShowCompletionCard(false); router.push(`/quiz-numbers?quizId=${quizId}`); }} className="px-6 py-3 rounded-full font-semibold text-lg bg-white border border-gray-200 text-gray-800 hover:opacity-90 transition-all duration-200 shadow-sm">
                    Back to Questions
                  </button>

                  <button onClick={handleGoToLeaderboard} className="bg-gradient-to-r from-[#df7500] to-[#651321] text-white py-3 px-8 rounded-full font-semibold text-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg">View Leaderboard</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}