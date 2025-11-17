"use client";
import { useUser } from '@/contexts/UserContext';
import { createStudentApi } from '@/interceptors/student';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';


import { transformQuizApiResponse } from './questionTransformer';
import { QuizApiResponse } from '@/types/quiz';
import { useQuiz } from '@/contexts/QuizContext';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';



import { User } from 'next-auth';
import { getSession } from 'next-auth/react';

// Utils and types


// Type definitions
interface Answer {
  id: string;
  text: string | null;
  image: string | null;
}

export interface QuizQuestion {
  id: number;
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

// Constants
const QUIZ_DURATION = 45 * 60; // 45 minutes in seconds

// Device fingerprinting and violation logging removed

// Helper to format time as mm:ss
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function Quiz(): React.JSX.Element | null {
  // Constants
  const router = useRouter();
  const user = useUser();


  const { setQuizId, updateSelectedAnswers, submitQuiz, score } = useQuiz();

  // Timer management
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const end = localStorage.getItem('quizEndTimestamp');
        if (end) {
          const remain = Math.max(0, Math.round((Number(end) - Date.now()) / 1000));
          return remain;
        }
      } catch {
        // ignore
      }
    }
    return QUIZ_DURATION;
  });

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('quizCurrentQuestion');
        if (saved) return Math.max(0, Number(saved));
      } catch {
        // ignore
      }
    }
    return 0;
  });
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);

  // State initialization with localStorage
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

  // Auto-save selectedAnswers to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('quizSelectedAnswers', JSON.stringify(selectedAnswers));
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [selectedAnswers]);

  // Persist current question index to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('quizCurrentQuestion', String(currentQuestion));
    } catch (e) {
      // ignore
    }
  }, [currentQuestion]);

  // Hydrate QuizContext from saved selected answers on mount (sync page state -> context)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('quizSelectedAnswers');
      const parsed: SelectedAnswers = saved ? JSON.parse(saved) : selectedAnswers;
      if (parsed && Object.keys(parsed).length) {
        Object.keys(parsed).forEach((qIdx) => {
          const idx = Number(qIdx);
          const ans = parsed[qIdx as any];
          if (ans !== undefined && updateSelectedAnswers) {
            // keep context in sync
            // ignore promise intentionally
            updateSelectedAnswers(idx, ans).catch(() => { });
          }
        });
      }
    } catch (e) {
      // ignore parse errors
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist end timestamp so the timer can be continued after refresh.
  // We write an end timestamp derived from the current timeLeft — this is updated as timeLeft changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const endTs = Date.now() + timeLeft * 1000;
      localStorage.setItem('quizEndTimestamp', String(endTs));
    } catch (e) {
      // ignore storage errors
    }
  }, [timeLeft]);

  // UI state
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCompletionCard, setShowCompletionCard] = useState<boolean>(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);

  // Inactivity tracking
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Violation detection/logging removed

  // Update last activity time
  const updateActivity = () => {
    setLastActivityTime(Date.now());
  };

  // Check for inactivity (detection removed)
  const checkInactivity = () => {
    // inactivity detection/logging removed
  };

  // Calculate quiz score
  const calculateScore = (): number => {
    const totalQuestions = quizData.length;
    let correctAnswers = 0;
    const correctAnswerKey: { [key: number]: string } = {
      0: 'c', // Paris
      1: 'd', // All of the above
      2: 'a', // React logo (assuming first option is correct)
      3: 'a', // Creates a function (assuming first option is correct)
    };

    Object.keys(selectedAnswers).forEach(questionIndex => {
      const questionNum = parseInt(questionIndex);
      const selectedAnswer = selectedAnswers[questionNum];
      if (correctAnswerKey[questionNum] && selectedAnswer === correctAnswerKey[questionNum]) {
        correctAnswers++;
      } else if (questionNum >= 4) {
        // For sample questions (5+), assume 'a' is correct
        if (selectedAnswer === 'a') {
          correctAnswers++;
        }
      }
    });

    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  // Update user quiz state in backend
  const updateQuizState = async (): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/update-state`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || user.user?.authToken || ''}`
      },
      body: JSON.stringify({
        name: user.user?.name ?? '',
        hasEndedQuiz: true
      })
    });




    if (!response.ok) {
      throw new Error('Failed to update quiz state');
    }

    const responseData = await response.json();
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to update quiz state');
    }

    // Update user context and localStorage
    if (user.user) {
      user.setUser({
        ...user.user,
        hasEndedQuiz: true
      });
    }

    // No local studentData is saved anymore; keep user context updated instead.
    if (user.user) {
      user.setUser({
        ...user.user,
        hasEndedQuiz: true
      });
    }
  };

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(async (): Promise<void> => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    try {
      // Check authentication via user context and auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !user.user) {
        alert('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      const score = calculateScore();
      const answeredCount = Object.keys(selectedAnswers).length;

      // Prepare submission data using user context
      const submissionData: CompletionData = {
        name: user.user?.name || '',
        answers: selectedAnswers,
        score: score,
        completedAt: new Date().toISOString(),
        totalQuestions: quizData.length,
        answeredQuestions: answeredCount
      };

      // Update user state in backend
      await updateQuizState();

      // Store results locally
      localStorage.setItem('quizResult', JSON.stringify(submissionData));

      // Clear saved answers after submission (so refresh won't restore them)
      try {
        localStorage.removeItem('quizSelectedAnswers');
        localStorage.removeItem('quizCurrentQuestion');
        localStorage.removeItem('quizEndTimestamp');
      } catch (e) {
        // ignore
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      // Show completion
      setCompletionData(submissionData);
      setShowCompletionCard(true);

      // Clear any transient authentication flags if needed (we keep authToken in storage)

      // Submit to quiz context
      await submitQuiz();

    } catch (error) {
      alert(error);
      console.error('Submit quiz error:', error);
      setIsSubmitting(false);
    }
  }, [selectedAnswers, quizData.length, router, user, submitQuiz]);
  useEffect(() => {
    if (user.user?.medium && user.user?.number) {
      console.log('User context data:', user);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}') as any;
      userData.medium = user?.user?.medium || '';
      userData.number = user?.user?.number ?? 0;
      userData.authToken = user?.user?.authToken || '';
      userData.loginTime = new Date().toISOString();
      userData.name = user?.user?.name || '';
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }, [user]);
  // Fetch quiz data
  useEffect(() => {
    console.log("calling ");

    // After OAuth redirect from NextAuth, call our helper route which will
    // request the backend to link the Google account and set the httpOnly
    // `authToken` cookie. This runs on the client so the browser receives
    // the Set-Cookie header forwarded by `/api/auth/link`.
    (async () => {
      try {
        const session = await getSession();
        if (session?.user?.email) {
          await fetch('/api/auth/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email, name: session.user.name }),
            credentials: 'include'
          });
        }
      } catch (e) {
        console.warn('Failed to call /api/auth/link', e);
      }
    })();

    const fetchQuiz = async (id: number) => {
      console.log("calling 2", id);

      try {
        const api = await createStudentApi({ token: user.user?.authToken || '' });
        const response: any = await api.get(`/quizzes/${id}`);
        setQuizData(transformQuizApiResponse(response.data.quiz));
        return;
      } catch (error: any) {
        // Detailed logging to help debug 404 vs network issues
        console.error('Fetch quiz error:', error?.toString?.() || error);
        if (error?.response) {
          console.error('Response status:', error.response.status, 'data:', error.response.data);
          // If quiz not found (404) and id !== 1, retry with quiz 1 as a safe fallback
          if (error.response.status === 404 && id !== 1) {
            console.warn(`Quiz ${id} not found; retrying with quiz 1 as fallback`);
            try {
              const api = await createStudentApi({ token: user.user?.authToken || '' });
              const resp2: any = await api.get(`/quizzes/1`);
              setQuizData(transformQuizApiResponse(resp2.data.quiz));
              setQuizId(1);
              return;
            } catch (err2) {
              console.error('Fallback fetch quiz error:', err2);
            }
          }
        }
      }
    };
    const quizid = getQuizId(user.user);



    setQuizId(quizid);
    fetchQuiz(quizid);
  }, []);


  const getQuizId = (user: any | null): number => {
    // Defensive access: user may come from different shapes, coerce values
    const userId = Number((user as any)?.id ?? (user as any)?.number ?? 1);
    const isEnglish = Boolean((user as any)?.medium === "E");
    console.log(user)
    console.log(userId, "user id");
    console.log(isEnglish, "is English");


    switch (userId) {
      case 1:
        return isEnglish ? 1 : 5;
      case 2:
        return isEnglish ? 2 : 6;
      case 3:
        return isEnglish ? 3 : 7;
      case 4:
        return isEnglish ? 4 : 8;
      default:
        return 1;
    }
  };




  // Inactivity tracking setup
  useEffect(() => {
    if (!isAuthenticated || showCompletionCard) return;

    // Start inactivity monitoring
    if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);

    inactivityTimerRef.current = setInterval(() => {
      checkInactivity();
    }, 3000); // Check every 3 seconds

    // Activity tracking event listeners
    const handleActivity = () => {
      updateActivity();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, showCompletionCard, currentQuestion, lastActivityTime]);

  // Authentication check
  useEffect(() => {
    const checkAuthentication = () => {
      const authToken = localStorage.getItem('authToken');
      // Rely on user context instead of local studentData
      if (!authToken || !user.user) {
        router.push('/login');
        return;
      }

      // Basic presence check — if name is missing, force re-login
      if (!user.user.name) {
        router.push('/login');
        return;
      }

      setLoading(false);
    };

    checkAuthentication();
  }, [router]);

  // Timer countdown effect
  useEffect(() => {
    if (!isAuthenticated || showCompletionCard) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, showCompletionCard, handleSubmitQuiz]);

  // Fullscreen management only (detection removed)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Request fullscreen - handle async operation inside useEffect
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.error('Error entering fullscreen:', error);
      }
    };

    requestFullscreen();

    // No detection event listeners are registered.

    return () => {
      // noop cleanup
    };
  }, [isAuthenticated]);

  // Disable right-click and text selection
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

  // Prevent background scrolling when modal (completion or fullscreen prompt) is visible
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    if (showCompletionCard || showFullscreenPrompt) {
      // prevent layout shift by compensating for scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [showCompletionCard, showFullscreenPrompt]);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Computed values
  const totalQuestions = quizData.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  // Display score: show numeric 0 as "0.00" instead of treating falsy 0 as missing
  const displayScore = (typeof score === 'number' && !isNaN(score)) ? score.toFixed(2) : '0';

  // Event handlers
  const handleGoToLeaderboard = (): void => {
    setShowCompletionCard(false);
    router.push('/leaderboard');
  };

  const handleAnswerSelect = (answerId: string): void => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerId
    }));
    updateSelectedAnswers(currentQuestion, answerId);
  };

  const handleNext = (): void => {

    setCurrentQuestion((prev) => Math.min(prev + 1, totalQuestions - 1));
    // updateSelectedAnswers(currentQuestion, selectedAnswers[currentQuestion]);
  };

  const handlePrevious = (): void => {

    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
    // updateSelectedAnswers(currentQuestion, selectedAnswers[currentQuestion]);
  };

  const handleQuestionNavigation = (questionIndex: number): void => {
    setCurrentQuestion(questionIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const handleReEnterFullscreen = async (): Promise<void> => {
    setShowFullscreenPrompt(false);

    try {
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      } else {
        throw new Error('Fullscreen not supported');
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      // Show the prompt again if fullscreen fails
      setTimeout(() => {
        setShowFullscreenPrompt(true);
      }, 1000);
    }
  };

  const currentQuestionData = quizData[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#df7500]"></div>
      </div>
    );
  }

  // Don't render the quiz if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Timer warning color
  const timerColor = timeLeft <= 60 ? '#df7500' : '#651321';

  return (
    <div
      className="min-h-screen bg-gradient-to-br p-4 relative"
      style={{
        backgroundImage: 'url("/Container.png")',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(255,255,255,0.6)',
        zIndex: 1
      }} />

      <div className="max-w-4xl mx-auto" style={{ position: 'relative', zIndex: 2 }}>
        {/* Sticky Header with Timer */}
        <div className="sticky top-0 z-10 bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Quiz Challenge</h1>
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="text-sm md:text-base font-medium text-gray-800">
                Q {currentQuestion + 1}/{totalQuestions}
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: timeLeft <= 60 ? '#FEF3E2' : '#F5E6E8' }}>
                <Clock size={20} style={{ color: timerColor }} />
                <span className="text-lg md:text-xl font-bold" style={{ color: timerColor }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full rounded-full h-3 my-4 relative" style={{ background: 'rgba(223,117,0,0.1)' }}>
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{
                width: `${progress}%`,
                backgroundColor: '#651321'
              }}
            >
              <span
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-xs text-white"
                style={{ transform: 'translateX(50%)' }}
              >
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>


        {/* Progress and Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">


          {/* Question Card */}
          <div className="my-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
              {currentQuestion + 1}. {currentQuestionData?.question ?? 'No question available'}
            </h2>

            {currentQuestionData?.image && (
              <div className="mb-6 flex justify-center">
                <img
                  src={currentQuestionData.image}
                  alt="Question illustration"
                  className="w-full max-w-2xl h-auto object-contain rounded-xl shadow-md hover:shadow-lg transition-shadow bg-white"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}
          </div>

          {/* Answers */}
          <div className="grid gap-4">
            {Array.isArray(currentQuestionData?.answers) && currentQuestionData.answers.map((answer) => (
              <button
                key={answer.id}
                onClick={() => handleAnswerSelect(answer.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedAnswer === answer.id
                  ? 'shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                style={selectedAnswer === answer.id ? {
                  borderColor: '#DF7500',
                  backgroundColor: '#DF7500008'
                } : {}}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswer === answer.id
                      ? 'text-white'
                      : 'border-gray-300'
                      }`}
                    style={selectedAnswer === answer.id ? {
                      borderColor: '#DF7500',
                      backgroundColor: '#DF7500'
                    } : {}}
                  >
                    {selectedAnswer === answer.id && (
                      <Check size={16} className="text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    {answer.image && !answer.text && (
                      <img
                        src={answer.image}
                        alt={`Option ${answer.id}`}
                        className="w-full max-w-2xl h-auto object-contain rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer mx-auto"
                        style={{ maxHeight: '400px' }}
                      />
                    )}

                    {answer.text && !answer.image && (
                      <span className="text-gray-800 font-medium text-lg">
                        {answer.text}
                      </span>
                    )}

                    {answer.text && answer.image && (
                      <div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-3 md:space-y-0">
                        <img
                          src={answer.image}
                          alt={`Option ${answer.id}`}
                          className="w-full md:w-96 h-auto object-contain rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                          style={{ maxHeight: '300px' }}
                        />
                        <span className="text-gray-800 font-medium text-lg">
                          {answer.text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-5">
          <div className="ml-auto">
            {currentQuestion !== totalQuestions - 1 && (
              <button
                onClick={handleNext}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 text-white hover:opacity-90 shadow-lg hover:shadow-xl ${selectedAnswers[currentQuestion] ? '' : 'bg-gray-400 cursor-not-allowed'}`}
                style={{ backgroundColor: selectedAnswers[currentQuestion] ? '#651321' : '#785158' }}
                disabled={!selectedAnswers[currentQuestion]}
              >
                <span>Next</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Submit Button (appears on last question) */}
        {currentQuestion === totalQuestions - 1 && (
          <div className="mt-6 text-center">
            <button
              className="text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: selectedAnswers[currentQuestion] ? '#651321' : '#785158', cursor: selectedAnswers[currentQuestion] ? 'pointer' : 'not-allowed' }}
              onClick={handleSubmitQuiz}
              disabled={!selectedAnswers[currentQuestion]}
            >
              Submit Quiz
            </button>
          </div>
        )}
      </div>

      {/* Full-Screen Prompt */}
      {showFullscreenPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* translucent dark overlay with blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
          <div className="relative bg-white p-8 rounded-xl shadow-xl text-center text-black">
            <h2 className="text-lg font-bold mb-4">Full Screen Required</h2>
            <p className="mb-6">Please click the button below to return to full-screen mode and continue your quiz.</p>
            <button
              className="px-6 py-3 bg-[#651321] text-white rounded-lg font-semibold"
              onClick={handleReEnterFullscreen}
            >
              Re-enter Full Screen
            </button>
          </div>
        </div>
      )}

      {/* Quiz Completion Card */}
      {showCompletionCard && completionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* translucent blurred backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
          <div className="relative max-w-2xl w-full mx-4">
            <div className="p-6 bg-white/95 rounded-2xl border border-white/30 shadow-lg">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#df7500] to-[#651321] rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#651321] mb-2">Quiz Completed!</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-white/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Student</div>
                    <div className="font-semibold text-[#651321]">{completionData.name}</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Score</div>
                    <div className="font-bold text-2xl text-[#df7500]">{displayScore !== 'N/A' ? `${displayScore}%` : 'N/A'}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Answered {completionData.answeredQuestions} of {completionData.totalQuestions} questions
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <button
                    onClick={handleGoToLeaderboard}
                    className="bg-gradient-to-r from-[#df7500] to-[#651321] text-white py-3 px-8 rounded-full font-semibold text-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    View Leaderboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}