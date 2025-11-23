'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createStudentApi } from '@/interceptors/student';
import type { Number } from './quizNumbers';

export default function QuizNumbersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizIdParam = searchParams.get('quizId');
  const quizId = quizIdParam ? Number(quizIdParam) : null;

  const [numbers, setNumbers] = useState<Number[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptLoadingId, setAttemptLoadingId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>('Quiz');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    let mounted = true;
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    (async () => {
      if (!quizId || Number.isNaN(quizId)) {
        if (quizIdParam && Number.isNaN(Number(quizIdParam))) {
          setErrorMessage('Invalid quizId provided in URL.');
        }
  
        if (mounted) {
          setNumbers(Array.from({ length: 40 }, (_, i) => ({ id: i + 1, label: String(i + 1), taken: false })));
          setLoading(false);
        }
        return;
      }

      try {
        const api = await createStudentApi();
        const url = `/quizzes/${quizId}`;
        console.log('Fetching quiz from', url);
        const resp = await api.get(url);
        const body: any = resp?.data ?? {};
        const quiz = body?.quiz;
        const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
        const total = questions.length || 40;
  
        const generated: Number[] = Array.from({ length: total }, (_, i) => {
          const q = questions[i];
          return {
            id: i + 1,
            label: String(i + 1),
            taken: false,
            questionId: q?._id ?? undefined,
          } as Number;
        });
        if (mounted) {
    
          const init = generated.map((g) => ({ ...g, submitted: false }));
          setNumbers(init);
          setTitle(quiz?.name ?? `Quiz ${quizId}`);
          setErrorMessage(null);

    
          try {
            const attemptsResp: any = await api.get(`/attempts/quiz/${quizId}`);
            const attempts: any[] = attemptsResp?.data?.data ?? [];
      
            const submittedSet = new Set<string>();
            for (const a of attempts) {
              if (a?.submitTime && a?.question) submittedSet.add(String(a.question));
            }
            if (submittedSet.size > 0) {
              setNumbers((prev) => prev.map((n) => ({
                ...n,
                taken: !!n.taken || (n.questionId ? submittedSet.has(String(n.questionId)) : false),
                submitted: n.questionId ? submittedSet.has(String(n.questionId)) : false,
              })));
            }
          } catch (e) {
            console.warn('Could not fetch attempts for quiz:', e);
          }
        }
      } catch (err: any) {
  
        console.error('Error fetching quiz questions:', err);
        let friendly = 'Failed to fetch quiz.';
        if (err?.response) {
          const status = err.response.status;
          const data = err.response.data;
          if (status === 404) {
            friendly = data?.message || `Quiz with id ${quizId} not found.`;
          } else if (data?.message) {
            friendly = data.message;
          } else {
            friendly = `Server returned ${status}`;
          }
        } else if (err?.message) {
          friendly = err.message;
        }

        if (mounted) {
          setErrorMessage(friendly);
          setNumbers(Array.from({ length: 40 }, (_, i) => ({ id: i + 1, label: String(i + 1), taken: false })));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false };
  }, [quizId, status, router]);

  const handleNumberClick = (id: number) => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (!quizId) {
      router.push('/login');
      return;
    }

    const selected = numbers.find((n) => n.id === id);
    const questionId = selected?.questionId;

    const navigateToQuestion = () => {
      const questionIndex = id - 1;
      router.push(`/quiz?quizId=${encodeURIComponent(String(quizId))}&q=${encodeURIComponent(String(questionIndex))}`);
    };

    if (!questionId) {
      setNumbers((prevNumbers) =>
        prevNumbers.map((number) =>
          number.id === id ? { ...number, taken: true } : number
        )
      );
      navigateToQuestion();
      return;
    }

    (async () => {
      setAttemptLoadingId(id);
      try {
        const api = await createStudentApi();
        const resp = await api.post('/attempts/open', { quizId, questionId });
  
        if ((resp?.data as any)?.success) {
          setNumbers((prevNumbers) =>
            prevNumbers.map((number) =>
              number.id === id ? { ...number, taken: true } : number
            )
          );
        }
        navigateToQuestion();
      } catch (err: any) {
        console.error('Failed to open attempt:', err);
        let friendly = 'Failed to open attempt.';
        if (err?.response) {
          const status = err.response.status;
          const data = err.response.data;
          if (data?.message) friendly = data.message;
          else friendly = `Server returned ${status}`;
        } else if (err?.message) {
          friendly = err.message;
        }
        setErrorMessage(friendly);
  
        navigateToQuestion();
      } finally {
        setAttemptLoadingId(null);
      }
    })();
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-4 sm:p-20">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-center">
          <img
            src="/9e244c43-ac14-4148-8ed1-d71b4a3d6c8f.png"
            alt="reference"
            className="hidden"
          />
        </div>

        <h1 className="text-center text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl md:text-3xl">
          {title}
        </h1>
        <br />

        <div className="mt-6 flex justify-center">
          <div className="w-full px-2 sm:px-6 md:px-12">
            {loading ? (
              <div className="text-center text-sm text-gray-600">Loading...</div>
            ) : (
              <div className="grid grid-cols-5 gap-3 sm:grid-cols-5 md:grid-cols-10 md:gap-4 lg:gap-5">
                {numbers.map((number) => {
                  const isSubmitted = !!number.submitted;
                  const isTakenOpen = !!number.taken && !isSubmitted;

                  const disabled = isSubmitted || status === 'loading' || attemptLoadingId === number.id;

                  return (
                    <button
                      key={number.id}
                      onClick={() => !disabled && handleNumberClick(number.id)}
                      disabled={disabled}
                      className={
                        `group relative flex items-center justify-center h-10 rounded-md border-0 px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ` +
                        `${isSubmitted
                          ? "bg-green-600 text-white cursor-not-allowed"
                          : attemptLoadingId === number.id || status === 'loading'
                          ? "bg-blue-200 text-gray-800 opacity-60 cursor-wait"
                          : isTakenOpen
                          ? "bg-blue-100 text-gray-800 transition transform hover:-translate-y-0.5 active:scale-95"
                          : "bg-blue-200 text-gray-800 transition transform hover:-translate-y-0.5 active:scale-95"}`
                      }
                    >
                      <span className="pointer-events-none">{number.label}</span>

                      <span
                        className={
                          `absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-150 ` +
                          (isSubmitted ? " w-6 bg-green-700" : " w-0 bg-transparent")
                        }
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      <br />
      <br />

      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-blue-100 text-gray-800 rounded-md font-semibold shadow-sm transition transform hover:-translate-y-0.5 active:scale-95"
      >
         Go Back
      </button>

    </div>
  );
}
