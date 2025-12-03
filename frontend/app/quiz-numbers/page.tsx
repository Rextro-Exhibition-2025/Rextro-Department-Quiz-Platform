"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation"; // Added useRouter
import { ArrowLeft } from "lucide-react"; // Importing an icon for the back button

export default function QuizNumbersPage() {
  const router = useRouter(); // Initialize router
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId") || "1";

  const [questionCount, setQuestionCount] = useState<number>(0);
  const [quizName, setQuizName] = useState<string>(""); // State for Quiz Name
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Configuration ---
  const ITEM_SPACING_X = 200;
  const MAP_HEIGHT = 600;
  const PADDING_X = 200;

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl =
          process.env.NEXT_PUBLIC_SERVER_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiUrl}/quizzes/${quizId}`);

        if (!response.ok) throw new Error(`Failed to fetch quiz data`);

        const data = await response.json();

        // Handle data structure variations
        const qList = data.quiz?.questions || data.data?.questions || [];
        // Fetch name with fallback
        const qName = data.quiz?.name || data.data?.name || "Unknown Quest";

        setQuizName(qName);

        if (Array.isArray(qList)) {
          setQuestionCount(qList.length);
        } else {
          setQuestionCount(10);
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setQuestionCount(10);
        setQuizName("Mysterious Quest");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [quizId]);

  const questions = Array.from({ length: questionCount }, (_, i) => i + 1);

  // --- Coordinate Logic ---
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
      <div className="relative z-20 flex flex-col md:flex-row items-center justify-center w-full pt-4 pb-2 px-4 shrink-0">
        {/* Back Button (Absolute on Desktop, static on mobile) */}
        <button
          onClick={() => router.push("/departments")}
          className="md:absolute md:left-8 md:top-8 mb-4 md:mb-0 flex items-center gap-2 px-4 py-2 bg-[#fdf6e3] border-2 border-[#8b5a2b] rounded-lg shadow-md hover:bg-[#e3d5b8] hover:scale-105 transition-all text-[#651321] font-bold font-serif z-50"
        >
          <ArrowLeft size={20} />
          <span>Return to Quests</span>
        </button>

        {/* Dynamic Header */}
        <div className="inline-block relative px-12 py-3 text-center">
          <div className="absolute inset-0 bg-[#d4c5a3] transform -skew-x-12 border-2 border-[#8b5a2b] shadow-lg"></div>
          <div className="absolute inset-0 bg-[#fdf6e3] transform skew-x-12 border-2 border-[#8b5a2b] shadow-lg opacity-90"></div>

          <div className="relative flex flex-col items-center justify-center">
            {/* Dynamic Quiz Name */}
            <h1 className="text-2xl md:text-4xl font-bold text-[#651321] drop-shadow-sm tracking-wide font-serif leading-tight">
              {loading ? "Loading..." : quizName}
            </h1>
            {/* Fixed Subtitle */}
            <p className="text-[#8b5a2b] text-sm md:text-base font-bold italic tracking-widest mt-1 uppercase border-t border-[#8b5a2b] pt-1 w-full">
              Quest Map
            </p>
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
          <svg
            className="absolute top-0 left-0 pointer-events-none z-0"
            width={totalMapWidth}
            height={MAP_HEIGHT}
            style={{ overflow: "visible" }}
          >
            <path
              d={generatePath()}
              fill="none"
              stroke="rgba(44,24,16,0.1)"
              strokeWidth="4"
              className="blur-[2px]"
            />
            <path
              d={generatePath()}
              fill="none"
              stroke="#5c4033"
              strokeWidth="2"
              strokeDasharray="8 6"
              strokeLinecap="round"
            />
          </svg>

          {!loading &&
            !error &&
            questions.map((q, index) => {
              const point = pathPoints[index];
              const randomRotate = ((index * 13) % 40) - 20;

              return (
                <Link
                  href={`/quiz?quizId=${quizId}&q=${index}`}
                  key={q}
                  className="absolute group z-20 hover:z-30 transition-all duration-300"
                  style={{
                    left: point.x,
                    top: point.y,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer transition-transform duration-300 group-hover:scale-110">
                    <div className="absolute inset-0 drop-shadow-xl filter sepia-[0.2]">
                      <Image
                        src="/wax-seal.svg"
                        alt="Seal"
                        fill
                        className="object-contain"
                        style={{ transform: `rotate(${randomRotate}deg)` }}
                      />
                    </div>
                    <span
                      className="relative font-bold text-xl md:text-2xl text-[#fdf6e3] drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] font-serif group-hover:text-white"
                      style={{ fontFamily: "Cinzel, serif" }}
                    >
                      {q}
                    </span>
                  </div>
                </Link>
              );
            })}

          {/* Decorative Assets */}
          <div className="absolute top-10 left-10 w-32 h-32 opacity-40 pointer-events-none mix-blend-multiply">
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
