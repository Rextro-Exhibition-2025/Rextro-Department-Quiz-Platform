"use client";
import { Check, ChevronRight } from "lucide-react";
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
  const mockUser = {
    name: (session as any)?.user?.name ?? "Student",
    id: (session as any)?.user?.id ?? 0,
  } as any;
  const quizIdParam = searchParams?.get("quizId");
  const quizId = quizIdParam ? Number(quizIdParam) : null;

  const [currentQuestion, setCurrentQuestion] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("quizCurrentQuestion");
        if (saved) return Math.max(0, Number(saved));
      } catch {}
    }
    return 0;
  });
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("quizSelectedAnswers");
          return saved ? JSON.parse(saved) : {};
        } catch {
          return {};
        }
      }
      return {};
    }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "quizSelectedAnswers",
          JSON.stringify(selectedAnswers)
        );
      } catch {}
    }
  }, [selectedAnswers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("quizCurrentQuestion", String(currentQuestion));
    } catch {}
  }, [currentQuestion]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCompletionCard, setShowCompletionCard] = useState<boolean>(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(
    null
  );

  const updateActivity = () => {};
  const checkInactivity = () => {};

  const calculateScore = (): number => {
    const totalQuestions = quizData.length || 1;
    let correctAnswers = 0;

    const correctAnswerKey: { [key: number]: string } = {
      0: "c",
      1: "d",
      2: "a",
    };

    Object.keys(selectedAnswers).forEach((qIdx) => {
      const qi = Number(qIdx);
      const sel = selectedAnswers[qi];
      if (correctAnswerKey[qi] && sel === correctAnswerKey[qi])
        correctAnswers++;
    });

    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  const updateQuizState = async (): Promise<void> => {
    return;
  };

  const handleSubmitQuiz = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      const score = calculateScore();
      const answeredCount = Object.keys(selectedAnswers).length;

      const submissionData: CompletionData = {
        name: mockUser.name || "",
        answers: selectedAnswers,
        score,
        completedAt: new Date().toISOString(),
        totalQuestions: quizData.length,
        answeredQuestions: answeredCount,
      };

      try {
        localStorage.setItem("quizResult", JSON.stringify(submissionData));
        localStorage.removeItem("quizSelectedAnswers");
        localStorage.removeItem("quizCurrentQuestion");
      } catch {}

      try {
        const api = await createStudentApi();
        if (quizId) {
          const entries = Object.entries(selectedAnswers);
          await Promise.all(
            entries.map(async ([qIdx, ans]) => {
              const questionIndex = Number(qIdx);
              const questionId = quizData[questionIndex]?.questionId;
              if (!questionId) {
                console.warn(
                  `Skipping submit: missing questionId for index ${questionIndex}`
                );
                return;
              }
              try {
                await api.post("/attempts/submit", {
                  quizId,
                  questionId,
                  answer: String(ans),
                });
              } catch (e) {
                console.warn(
                  `Failed to submit attempt for question ${questionId}:`,
                  e
                );
              }
            })
          );
        }
      } catch (err) {
        console.warn("Failed to submit attempts to server:", err);
      }

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {}
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

    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
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
      } catch (err: any) {
        console.error("Error fetching quiz:", err);
        if (mounted) {
          setQuizData([]);
          setIsAuthenticated(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [quizIdParam, status]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qParam = searchParams?.get("q");
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
    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("selectstart", disableTextSelection);
    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("selectstart", disableTextSelection);
    };
  }, []);

  const totalQuestions = quizData.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const displayScore = completionData
    ? `${completionData.score.toFixed(2)}`
    : `${calculateScore().toFixed(2)}`;

  const canSubmit = Object.keys(selectedAnswers).length > 0 && !isSubmitting;

  const handleGoToLeaderboard = (): void => {
    setShowCompletionCard(false);
    if (quizId) {
      router.push(
        `/leaderboard/departmentLeaderboard?quizId=${encodeURIComponent(
          String(quizId)
        )}`
      );
    } else {
      router.push("/leaderboard");
    }
  };

  const Confetti: React.FC<{ show: boolean }> = ({ show }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
      if (!show) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      const particles: Array<any> = [];

      const colors = ["#DF7500", "#651321", "#FFCD3C", "#8DE969", "#7CC6FF"];

      function rand(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      function createParticle(x: number, y: number) {
        return {
          x,
          y,
          velX: rand(-6, 6),
          velY: rand(-12, -4),
          size: rand(6, 12),
          color: colors[(Math.random() * colors.length) | 0],
          rotation: rand(0, Math.PI * 2),
          rotationSpeed: rand(-0.2, 0.2),
        };
      }

      const centerX = width / 2;
      const centerY = height / 3;
      for (let i = 0; i < 120; i++)
        particles.push(
          createParticle(centerX + rand(-80, 80), centerY + rand(-20, 20))
        );

      let lastTime = performance.now();

      function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }

      window.addEventListener("resize", resize);

      function update(now: number) {
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        ctx.clearRect(0, 0, width, height);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.velY += 30 * dt;
          p.x += p.velX;
          p.y += p.velY * dt * 60 * dt;
          p.rotation += p.rotationSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();

          if (p.y > height + 50) particles.splice(i, 1);
        }

        if (particles.length > 0)
          rafRef.current = requestAnimationFrame(update);
      }

      rafRef.current = requestAnimationFrame(update);

      const stopTimeout = setTimeout(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", resize);
      }, 3200);

      return () => {
        clearTimeout(stopTimeout);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", resize);
      };
    }, [show]);

    return show ? (
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 60,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    ) : null;
  };

  const handleAnswerSelect = (answerId: string): void => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: answerId }));
  };
  const currentQuestionData = quizData[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  if (loading) {
    return (
      <AncientLoader fullScreen={true} text="Preparing Your Challenge..." />
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div
      className="min-h-screen p-4 relative"
      style={{
        background:
          "linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)",
      }}
    >
      <Confetti show={showCompletionCard} />
      {/* Parchment texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Map grid */}
      <div
        className="absolute inset-0 map-grid pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div
        className="max-w-4xl mx-auto"
        style={{ position: "relative", zIndex: 2 }}
      >
        <div className="sticky top-0 z-10 parchment-card rounded-2xl p-4 mb-6 relative">
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
          <div className="flex items-center justify-between">
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{
                fontFamily: "Cinzel, serif",
                color: "#651321",
                letterSpacing: "0.03em",
              }}
            >
              Quest Challenge
            </h1>
            <div>
              <button
                onClick={() => router.back()}
                className="ancient-button flex items-center space-x-2 px-4 py-2 rounded-md font-medium shadow-lg"
              >
                <span>Return</span>
              </button>
            </div>
          </div>
        </div>

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
            <h2
              className="text-xl md:text-2xl font-bold mb-6"
              style={{
                fontFamily: "Cinzel, serif",
                color: "#2C1810",
                letterSpacing: "0.02em",
              }}
            >
              {currentQuestion + 1}.{" "}
              {currentQuestionData?.question ?? "No question available"}
            </h2>

            {currentQuestionData?.image && (
              <div className="mb-6 flex justify-center">
                <img
                  src={currentQuestionData.image}
                  alt="Question illustration"
                  className="w-full max-w-2xl h-auto object-contain rounded-xl shadow-md hover:shadow-lg transition-shadow bg-white"
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
                      ? "shadow-md"
                      : "hover:shadow-sm"
                  }`}
                  style={
                    selectedAnswer === answer.id
                      ? {
                          borderColor: "#C9A961",
                          backgroundColor: "rgba(201, 169, 97, 0.1)",
                          background:
                            "linear-gradient(135deg, rgba(244, 232, 208, 0.8) 0%, rgba(232, 213, 181, 0.8) 100%)",
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
                          style={{ maxHeight: "400px" }}
                        />
                      )}
                      {answer.text && !answer.image && (
                        <span
                          className="font-medium text-lg"
                          style={{
                            color: "#2C1810",
                            fontFamily: "Crimson Text, serif",
                          }}
                        >
                          {answer.text}
                        </span>
                      )}
                      {answer.text && answer.image && (
                        <div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-3 md:space-y-0">
                          <img
                            src={answer.image}
                            alt={`Option ${answer.id}`}
                            className="w-full md:w-96 h-auto object-contain rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            style={{
                              maxHeight: "300px",
                              border: "2px solid #704214",
                              backgroundColor: "#FFF8E7",
                            }}
                          />
                          <span
                            className="font-medium text-lg"
                            style={{
                              color: "#2C1810",
                              fontFamily: "Crimson Text, serif",
                            }}
                          >
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

        <div className="mt-6 text-center">
          <button
            className="ancient-button px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-200 relative"
            style={{
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.5,
              fontSize: "1.1rem",
              letterSpacing: "0.05em",
            }}
            onClick={handleSubmitQuiz}
            disabled={!canSubmit}
          >
            <span className="relative z-10">Submit Scroll</span>
          </button>
        </div>
      </div>

      {showCompletionCard && completionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-xl"
            style={{ background: "rgba(44, 24, 16, 0.7)" }}
          />
          <div className="relative max-w-2xl w-full mx-4">
            <div className="parchment-card p-8 rounded-2xl shadow-2xl relative">
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
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 relative">
                  <img
                    src="/wax-seal.svg"
                    alt="Completed"
                    className="w-full h-full"
                  />
                  <svg
                    className="w-8 h-8 absolute"
                    style={{ color: "#F4E8D0" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2
                  className="text-3xl font-bold mb-2"
                  style={{
                    fontFamily: "Cinzel, serif",
                    color: "#651321",
                    letterSpacing: "0.05em",
                  }}
                >
                  Quest Completed!
                </h2>

                <div
                  className="mt-4 text-sm handwritten"
                  style={{ color: "#4A3426" }}
                >
                  Answered {completionData.answeredQuestions} of{" "}
                  {completionData.totalQuestions} questions
                </div>
                <div className="mt-6 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      setShowCompletionCard(false);
                      router.push(`/quiz-numbers?quizId=${quizId}`);
                    }}
                    className="px-6 py-3 rounded-full font-bold text-lg transition-all duration-200 shadow-sm"
                    style={{
                      fontFamily: "Cinzel, serif",
                      background: "rgba(244, 232, 208, 0.8)",
                      border: "2px solid #704214",
                      color: "#2C1810",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Return to Scrolls
                  </button>

                  <button
                    onClick={handleGoToLeaderboard}
                    className="ancient-button py-3 px-8 rounded-full font-bold text-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    style={{ letterSpacing: "0.03em" }}
                  >
                    View Champions
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
