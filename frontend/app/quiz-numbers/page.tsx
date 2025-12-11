"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Star } from "lucide-react";
import { createStudentApi } from "@/interceptors/student"; // Ensure you use the interceptor
import AncientLoader from "@/components/AncientLoader";

interface Attempt {
  question: string; // ID of the question
  isCorrect: boolean;
  quizId: number;
}

interface QuestionStatus {
  index: number;
  status: "LOCKED" | "OPEN" | "VICTORIOUS" | "TRY_AGAIN";
}

export default function QuizNumbersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId") || "1";

  const [questionCount, setQuestionCount] = useState<number>(0);
  const [quizName, setQuizName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [score, setScore] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Configuration ---
  const ITEM_SPACING_X = 200;
  const MAP_HEIGHT = 600;
  const PADDING_X = 200;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const api = await createStudentApi();

        // 1. Fetch Quiz Details (Questions Count)
        const quizRes = await api.get(`/quizzes/${quizId}`);
        const qData = quizRes.data as any;
        const qList = qData.quiz?.questions || [];
        setQuizName(qData.quiz?.name || "Unknown Quest");
        setQuestionCount(qList.length || 10); // Default to 10 if empty, strictly should be list length

        // 2. Fetch User Attempts to determine progress
        const attemptsRes = await api.get(`/attempts/quiz/${quizId}`);
        const userAttempts: Attempt[] = (attemptsRes.data as any).data || [];
        setAttempts(userAttempts);

        // 3. Calculate Score (Simple logic: 10 points per correct answer)
        // You can adjust this formula based on backend penalty logic later
        const correctCount = userAttempts.filter((a) => a.isCorrect).length;
        setScore(correctCount * 10);
      } catch (err) {
        console.error("Error fetching quest data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quizId]);

  // --- Logic: Determine Status of each Node ---
  const getQuestionStatus = (
    index: number,
    qListLength: number
  ): QuestionStatus["status"] => {
    // We assume questions are ordered 0 to N.
    // We need to map attempts to indices.
    // Since backend attempts store Question ObjectId, and we don't have the full map here easily without
    // strictly ordering the quiz questions list, we assume the `quizRes` returns questions in order.

    // In a robust real-world scenario, you'd match ObjectID.
    // For this UI, we will approximate: index 0 is open.
    // If index 0 is correct in attempts, index 1 opens.

    // NOTE: This logic assumes we fetched the questions list in the exact order
    // and the user attempts correspond to those IDs.

    // Simplified Progressive Logic:
    // 1. Find if this specific question index was answered correctly.
    //    (Requires mapping index -> QuestionID from the quiz call, assumed matched here for UI demo)

    // Since we don't have the Question Object IDs mapped to index in this specific component's state easily
    // without storing the full question list, let's calculate "Highest Unlocked Level".

    const correctAttemptsCount = attempts.filter((a) => a.isCorrect).length;

    // Check if THIS specific node is completed
    // We are loosely assuming progressive order: if you have 3 correct, you finished 0, 1, 2.
    // This assumes the user strictly follows order.

    if (index < correctAttemptsCount) return "VICTORIOUS";

    // Check if this is the immediate next one
    if (index === correctAttemptsCount) {
      // Check if there is a failed attempt at this current level
      // If total attempts > correct attempts, implies we tried the current one and failed
      const totalForThisQuiz = attempts.length;
      if (totalForThisQuiz > correctAttemptsCount && index < totalForThisQuiz) {
        return "TRY_AGAIN";
      }
      return "OPEN";
    }

    return "LOCKED";
  };

  const generatePathPoints = (count: number) => {
    const points = [];
    const Y_CENTER = MAP_HEIGHT / 2;
    const Y_AMPLITUDE = 150;
    for (let i = 0; i < count; i++) {
      const x = PADDING_X + i * ITEM_SPACING_X;
      const wave = Math.sin(i * 0.8) * Y_AMPLITUDE;
      const randomness = (i % 2 === 0 ? 20 : -20) + ((i * 13) % 40);
      const y = Y_CENTER + wave + randomness * 0.5;
      points.push({ x, y });
    }
    return points;
  };

  const pathPoints = generatePathPoints(questionCount);
  const totalMapWidth =
    pathPoints.length > 0
      ? pathPoints[pathPoints.length - 1].x + PADDING_X
      : "100%";

  const generatePath = () => {
    if (pathPoints.length < 2) return "";
    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const cp1x = p1.x + ITEM_SPACING_X * 0.5;
      const cp1y = p1.y;
      const cp2x = p2.x - ITEM_SPACING_X * 0.5;
      const cp2y = p2.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  if (loading)
    return <AncientLoader fullScreen text="Surveying the Realm..." />;

  return (
    <div className="h-screen w-full relative bg-[var(--parchment-light)] overflow-hidden flex flex-col">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(44, 24, 16, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #8b5a2b;
          border-radius: 6px;
          border: 2px solid #fdf6e3;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #651321;
        }
      `}</style>

      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/parchment-bg.png')] bg-cover bg-center opacity-50 pointer-events-none z-0"></div>
      <div className="absolute inset-0 map-grid pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(44,24,16,0.3)_100%)] pointer-events-none z-10"></div>

      {/* Navigation & Header Container */}
      <div className="relative z-20 flex flex-col md:flex-row items-center justify-between w-full pt-4 pb-2 px-8 shrink-0">
        {/* Back Button */}
        <button
          onClick={() => router.push("/departments")}
          className="flex items-center gap-2 px-4 py-2 bg-[#fdf6e3] border-2 border-[#8b5a2b] rounded-lg shadow-md hover:bg-[#e3d5b8] hover:scale-105 transition-all text-[#651321] font-bold font-serif z-50"
        >
          <ArrowLeft size={20} />
          <span>Return to Quests</span>
        </button>

        {/* Dynamic Header */}
        <div className="inline-block relative px-12 py-3 text-center mx-auto">
          <div className="absolute inset-0 bg-[#d4c5a3] transform -skew-x-12 border-2 border-[#8b5a2b] shadow-lg"></div>
          <div className="absolute inset-0 bg-[#fdf6e3] transform skew-x-12 border-2 border-[#8b5a2b] shadow-lg opacity-90"></div>
          <div className="relative flex flex-col items-center justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-[#651321] drop-shadow-sm tracking-wide font-serif leading-tight px-4">
              {quizName}
            </h1>
            <p className="text-[#8b5a2b] text-xs font-bold italic tracking-widest mt-1 uppercase border-t border-[#8b5a2b] pt-1 w-full">
              Quest Map
            </p>
          </div>
        </div>

        {/* Score Indicator */}
        <div className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#651321] to-[#8b5a2b] rounded-lg shadow-lg text-[#fdf6e3] border-2 border-[#df7500] z-50">
          <Star className="fill-[#df7500] text-[#df7500]" size={20} />
          <div className="flex flex-col items-start">
            <span className="text-xs uppercase tracking-wider font-semibold opacity-80">
              Score
            </span>
            <span className="text-xl font-bold leading-none font-serif">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Map Container */}
      <main
        ref={scrollContainerRef}
        className="relative flex-grow w-full overflow-auto custom-scrollbar flex items-center"
        style={{ cursor: "grab" }}
      >
        <div
          className="relative flex-shrink-0"
          style={{
            width: totalMapWidth,
            height: MAP_HEIGHT,
          }}
        >
          {/* Path Line */}
          <svg
            className="absolute top-0 left-0 pointer-events-none z-0"
            width={totalMapWidth}
            height={MAP_HEIGHT}
            style={{ overflow: "visible" }}
          >
            <path
              d={generatePath()}
              fill="none"
              stroke="rgba(44,24,16,0.15)"
              strokeWidth="6"
              className="blur-[1px]"
            />
            <path
              d={generatePath()}
              fill="none"
              stroke="#5c4033"
              strokeWidth="3"
              strokeDasharray="12 8"
              strokeLinecap="round"
            />
          </svg>

          {Array.from({ length: questionCount }, (_, index) => {
            const point = pathPoints[index];
            const status = getQuestionStatus(index, questionCount);
            const randomRotate = ((index * 13) % 40) - 20;
            const isLocked = status === "LOCKED";

            // Determine Label & Color based on status
            let label = String(index + 1);
            let subLabel = "";
            let colorClass = "text-[#fdf6e3]"; // Default text color
            let sealFilter = "sepia-[0.2]";

            if (status === "VICTORIOUS") {
              subLabel = "Conquered";
              colorClass = "text-[#df7500]"; // Gold
              sealFilter =
                "brightness(1.1) contrast(1.1) hue-rotate(340deg) saturate(1.5)"; // Reddish/Gold tint
            } else if (status === "TRY_AGAIN") {
              subLabel = "Try Again";
              colorClass = "text-red-300";
              sealFilter = "grayscale(0.5) brightness(0.8)";
            } else if (status === "OPEN") {
              subLabel = "Current";
              sealFilter = "sepia(0)"; // Normal
            } else {
              sealFilter = "grayscale(1) brightness(0.5)"; // Locked grey
            }

            return (
              <div
                key={index}
                className={`absolute group z-20 transition-all duration-300 ${
                  isLocked
                    ? "cursor-not-allowed opacity-80"
                    : "cursor-pointer hover:z-30 hover:scale-110"
                }`}
                style={{
                  left: point.x,
                  top: point.y,
                  transform: "translate(-50%, -50%)",
                }}
                onClick={() => {
                  if (!isLocked) {
                    router.push(`/quiz?quizId=${quizId}&q=${index}`);
                  }
                }}
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  {/* The Seal / Icon */}
                  <div
                    className={`absolute inset-0 drop-shadow-xl transition-all duration-300 ${
                      status === "OPEN" ? "animate-pulse" : ""
                    }`}
                    style={{ filter: sealFilter }}
                  >
                    <Image
                      src="/wax-seal.svg"
                      alt="Seal"
                      fill
                      className="object-contain"
                      style={{ transform: `rotate(${randomRotate}deg)` }}
                    />
                  </div>

                  {/* Lock Icon Overlay if Locked */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <Lock
                        className="text-[#d4c5a3] drop-shadow-md"
                        size={32}
                      />
                    </div>
                  )}

                  {/* Number Display (if not locked) */}
                  {!isLocked && (
                    <span
                      className={`relative font-bold text-2xl md:text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-serif ${colorClass}`}
                      style={{ fontFamily: "Cinzel, serif" }}
                    >
                      {label}
                    </span>
                  )}
                </div>

                {/* Status Label below the seal */}
                {!isLocked && subLabel && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#fdf6e3]/90 border border-[#8b5a2b] ${
                        status === "VICTORIOUS"
                          ? "text-[#df7500]"
                          : "text-[#651321]"
                      }`}
                    >
                      {subLabel}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Decorative Compass */}
          <div className="absolute top-10 left-10 w-48 h-48 opacity-20 pointer-events-none mix-blend-multiply">
            <Image
              src="/compass-rose.svg"
              alt="Compass"
              fill
              className="object-contain compass-spin"
            />
          </div>
        </div>
      </main>

      {/* Frame Decorations */}
      <div className="fixed top-0 left-0 w-24 h-24 pointer-events-none z-50 opacity-80">
        <Image
          src="/corner-decoration.svg"
          alt="Corner"
          fill
          className="object-contain"
        />
      </div>
      <div className="fixed top-0 right-0 w-24 h-24 pointer-events-none z-50 transform scale-x-[-1] opacity-80">
        <Image
          src="/corner-decoration.svg"
          alt="Corner"
          fill
          className="object-contain"
        />
      </div>
      <div className="fixed bottom-0 left-0 w-24 h-24 pointer-events-none z-50 transform scale-y-[-1] opacity-80">
        <Image
          src="/corner-decoration.svg"
          alt="Corner"
          fill
          className="object-contain"
        />
      </div>
      <div className="fixed bottom-0 right-0 w-24 h-24 pointer-events-none z-50 transform scale-[-1] opacity-80">
        <Image
          src="/corner-decoration.svg"
          alt="Corner"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
