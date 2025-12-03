"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function QuizNumbersPage() {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId") || "1";
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz data to get the number of questions
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:5000/api/quiz/${quizId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch quiz data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.quiz && data.quiz.questions) {
          setQuestionCount(data.quiz.questions.length);
        } else {
          throw new Error("Invalid quiz data format");
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err instanceof Error ? err.message : "Failed to load quiz");
        setQuestionCount(10); // Fallback to 10 questions
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  // Generate dynamic questions array based on fetched count
  const questions = Array.from({ length: questionCount }, (_, i) => i + 1);

  // Generate dynamic path points based on the number of questions
  const generatePathPoints = (count: number) => {
    const points = [];
    const sections = Math.ceil(count / 2); // Divide into sections for winding pattern
    
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1 || 1); // 0 to 1
      const section = Math.floor(i / 2);
      
      // Create a winding pattern that adjusts to question count
      let x, y;
      
      if (i % 4 === 0) {
        x = 10 + (progress * 20);
        y = 80 - (progress * 20);
      } else if (i % 4 === 1) {
        x = 30 + (progress * 20);
        y = 60 - (progress * 10);
      } else if (i % 4 === 2) {
        x = 50 + (progress * 20);
        y = 50 - (progress * 15);
      } else {
        x = 70 + (progress * 20);
        y = 40 + (progress * 10);
      }
      
      // Add some variation based on position
      x = Math.min(95, Math.max(5, x + (i % 3 - 1) * 5));
      y = Math.min(90, Math.max(10, y + (i % 2) * 10));
      
      points.push({ x, y });
    }
    
    return points;
  };

  const pathPoints = generatePathPoints(questionCount);

  // Generate SVG path string
  // Using cubic bezier curves for smooth winding road
  const generatePath = () => {
    if (pathPoints.length < 2) return "";

    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`;

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];

      // Control points for curvature
      // Alternating curve direction for "winding" effect
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp1y = i % 2 === 0 ? p1.y - 15 : p1.y + 15;

      const cp2x = p1.x + (p2.x - p1.x) / 2;
      const cp2y = i % 2 === 0 ? p2.y + 15 : p2.y - 15;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[url('/parchment-bg.png')] bg-cover bg-center bg-no-repeat text-[var(--ink-dark)] font-serif">
      {/* Overlay Textures */}
      <div className="absolute inset-0 bg-[var(--parchment)] opacity-20 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute inset-0 map-grid pointer-events-none"></div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(44,24,16,0.4)_100%)] pointer-events-none z-10"></div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-[var(--parchment)] bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--sepia)] border-t-transparent mx-auto mb-4"></div>
            <p className="text-xl font-bold text-[var(--ink-dark)]">Loading Quest Map...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-[var(--parchment)] bg-opacity-95">
          <div className="text-center max-w-md px-6">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Quest Map Unavailable</h2>
            <p className="text-[var(--ink-dark)] mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--deep-brown)] text-[var(--parchment-light)] font-bold rounded border-2 border-[var(--sepia)] hover:bg-[var(--sepia)] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <header className="relative z-20 pt-4 md:pt-8 pb-2 md:pb-4 text-center">
        <div className="inline-block relative px-8 py-3 md:px-12 md:py-4">
          {/* Banner Background (SVG or CSS shape) */}
          <div className="absolute inset-0 bg-[var(--parchment-dark)] transform -skew-x-12 border-2 border-[var(--sepia)] shadow-lg"></div>
          <div className="absolute inset-0 bg-[var(--parchment)] transform skew-x-12 border-2 border-[var(--sepia)] shadow-lg opacity-80"></div>

          <h1 className="relative text-3xl md:text-5xl font-bold text-[var(--ink-dark)] drop-shadow-md tracking-wider">
            The Quest Map
          </h1>
          <p className="relative text-[var(--sepia)] text-sm md:text-base italic mt-1 font-bold">Journey of Knowledge</p>
        </div>
      </header>

      {/* Main Map Area */}
      <main className="relative w-full max-w-6xl mx-auto h-[75vh] md:h-[80vh] mt-2 md:mt-4">

        {/* SVG Path Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Shadow Path */}
          <path
            d={generatePath()}
            fill="none"
            stroke="rgba(44,24,16,0.2)"
            strokeWidth="1.5"
            strokeDasharray="2 1"
            className="blur-[1px]"
          />
          {/* Main Path */}
          <path
            d={generatePath()}
            fill="none"
            stroke="var(--deep-brown)"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            strokeLinecap="round"
          />
        </svg>

        {/* Markers */}
        {!loading && !error && questions.map((q, index) => {
          // Use the dynamically generated path points
          const point = pathPoints[index] || pathPoints[pathPoints.length - 1];

          // Randomize slight offset for "hand-drawn" feel
          const randomRotate = (index * 13) % 20 - 10;

          return (
            <Link
              href={`/quiz?id=${quizId}&q=${q}`}
              key={q}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 hover:z-30 transition-all duration-300"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            >
              <div className="relative w-12 h-12 md:w-20 md:h-20 flex items-center justify-center cursor-pointer transition-transform duration-300 group-hover:scale-110">
                {/* Wax Seal / Coin Background */}
                <div className="absolute inset-0 drop-shadow-lg">
                  <Image
                    src="/wax-seal.svg"
                    alt="Seal"
                    fill
                    className={`object-contain opacity-90 group-hover:opacity-100 transition-opacity`}
                    style={{ transform: `rotate(${randomRotate}deg)` }}
                  />
                </div>

                {/* Number */}
                <span className="relative font-bold text-lg md:text-2xl text-[var(--parchment-light)] drop-shadow-md font-serif group-hover:text-white">
                  {q}
                </span>

                {/* Hover Tooltip */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--parchment-light)] border border-[var(--sepia)] px-3 py-1 rounded shadow-md text-xs md:text-sm font-bold whitespace-nowrap text-[var(--ink-dark)] pointer-events-none hidden md:block">
                  Question {q}
                </div>
              </div>
            </Link>
          );
        })}

        {/* Decorative Elements */}

        {/* Compass Rose */}
        <div className="absolute bottom-4 right-4 w-20 h-20 md:bottom-8 md:right-8 md:w-48 md:h-48 opacity-80 pointer-events-none">
          <Image src="/compass-rose.svg" alt="Compass" fill className="object-contain compass-spin" />
        </div>

        {/* Globe/Ship */}
        <div className="absolute top-10 left-10 w-24 h-24 opacity-60 pointer-events-none hidden md:block">
          <Image src="/globe.svg" alt="Globe" fill className="object-contain" />
        </div>

        {/* Scroll Decoration */}
        <div className="absolute bottom-10 left-20 w-32 h-auto opacity-70 pointer-events-none hidden md:block transform -rotate-12">
          <Image src="/scroll-decoration.svg" alt="Scroll" width={120} height={60} className="object-contain" />
        </div>

      </main>

      {/* Corner Decorations */}
      <div className="fixed top-0 left-0 w-16 h-16 md:w-32 md:h-32 pointer-events-none z-50">
        <Image src="/corner-decoration.svg" alt="Corner" fill className="object-contain" />
      </div>
      <div className="fixed top-0 right-0 w-16 h-16 md:w-32 md:h-32 pointer-events-none z-50 transform scale-x-[-1]">
        <Image src="/corner-decoration.svg" alt="Corner" fill className="object-contain" />
      </div>
      <div className="fixed bottom-0 left-0 w-16 h-16 md:w-32 md:h-32 pointer-events-none z-50 transform scale-y-[-1]">
        <Image src="/corner-decoration.svg" alt="Corner" fill className="object-contain" />
      </div>
      <div className="fixed bottom-0 right-0 w-16 h-16 md:w-32 md:h-32 pointer-events-none z-50 transform scale-[-1]">
        <Image src="/corner-decoration.svg" alt="Corner" fill className="object-contain" />
      </div>

    </div>
  );
}
