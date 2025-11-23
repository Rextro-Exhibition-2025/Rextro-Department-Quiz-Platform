'use client';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStudentApi } from '@/interceptors/student'
import { useSession } from 'next-auth/react'

interface QuizSet {
  quizId: number;
  name: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const _sess = useSession();
  const session = _sess.data;
  const status = (_sess.status ?? 'loading') as 'loading' | 'authenticated' | 'unauthenticated';
  const [quizSets, setQuizSets] = useState<QuizSet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    let isAlive = true;
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'loading') return;
    if (status === 'unauthenticated') return;

    (async () => {
      try {
        const api = await createStudentApi();
        const resp = await api.get('/quizzes/get-quiz-sets');
        const body: any = resp?.data ?? {};
  
        const sets = body?.data?.quizSets || body?.quizSets || body?.quiz || body?.data || body;
  
        const normalized: QuizSet[] = Array.isArray(sets)
          ? sets.map((s: any) => ({ quizId: Number(s.quizId), name: s.name ?? `Quiz ${s.quizId}` }))
          : [];
        if (isAlive) setQuizSets(normalized);
      } catch (err) {
        console.error('Error fetching quiz sets:', err);
        if (isAlive) setQuizSets([]);
      } finally {
        if (isAlive) setLoading(false);
      }
    })();
    return () => { isAlive = false };
  }, [status, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">Checking session...</div>
      </div>
    );
  }
  if (String(status) !== 'authenticated') {
    return null;
  }

  

  const handlePick = (quizId: number) => {
    if (String(status) === 'loading') return;
    if (String(status) === 'unauthenticated') {
      router.push('/login');
      return;
    }
    router.push(`/quiz-numbers?quizId=${encodeURIComponent(String(quizId))}`);
  };
  const buttonStyles = [
    'bg-gradient-to-r from-[#df7500] to-[#651321] text-white',
    'bg-gradient-to-r from-[#651321] to-[#df7500] text-white',
    'bg-gradient-to-r from-[#f59e0b] to-[#7c2d12] text-white',
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-[#fff7ed] to-[#ffe4e1] relative"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#FED9DF',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          backgroundImage: 'url("/Container.png")',
          backgroundSize: 'auto',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top',
          backgroundAttachment: 'scroll',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 1
        }}
      />
      <div className="w-full max-w-md mx-auto" style={{ position: 'relative', zIndex: 2 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-[#651321] mb-6 text-center">Quizzes</h1>
        <div className="flex flex-col gap-5">
          {loading && <div className="text-center text-sm text-gray-600">Loading quizzes...</div>}
          {!loading && (!quizSets || quizSets.length === 0) && (
            <div className="text-center text-sm text-gray-600">No quizzes available.</div>
          )}
          {quizSets && quizSets.map((q, idx) => (
            <button
              key={q.quizId}
              onClick={() => handlePick(q.quizId)}
              className={`w-full py-4 rounded-xl shadow-lg font-semibold text-lg ${buttonStyles[idx % buttonStyles.length]} transition-all duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#df7500]`}
            >
              {q.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-8 w-full py-3 rounded-xl bg-white text-[#651321] font-medium shadow hover:bg-[#df7500]/10 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}