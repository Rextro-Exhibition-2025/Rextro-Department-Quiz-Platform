"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function QuizNumbersPage() {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId") || "1";

  // Mock data for quiz numbers (10 questions)
  const questions = Array.from({ length: 10 }, (_, i) => i + 1);

  // Path coordinates for a winding road (percentage based for responsiveness)
  // These points will be used to draw the SVG path and position markers
  const pathPoints = [
    { x: 10, y: 80 },
    { x: 25, y: 65 },
    { x: 15, y: 45 },
    { x: 35, y: 30 },
    { x: 55, y: 40 },
    { x: 70, y: 25 },
    { x: 85, y: 45 },
    { x: 75, y: 65 },
    { x: 90, y: 80 },
    { x: 95, y: 60 }, // Extra point for path end
  ];

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
        {questions.map((q, index) => {
          // We need to interpolate positions along the curve for better placement if points don't match exactly 1:1 with questions
          // For simplicity in this mockup, we'll map questions directly to points or interpolate slightly if needed.
          // Let's just use the defined points for the first few, and maybe add more points if needed.
          // Actually, let's just place them at the points we defined.
          const point = pathPoints[index % pathPoints.length];

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
