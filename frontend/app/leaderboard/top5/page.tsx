"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderItem {
  studentId: string | number;
  name: string | null;
  correctCount: number;
  correctPercentage?: number;
  completionTime?: string | number;
  totalTimeTaken?: number;
  attempts?: number;
}

interface QuizSet {
  quizId: number;
  name: string;
}

const Top5PerQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
  const [data, setData] = useState<Record<number, LeaderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const safeFetchJson = async (url: string) => {
          const res = await fetch(url);
          const contentType = res.headers.get('content-type') || '';
          const text = await res.text();

          if (!res.ok) {

            const preview = text?.slice(0, 500);
            throw new Error(`Request to ${url} failed: ${res.status} ${res.statusText} - ${preview}`);
          }

          if (!contentType.includes('application/json')) {
            const preview = text?.slice(0, 500);
            throw new Error(`Expected JSON from ${url} but received content-type: ${contentType} - body preview: ${preview}`);
          }

          try {
            return JSON.parse(text);
          } catch (e: any) {
            throw new Error(`Invalid JSON from ${url}: ${e?.message}`);
          }
        };


        const qsJson = await safeFetchJson('http://localhost:5000/api/quizzes/get-quiz-sets');
        const sets: QuizSet[] = Array.isArray(qsJson.data) ? qsJson.data : [];
        setQuizzes(sets);


        const requests = sets.map((s) =>
          safeFetchJson(`http://localhost:5000/api/leaderboard?quizId=${s.quizId}&limit=5`).then((j) => ({ id: s.quizId, items: Array.isArray(j.data) ? j.data : [] }))
        );

        const results = await Promise.all(requests);
        const map: Record<number, LeaderItem[]> = {};
        results.forEach((r) => {
          map[r.id] = r.items as LeaderItem[];
        });
        setData(map);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to load leaderboards');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) return <div className="p-6">Loading top-5 leaderboards…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  const formatPercent = (p?: number) => {
    if (p == null) return '-';
    let s = Number(p).toFixed(2);
    s = s.replace(/\.?0+$/, '');
    return `${s}%`;
  };

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
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
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2" style={{
            fontFamily: 'Cinzel, serif',
            color: '#651321',
            letterSpacing: '0.05em',
            textShadow: '2px 2px 4px rgba(112, 66, 20, 0.2)'
          }}>Hall of Champions</h1>
          <p className="handwritten" style={{ color: '#4A3426', fontSize: '1.1rem' }}>The most distinguished scholars of each quest.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.quizId}
              href={`/leaderboard/departmentLeaderboard?quizId=${quiz.quizId}`}
              className="block parchment-card rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer relative transform hover:scale-[1.02]"
              aria-label={`View leaderboard details for ${quiz.name ?? `Quiz ${quiz.quizId}`}`}
            >
              <img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
              <img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
              <div className="p-4 border-b-2" style={{
                background: 'linear-gradient(180deg, #651321 0%, #704214 100%)',
                borderColor: '#704214'
              }}>
                <h2 className="text-lg font-bold" style={{
                  fontFamily: 'Cinzel, serif',
                  color: '#F4E8D0',
                  letterSpacing: '0.05em'
                }}>{quiz.name ?? `Quest ${quiz.quizId}`}</h2>
              </div>

              <div className="p-4">
                {(!data[quiz.quizId] || data[quiz.quizId].length === 0) && (
                  <div className="text-sm handwritten" style={{ color: '#4A3426' }}>No champions yet</div>
                )}

                <div className="space-y-3">
                  {data[quiz.quizId]?.map((item, idx) => (
                    <div key={String(item.studentId) + idx} className="flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-sm" style={{
                      background: 'rgba(255, 248, 231, 0.5)',
                      border: '1px solid #C9A961'
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full shadow-sm" style={{
                          background: 'linear-gradient(135deg, #F4E8D0 0%, #E8D5B5 100%)',
                          border: '2px solid #704214'
                        }}>
                          {idx === 0 ? (
                            <img src="/Rank_1.png" alt="1st" className="w-8 h-8" />
                          ) : idx === 1 ? (
                            <img src="/Rank_2.png" alt="2nd" className="w-8 h-8" />
                          ) : idx === 2 ? (
                            <img src="/Rank_3.png" alt="3rd" className="w-8 h-8" />
                          ) : (
                            <span className="font-bold text-sm" style={{ color: '#651321', fontFamily: 'Cinzel, serif' }}>#{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold leading-tight max-w-[12rem] truncate" style={{
                            color: '#2C1810',
                            fontFamily: 'Crimson Text, serif',
                            fontSize: '1rem'
                          }}>{item.name ?? String(item.studentId)}</div>
                          {/* <div className="text-xs text-gray-500">Correct : {item.correctCount ?? '-'}</div> */}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold" style={{
                          color: '#DF7500',
                          fontFamily: 'Cinzel, serif'
                        }}>
                          {item.correctPercentage != null ? formatPercent(item.correctPercentage) : (item.correctCount != null ? String(item.correctCount) : '-')}
                        </div>
                        {/* <div className="text-xs text-gray-500">time: {item.totalTimeTaken ?? '-'}</div> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Top5PerQuiz;
