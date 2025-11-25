'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createStudentApi } from '@/interceptors/student';
import NavBar from '@/components/NavBar/NavBar';
import Footer from '@/components/Footer/Footer';
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

            
            const stateMap = new Map<string, { opened: boolean; submitted: boolean }>();
            for (const a of attempts) {
              const qid = a?.question ? String(a.question) : null;
              if (!qid) continue;
              const existing = stateMap.get(qid) ?? { opened: false, submitted: false };

              
              if (a?.submitTime) {
                existing.submitted = true;
                existing.opened = true;
              } else if (a?.openTime) {
                
                existing.opened = true;
              }

              stateMap.set(qid, existing);
            }

            if (stateMap.size > 0) {
              setNumbers((prev) => prev.map((n) => {
                const qid = n.questionId ? String(n.questionId) : null;
                const s = qid ? stateMap.get(qid) : undefined;
                return {
                  ...n,
                  taken: !!n.taken || !!s?.opened || !!s?.submitted,
                  submitted: !!s?.submitted || !!n.submitted,
                };
              }));
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
    <div className="min-h-screen flex flex-col items-center bg-white">
      <NavBar />
      <div className="w-full max-w-4xl mt-6 flex-1">
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

                  const stateText = isSubmitted ? 'Submitted' : isTakenOpen ? 'Opened' : 'Not opened';

                  return (
                    <button
                      key={number.id}
                      onClick={() => !disabled && handleNumberClick(number.id)}
                      disabled={disabled}
                      title={stateText}
                      aria-label={`Question ${number.label} - ${stateText}`}
                          className={
                            `group relative flex items-center justify-center h-10 rounded-md border-0 px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ` +
                            `${isSubmitted
                              ? "bg-gradient-to-r from-[#0DB3A2] to-[#005F56] text-white cursor-not-allowed"
                              : attemptLoadingId === number.id || status === 'loading'
                              ? "bg-[#df7500]/50 text-[#651321] opacity-60 cursor-wait"
                              : isTakenOpen
                              ? "bg-gradient-to-r from-[#df7500] to-[#651321] text-[#fff] transition transform hover:-translate-y-0.5 active:scale-95 hover:bg-[#df7500]/20"
                              : "bg-[#cd880b]/20 text-[#651321] border border-[#dfd7d0] transition transform hover:-translate-y-0.5 active:scale-95 hover:bg-[#df7500]/10"}`
                          }
                    >
                      <span className="pointer-events-none">{number.label}</span>

                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>


      <button
        onClick={() => router.push('/departments')}
        className="m-8 w-58 py-3 border rounded-xl bg-white text-[#651321] font-medium shadow hover:bg-[#df7500]/10 transition"
      >
         Back to Departments
      </button>
      <Footer />

    </div>
  );
}
