"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createStudentApi } from "@/interceptors/student";
import { useSession } from "next-auth/react";
import { useUser } from "@/contexts/UserContext";
import AncientLoader from "@/components/AncientLoader";

interface QuizSet {
  quizId: number;
  name: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const _sess = useSession();
  const session = _sess.data;
  const status = (_sess.status ?? "loading") as
    | "loading"
    | "authenticated"
    | "unauthenticated";
  const [quizSets, setQuizSets] = useState<QuizSet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isAlive = true;
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "loading") return;
    if (status === "unauthenticated") return;

    (async () => {
      try {
        const api = await createStudentApi();
        const resp = await api.get("/quizzes/get-quiz-sets");
        const body: any = resp?.data ?? {};

        const sets =
          body?.data?.quizSets ||
          body?.quizSets ||
          body?.quiz ||
          body?.data ||
          body;

        const normalized: QuizSet[] = Array.isArray(sets)
          ? sets.map((s: any) => ({
              quizId: Number(s.quizId),
              name: s.name ?? `Quiz ${s.quizId}`,
            }))
          : [];
        if (isAlive) setQuizSets(normalized);
      } catch (err) {
        console.error("Error fetching quiz sets:", err);
        if (isAlive) setQuizSets([]);
      } finally {
        if (isAlive) setLoading(false);
      }
    })();
    return () => {
      isAlive = false;
    };
  }, [status, router]);

  if (!mounted || String(status) === "loading") {
    return <AncientLoader fullScreen={true} text="Identifying Scholar..." />;
  }
  if (String(status) !== "authenticated") {
    return null;
  }

  const handlePick = (quizId: number) => {
    if (String(status) === "loading") return;
    if (String(status) === "unauthenticated") {
      router.push("/login");
      return;
    }
    router.push(`/quiz-numbers?quizId=${encodeURIComponent(String(quizId))}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
      style={{
        background:
          "linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)",
        overflow: "hidden",
      }}
    >
      {/* Parchment texture */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          opacity: 0.2,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      {/* Map grid */}
      <div
        className="map-grid"
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
      <div
        className="w-full max-w-md mx-auto"
        style={{ position: "relative", zIndex: 2 }}
      >
        <h1
          className="text-3xl md:text-4xl font-bold mb-2 text-center"
          style={{
            fontFamily: "Cinzel, serif",
            color: "#651321",
            letterSpacing: "0.05em",
            textShadow: "2px 2px 4px rgba(112, 66, 20, 0.2)",
          }}
        >
          Available Quests
        </h1>
        <div className="text-center mb-6">
          <div className="text-sm handwritten" style={{ color: "#4A3426" }}>
            {session?.user?.name ?? user?.name
              ? `Greetings, ${session?.user?.name ?? user?.name}`
              : "Welcome, Scholar"}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          {/* 2. Replace the "Unveiling quests..." text block with the loader [cite: 577] */}
          {loading ? (
            <div className="py-10">
              <AncientLoader fullScreen={false} text="Unveiling Quests..." />
            </div>
          ) : !quizSets || quizSets.length === 0 ? (
            // ... existing "No quests" code
            <div
              className="text-center text-sm handwritten"
              style={{ color: "#4A3426" }}
            >
              No quests available at this time.
            </div>
          ) : (
            quizSets.map((q, idx) => (
              <button
                key={q.quizId}
                onClick={() => handlePick(q.quizId)}
                className="ancient-button w-full py-4 rounded-xl shadow-lg font-bold text-lg transition-all duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2"
                style={{ letterSpacing: "0.05em" }}
              >
                {q.name}
              </button>
            ))
          )}
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-8 w-full py-3 rounded-xl font-bold shadow transition-all"
          style={{
            fontFamily: "Cinzel, serif",
            background: "rgba(244, 232, 208, 0.8)",
            color: "#651321",
            border: "2px solid #704214",
            letterSpacing: "0.03em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(232, 213, 181, 0.9)";
            e.currentTarget.style.borderColor = "#C9A961";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(244, 232, 208, 0.8)";
            e.currentTarget.style.borderColor = "#704214";
          }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
