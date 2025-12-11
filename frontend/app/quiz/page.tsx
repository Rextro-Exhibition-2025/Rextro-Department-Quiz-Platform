"use client";
import {
  Check,
  ChevronRight,
  X as XIcon,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { createStudentApi } from "@/interceptors/student";
import AncientLoader from "@/components/AncientLoader";

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

// Matching backend Attempt schema structure
interface AttemptData {
  question: string; // ObjectId
  answer: string;
  isCorrect: boolean;
}

export default function Quiz(): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const quizIdParam = searchParams?.get("quizId");
  const quizId = quizIdParam ? Number(quizIdParam) : null;

  // --- State ---
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});

  // Track history to enable "Review Mode"
  const [attemptHistory, setAttemptHistory] = useState<AttemptData[]>([]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal State
  const [showCompletionCard, setShowCompletionCard] = useState<boolean>(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{
    isCorrect: boolean;
    message?: string;
  } | null>(null);

  // --- Initial Load ---
  useEffect(() => {
    let mounted = true;
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Set current question from URL param if present
    const qParam = searchParams?.get("q");
    if (qParam && !Number.isNaN(Number(qParam))) {
      setCurrentQuestion(Math.max(0, Number(qParam)));
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const api = await createStudentApi();
        if (!quizId) return;

        // 1. Fetch Quiz Data
        const quizReq = api.get(`/quizzes/${quizId}`);
        // 2. Fetch User Attempts
        const attemptsReq = api.get(`/attempts/quiz/${quizId}`);

        const [quizResp, attemptsResp] = await Promise.all([
          quizReq,
          attemptsReq,
        ]);

        const body: any = quizResp?.data ?? {};
        const quiz = body?.quiz;
        const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

        // Map Questions
        const mappedQuestions: QuizQuestion[] = questions.map(
          (q: any, idx: number) => ({
            id: idx,
            questionId: q._id ?? q.id ?? null,
            question: q.question ?? "",
            image: q.questionImage ?? null,
            answers: Array.isArray(q.options)
              ? q.options.map((opt: any) => ({
                  id: (opt.option ?? "").toLowerCase(),
                  text: opt.optionText ?? null,
                  image: opt.optionImage ?? null,
                }))
              : [],
          })
        );

        // Map History
        const history: AttemptData[] = (attemptsResp.data as any)?.data || [];

        if (mounted) {
          setQuizData(mappedQuestions);
          setAttemptHistory(history);

          // Pre-fill answers from history if available
          const preFilled: SelectedAnswers = {};
          mappedQuestions.forEach((q, idx) => {
            const attempt = history.find((h) => h.question === q.questionId);
            if (attempt) {
              preFilled[idx] = attempt.answer.toLowerCase();
            }
          });
          setSelectedAnswers((prev) => ({ ...prev, ...preFilled }));

          setIsAuthenticated(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching quest data:", err);
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [quizId, status, router, searchParams]);

  // --- Derived State for Current Question ---
  const currentQuestionData = quizData[currentQuestion];

  // Check if this specific question is already conquered
  const currentAttempt = attemptHistory.find(
    (h) => h.question === currentQuestionData?.questionId
  );
  const isConquered = currentAttempt?.isCorrect === true;

  const selectedAnswer = selectedAnswers[currentQuestion];

  // Can submit if: An answer is selected AND it's not already conquered AND not currently submitting
  const canSubmit = !!selectedAnswer && !isConquered && !isSubmitting;

  // --- Handlers ---

  const handleAnswerSelect = (answerId: string): void => {
    // Prevent changing answer if already conquered
    if (isConquered) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: answerId }));
  };

  const handleNextQuestion = () => {
    setShowCompletionCard(false);
    const nextIdx = currentQuestion + 1;

    if (nextIdx < quizData.length) {
      router.push(`/quiz?quizId=${quizId}&q=${nextIdx}`);
      setCurrentQuestion(nextIdx);
    } else {
      router.push(`/quiz-numbers?quizId=${quizId}`);
    }
  };

  const handleSubmitQuestion = async (): Promise<void> => {
    if (isConquered) return; // Double check

    setIsSubmitting(true);
    try {
      const api = await createStudentApi();
      const currentQ = quizData[currentQuestion];
      const answer = selectedAnswers[currentQuestion];

      if (!currentQ?.questionId || !answer) return;

      // Submit specific attempt
      const res = await api.post("/attempts/submit", {
        quizId,
        questionId: currentQ.questionId,
        answer: String(answer),
      });

      const isCorrect = (res.data as any)?.isCorrect ?? false;

      // Update local history immediately so UI reflects "Conquered" state without reload
      setAttemptHistory((prev) => [
        ...prev.filter((h) => h.question !== currentQ.questionId), // remove old if exists (retry)
        {
          question: currentQ.questionId as string,
          answer: String(answer),
          isCorrect,
        },
      ]);

      setLastSubmissionResult({ isCorrect });
      setShowCompletionCard(true);
    } catch (err) {
      console.warn("Failed to submit attempt:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return <AncientLoader fullScreen text="Preparing Your Challenge..." />;
  if (!isAuthenticated) return null;

  return (
    <div
      className="min-h-screen p-4 relative"
      style={{
        background:
          "linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)",
      }}
    >
      {/* Background Texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        className="max-w-4xl mx-auto"
        style={{ position: "relative", zIndex: 2 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 parchment-card rounded-2xl p-4 mb-6 relative">
          <div className="flex items-center justify-between">
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ fontFamily: "Cinzel, serif", color: "#651321" }}
            >
              Quest Challenge
            </h1>
            <button
              onClick={() => router.push(`/quiz-numbers?quizId=${quizId}`)}
              className="ancient-button flex items-center space-x-2 px-4 py-2 rounded-md font-medium shadow-lg"
            >
              <span>Return to Map</span>
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="parchment-card rounded-2xl p-6 mb-6 relative">
          {/* Visual Indicator for Conquered Questions */}
          {isConquered && (
            <div className="absolute -top-4 -right-4 z-20 bg-[#fdf6e3] border-2 border-[#df7500] rounded-full p-2 shadow-xl rotate-12">
              <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-[#df7500] bg-gradient-to-br from-[#df7500]/10 to-transparent">
                <ShieldCheck className="text-[#df7500] w-10 h-10 mb-1" />
                <span className="text-[10px] font-bold text-[#651321] uppercase tracking-wider font-serif">
                  Conquered
                </span>
              </div>
            </div>
          )}

          <img
            src="/corner-decoration.svg"
            alt=""
            className="corner-decoration top-left"
          />
          <img
            src="/corner-decoration.svg"
            alt=""
            className="corner-decoration top-right"
          />
          <img
            src="/corner-decoration.svg"
            alt=""
            className="corner-decoration bottom-left"
          />
          <img
            src="/corner-decoration.svg"
            alt=""
            className="corner-decoration bottom-right"
          />

          <div className="my-8">
            <div className="flex justify-between items-start mb-4">
              <h2
                className="text-xl md:text-2xl font-bold"
                style={{ fontFamily: "Cinzel, serif", color: "#2C1810" }}
              >
                {currentQuestion + 1}.{" "}
                {currentQuestionData?.question ?? "No question available"}
              </h2>
              <span className="text-sm font-bold text-[#8b5a2b] bg-[#fdf6e3] px-3 py-1 rounded-full border border-[#8b5a2b]">
                {currentQuestion + 1} / {quizData.length}
              </span>
            </div>

            {currentQuestionData?.image && (
              <div className="mb-6 flex justify-center">
                <img
                  src={currentQuestionData.image}
                  alt="Question"
                  className="w-full max-w-2xl h-auto object-contain rounded-xl shadow-md bg-white"
                  style={{ maxHeight: "400px" }}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {Array.isArray(currentQuestionData?.answers) &&
              currentQuestionData.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  disabled={isConquered} // Disable clicking if conquered
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left relative ${
                    selectedAnswer === answer.id
                      ? "shadow-md scale-[1.01]"
                      : isConquered
                      ? "opacity-60"
                      : "hover:shadow-sm"
                  } ${isConquered ? "cursor-default" : "cursor-pointer"}`}
                  style={
                    selectedAnswer === answer.id
                      ? {
                          borderColor: isConquered ? "#166534" : "#C9A961", // Green border if conquered
                          backgroundColor: isConquered
                            ? "rgba(22, 101, 52, 0.1)"
                            : "rgba(201, 169, 97, 0.15)",
                          background: isConquered
                            ? undefined
                            : "linear-gradient(135deg, rgba(244, 232, 208, 0.9) 0%, rgba(232, 213, 181, 0.9) 100%)",
                        }
                      : {
                          borderColor: "#704214",
                          backgroundColor: "rgba(255, 248, 231, 0.5)",
                        }
                  }
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${
                        selectedAnswer === answer.id ? "text-white" : ""
                      }`}
                      style={
                        selectedAnswer === answer.id
                          ? {
                              borderColor: isConquered ? "#166534" : "#651321",
                              backgroundColor: isConquered
                                ? "#166534"
                                : "#651321", // Green check if conquered
                              borderRadius: "3px",
                              transform: "rotate(3deg)",
                            }
                          : {
                              borderColor: "#704214",
                              borderRadius: "3px",
                              transform: "rotate(-2deg)",
                              backgroundColor: "transparent",
                            }
                      }
                    >
                      {selectedAnswer === answer.id && <Check size={16} />}
                    </div>
                    <div className="flex-1">
                      {answer.image ? (
                        <div className="flex flex-col md:flex-row items-center gap-4">
                          <img
                            src={answer.image}
                            alt="Option"
                            className="max-h-[150px] object-contain rounded border border-[#704214]/30 bg-white"
                          />
                          {answer.text && (
                            <span className="font-medium text-lg text-[#2C1810] font-serif">
                              {answer.text}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium text-lg text-[#2C1810] font-serif">
                          {answer.text}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Action Button Area */}
        <div className="mt-6 text-center pb-10">
          {isConquered ? (
            // Review Mode Actions
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push(`/quiz-numbers?quizId=${quizId}`)}
                className="ancient-button px-8 py-4 rounded-xl font-bold bg-gray-500 hover:bg-gray-600 border-gray-600"
                style={{ fontSize: "1.1rem" }}
              >
                Return to Map
              </button>
              {currentQuestion < quizData.length - 1 && (
                <button
                  onClick={handleNextQuestion}
                  className="ancient-button px-8 py-4 rounded-xl font-bold flex items-center gap-2 animate-pulse"
                  style={{ fontSize: "1.1rem" }}
                >
                  <span>Next Challenge</span>
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          ) : (
            // Submit Mode Action
            <button
              className="ancient-button px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-200"
              style={{
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.5,
                fontSize: "1.1rem",
                letterSpacing: "0.05em",
              }}
              onClick={handleSubmitQuestion}
              disabled={!canSubmit}
            >
              {isSubmitting ? "Sealing Fate..." : "Submit Answer"}
            </button>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showCompletionCard && lastSubmissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-xl"
            style={{ background: "rgba(44, 24, 16, 0.7)" }}
          />
          <div className="relative max-w-lg w-full mx-4">
            <div className="parchment-card p-8 rounded-2xl shadow-2xl relative text-center">
              <img
                src="/corner-decoration.svg"
                alt=""
                className="corner-decoration top-left"
              />
              <img
                src="/corner-decoration.svg"
                alt=""
                className="corner-decoration top-right"
              />
              <img
                src="/corner-decoration.svg"
                alt=""
                className="corner-decoration bottom-left"
              />
              <img
                src="/corner-decoration.svg"
                alt=""
                className="corner-decoration bottom-right"
              />

              <div className="mb-6">
                {lastSubmissionResult.isCorrect ? (
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full border-4 border-green-600 shadow-inner mb-4">
                    <Check
                      className="w-10 h-10 text-green-700"
                      strokeWidth={3}
                    />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full border-4 border-red-600 shadow-inner mb-4">
                    <XIcon className="w-10 h-10 text-red-700" strokeWidth={3} />
                  </div>
                )}

                <h2
                  className="text-3xl font-bold mb-2"
                  style={{
                    fontFamily: "Cinzel, serif",
                    color: lastSubmissionResult.isCorrect
                      ? "#166534"
                      : "#991b1b",
                  }}
                >
                  {lastSubmissionResult.isCorrect
                    ? "Victorious!"
                    : "Fate Was Unkind"}
                </h2>
                <p className="text-[#4A3426] font-serif text-lg">
                  {lastSubmissionResult.isCorrect
                    ? "Your wisdom serves you well. This Scroll is now Conquered."
                    : "Do not despair. Review the scrolls and try again."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {currentQuestion < quizData.length - 1 && (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full ancient-button py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Next Challenge</span>
                    <ArrowRight size={20} />
                  </button>
                )}

                <button
                  onClick={() => router.push(`/quiz-numbers?quizId=${quizId}`)}
                  className="w-full py-3 rounded-xl font-bold text-lg transition-all duration-200 border-2 border-[#704214] text-[#2C1810] hover:bg-[#704214]/10"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  Return to Quest Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
