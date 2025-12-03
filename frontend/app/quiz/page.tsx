"use client";
import { Check, ChevronRight, X as XIcon, ArrowRight } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal State
  const [showCompletionCard, setShowCompletionCard] = useState<boolean>(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{
    isCorrect: boolean;
    correctCount: number; // for total progress
    totalCount: number;
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

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const api = await createStudentApi();
        if (!quizId) return;
        const resp = await api.get(`/quizzes/${quizId}`);
        const body: any = resp?.data ?? {};
        const quiz = body?.quiz;
        const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

        const mapped: QuizQuestion[] = questions.map((q: any, idx: number) => ({
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
        }));

        if (mounted) {
          setQuizData(mapped);
          setIsAuthenticated(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        if (mounted) setLoading(false);
      }
    };

    fetchQuiz();

    return () => {
      mounted = false;
    };
  }, [quizId, status, router, searchParams]);

  // --- Handlers ---

  const handleAnswerSelect = (answerId: string): void => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: answerId }));
  };

  const handleNextQuestion = () => {
    setShowCompletionCard(false);
    const nextIdx = currentQuestion + 1;
    if (nextIdx < quizData.length) {
      // Update URL for history
      router.push(`/quiz?quizId=${quizId}&q=${nextIdx}`);
      setCurrentQuestion(nextIdx);
      // Clear selection for next question if not previously selected
      // (Optional based on preference, currently keeping state object)
    } else {
      // End of quiz, go to map
      router.push(`/quiz-numbers?quizId=${quizId}`);
    }
  };

  const handleSubmitQuestion = async (): Promise<void> => {
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

      const isCorrect = res.data?.isCorrect ?? false;

      // Update state for Modal
      setLastSubmissionResult({
        isCorrect,
        correctCount: 0, // We could fetch actual count if needed, or just show current status
        totalCount: quizData.length,
      });

      setShowCompletionCard(true);
    } catch (err) {
      console.warn("Failed to submit attempt:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestionData = quizData[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const canSubmit = !!selectedAnswer && !isSubmitting;

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
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedAnswer === answer.id
                      ? "shadow-md scale-[1.01]"
                      : "hover:shadow-sm"
                  }`}
                  style={
                    selectedAnswer === answer.id
                      ? {
                          borderColor: "#C9A961",
                          backgroundColor: "rgba(201, 169, 97, 0.15)",
                          background:
                            "linear-gradient(135deg, rgba(244, 232, 208, 0.9) 0%, rgba(232, 213, 181, 0.9) 100%)",
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
                              borderColor: "#651321",
                              backgroundColor: "#651321",
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

        <div className="mt-6 text-center pb-10">
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
                    : "Oh you just missed it!"}
                </h2>
                <p className="text-[#4A3426] font-serif text-lg">
                  {lastSubmissionResult.isCorrect
                    ? "Your wisdom serves you well."
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
