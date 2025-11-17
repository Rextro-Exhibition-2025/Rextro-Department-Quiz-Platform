"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Trophy, Brain, Users, Star, Zap, Target, Award } from 'lucide-react';


export default function LandingPage() {


  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [published, setPublished] = useState(false);
  const router = useRouter();
useEffect(() => {
	const checkPublishedStatus = async () => {
		
		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/check-quiz-published-status`);
			const data = await response.json();
			setPublished(data?.isPublished ?? false);
		} catch (error) {
			console.error('Error fetching published status:', error);
		}
	};
	checkPublishedStatus();
}, []);

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-[#df7500]/10 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x * 0.02 + '%',
            top: mousePosition.y * 0.02 + '%'
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#651321]/10 rounded-full blur-2xl animate-bounce"
          style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-[#df7500]/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: '3s' }} />
      </div>

      {/* Hero Section */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 py-20 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-[#651321] mb-6 leading-tight">
            Challenge Your
            <span className="bg-gradient-to-r from-[#df7500] via-[#651321] to-[#df7500] bg-clip-text text-transparent block">
              Mind
            </span>
          </h1>

          <p className="text-xl text-[#651321] mb-12 max-w-2xl mx-auto leading-relaxed">
            Dive into an immersive quiz experience where knowledge meets competition.
            Climb the leaderboard, and become the ultimate quiz champion.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
            disabled={!published}
              className="group bg-gradient-to-r from-[#df7500] to-[#651321] text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 hover:from-[#df7500]/80 hover:to-[#651321]/80 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                router.push('/login');
              }}
            >
              <Zap className="w-5 h-5 group-hover:animate-pulse" />
              {published ? 'Start Quiz' : 'Comming Soon'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              disabled={!published}
              className="group bg-[#df7500]/10 backdrop-blur-sm text-[#651321] px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 hover:bg-[#df7500]/20 transition-all duration-300 transform hover:scale-105 border border-[#df7500]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => router.push('/leaderboard')}
            >
              <Trophy className="w-5 h-5 group-hover:animate-bounce text-[#df7500]" />
              View Leaderboard
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
