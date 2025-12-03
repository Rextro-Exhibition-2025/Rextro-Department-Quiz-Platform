"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';
=======
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
import { ChevronRight, Trophy, Brain, Users, Star, Zap, Target, Award } from 'lucide-react';


export default function LandingPage() {
<<<<<<< HEAD
  const [isLoaded, setIsLoaded] = useState(false);
  const [published, setPublished] = useState(false);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    const checkPublishedStatus = async () => {
      try {
        const { createAdminApi } = await import('@/interceptors/admins');
        const api = await createAdminApi();
        const resp = await api.get('/quizzes/check-quiz-published-status');
        setPublished((resp?.data as any)?.isPublished ?? false);
      } catch (error: any) {
        console.error('Error fetching published status:', error?.message ?? error);
      }
    };
    checkPublishedStatus();
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center">
      {/* Main Parchment Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/parchment-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'sepia(0.3) contrast(1.1) brightness(0.9)'
        }}
      />

      {/* Vignette Overlay for depth */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(42, 26, 17, 0.4) 100%)'
        }}
      />

      {/* Map Grid Overlay */}
      <div className="absolute inset-0 z-0 map-grid pointer-events-none opacity-20" />

      {/* Compass Rose - Decorative */}
      <div className="absolute top-10 right-10 w-32 h-32 md:w-48 md:h-48 opacity-20 compass-spin z-0">
        <img src="/compass-rose.svg" alt="" className="w-full h-full" />
      </div>
      <div className="absolute bottom-10 left-10 w-24 h-24 md:w-32 md:h-32 opacity-15 compass-spin z-0" style={{ animationDuration: '90s', animationDirection: 'reverse' }}>
        <img src="/compass-rose.svg" alt="" className="w-full h-full" />
      </div>

      {/* Content Container */}
      <div className={`relative z-10 max-w-5xl mx-auto px-6 py-12 text-center transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

        {/* Decorative Header */}
        <div className="relative inline-block mb-10 p-8">
          {/* Corner Decorations */}
          <img src="/corner-decoration.svg" alt="" className="absolute top-0 left-0 w-12 h-12 md:w-16 md:h-16 opacity-80" />
          <img src="/corner-decoration.svg" alt="" className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 opacity-80 transform scale-x-[-1]" />
          <img src="/corner-decoration.svg" alt="" className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 opacity-80 transform scale-y-[-1]" />
          <img src="/corner-decoration.svg" alt="" className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 opacity-80 transform scale-[-1]" />

          <h1 className="text-5xl md:text-8xl font-bold mb-2" style={{
            fontFamily: 'Cinzel, serif',
            color: '#4a2511',
            textShadow: '2px 2px 0px rgba(212, 175, 55, 0.3), 4px 4px 8px rgba(0,0,0,0.3)',
            letterSpacing: '0.05em'
          }}>
            Challenge Your
          </h1>
          <h1 className="text-6xl md:text-9xl font-bold mb-6" style={{
            fontFamily: 'Cinzel, serif',
            background: 'linear-gradient(180deg, #c04000 0%, #4a2511 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 2px 0px rgba(212, 175, 55, 0.5))'
          }}>
            Mind
          </h1>
        </div>

        <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed handwritten font-bold" style={{
          color: '#2a1a11',
          textShadow: '0 1px 1px rgba(255,255,255,0.5)'
        }}>
          "Dive into an immersive quiz experience where knowledge meets competition.
          Climb the leaderboard, and become the ultimate quiz champion."
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          <button
            disabled={!published}
            className="group ancient-button px-10 py-5 rounded-lg font-bold text-xl flex items-center gap-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            onClick={() => {
              if (!published) return;
              if (sessionStatus === 'authenticated' && session) {
                router.push('/departments');
              } else {
                router.push('/login?callbackUrl=/departments');
              }
            }}
          >
            <Zap className="w-6 h-6 group-hover:animate-pulse text-[#d4af37]" />
            {published ? 'Start Quest' : 'Coming Soon'}
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            className="group px-10 py-5 rounded-lg font-bold text-xl flex items-center gap-3 transition-all duration-300 transform hover:scale-105 relative overflow-hidden shadow-lg"
            style={{
              fontFamily: 'Cinzel, serif',
              background: 'linear-gradient(135deg, #fdf6e3 0%, #e3d5b8 100%)',
              color: '#4a2511',
              border: '2px solid #8b5a2b',
            }}
            onClick={() => router.push('/leaderboard/top5')}
          >
            <div className="absolute inset-0 bg-[#d4af37] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <Trophy className="w-6 h-6 group-hover:animate-bounce text-[#c04000]" />
            View Champions
          </button>
        </div>
      </div>

      {/* Bottom decorative border */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[rgba(42,26,17,0.2)] to-transparent pointer-events-none" />
=======


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

>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
    </div>
  );
}
