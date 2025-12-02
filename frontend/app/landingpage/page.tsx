"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';
import { ChevronRight, Trophy, Brain, Users, Star, Zap, Target, Award } from 'lucide-react';


export default function LandingPage() {


  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [published, setPublished] = useState(false);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { user, loading: userLoading } = useUser();
useEffect(() => {
  const checkPublishedStatus = async () => {
    try {
      
      const { createAdminApi } = await import('@/interceptors/admins');
      const api = await createAdminApi();
      const resp = await api.get('/quizzes/check-quiz-published-status');
      setPublished((resp?.data as any)?.isPublished ?? false);
    } catch (error: any) {
      
      if (error?.response) {
        console.error('Error fetching published status: response', error.response.status, error.response.data);
      } else if (error?.request) {
        console.error('Error fetching published status: no response received (network/CORS/blocked)', error.message);
      } else {
        console.error('Error fetching published status:', error?.message ?? error);
      }
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)'
    }}>
      {/* Parchment texture overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`
      }} />

      {/* Compass rose background */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 opacity-10 compass-spin">
        <img src="/compass-rose.svg" alt="" className="w-full h-full" />
      </div>
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 opacity-10 compass-spin" style={{ animationDuration: '90s', animationDirection: 'reverse' }}>
        <img src="/compass-rose.svg" alt="" className="w-full h-full" />
      </div>

      {/* Map grid lines */}
      <div className="absolute inset-0 map-grid pointer-events-none" />

      {/* Hero Section */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 py-20 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center">
          {/* Decorative header with ancient styling */}
          <div className="relative inline-block mb-8">
            <img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
            <img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4 px-12" style={{
              fontFamily: 'Cinzel, serif',
              color: '#651321',
              textShadow: '2px 2px 4px rgba(112, 66, 20, 0.2)',
              letterSpacing: '0.05em'
            }}>
              Challenge Your
              <span className="block mt-2" style={{
                background: 'linear-gradient(90deg, #DF7500 0%, #651321 50%, #DF7500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Mind
              </span>
            </h1>
            
            <img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-left" />
            <img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-right" />
          </div>

          <p className="text-xl mb-12 max-w-2xl mx-auto leading-relaxed handwritten" style={{
            color: '#4A3426',
            fontSize: '1.15rem'
          }}>
            Dive into an immersive quiz experience where knowledge meets competition.
            Climb the leaderboard, and become the ultimate quiz champion.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              disabled={!published}
              className="group ancient-button px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontSize: '1.1rem',
                letterSpacing: '0.05em'
              }}
              onClick={() => {
                if (!published) return;
                if (sessionStatus === 'authenticated' && session) {
                  router.push('/departments');
                } else {
                  router.push('/login?callbackUrl=/departments');
                }
              }}
            >
              <Zap className="w-5 h-5 group-hover:animate-pulse" />
              {published ? 'Start Quest' : 'Coming Soon'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              disabled={!published}
              className="group px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed relative"
              style={{
                fontFamily: 'Cinzel, serif',
                background: 'rgba(244, 232, 208, 0.6)',
                color: '#651321',
                border: '2px solid #C9A961',
                fontSize: '1.1rem',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 6px rgba(44, 24, 16, 0.15)'
              }}
              onClick={() => router.push('/leaderboard/top5')}
            >
              <Trophy className="w-5 h-5 group-hover:animate-bounce" style={{ color: '#DF7500' }} />
              View Champions
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
