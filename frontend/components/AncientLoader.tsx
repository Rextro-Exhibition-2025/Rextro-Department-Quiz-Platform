"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

interface AncientLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

const LOADING_PHRASES = [
  "Charting the Course...",
  "Deciphering Runes...",
  "Unfurling Scrolls...",
  "Consulting the Stars...",
  "Gathering Ancient Wisdom...",
];

export default function AncientLoader({
  text,
  fullScreen = true,
}: AncientLoaderProps) {
  const [phrase, setPhrase] = useState(LOADING_PHRASES[0]);

  // Cycle through phrases to keep the user entertained during long loads
  useEffect(() => {
    if (text) return; // If specific text is provided, don't cycle
    const interval = setInterval(() => {
      setPhrase((prev) => {
        const currentIndex = LOADING_PHRASES.indexOf(prev);
        return LOADING_PHRASES[(currentIndex + 1) % LOADING_PHRASES.length];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [text]);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fdf6e3]/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={containerClasses}>
      {/* Decorative Compass Animation */}
      <div className="relative w-32 h-32 mb-6">
        {/* Outer Ring - Spinning */}
        <div
          className="absolute inset-0 opacity-80 compass-spin"
          style={{ animationDuration: "4s" }}
        >
          <Image
            src="/compass-rose.svg"
            alt="Loading..."
            fill
            className="object-contain"
          />
        </div>

        {/* Inner Seal - Pulsing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 relative animate-pulse">
            <Image
              src="/wax-seal.svg"
              alt="Seal"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <h3
          className="text-2xl font-bold text-[#651321] transition-all duration-500"
          style={{
            fontFamily: '"Cinzel", serif',
            textShadow: "0 2px 4px rgba(223, 117, 0, 0.2)",
          }}
        >
          {text || phrase}
        </h3>
        <div className="flex justify-center gap-2 mt-2">
          <span
            className="w-2 h-2 rounded-full bg-[#df7500] animate-bounce"
            style={{ animationDelay: "0s" }}
          ></span>
          <span
            className="w-2 h-2 rounded-full bg-[#df7500] animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></span>
          <span
            className="w-2 h-2 rounded-full bg-[#df7500] animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></span>
        </div>
      </div>
    </div>
  );
}
