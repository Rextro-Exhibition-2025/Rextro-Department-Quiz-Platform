'use client';

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import type { Number } from "./quizNumbers";

const TOTAL_SEATS = 40;

const generateSeats = (): Number[] =>
  Array.from({ length: TOTAL_SEATS }, (_, i) => ({
    id: i + 1,
    label: String(i + 1),
    taken: false,
  }));

export default function DepartmentPage() {
  const [seats, setSeats] = useState<Number[]>(() => generateSeats());
  const router = useRouter();

  const handleSeatClick = (id: number) => {
    setSeats((prevSeats) =>
      prevSeats.map((seat) =>
        seat.id === id ? { ...seat, taken: true } : seat
      )
    );
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
          Department of Electrical and Information Engineering
        </h1>
        <br></br>

        <div className="mt-6 flex justify-center">
          <div className="w-full px-2 sm:px-6 md:px-12">
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-5 md:grid-cols-10 md:gap-4 lg:gap-5">
              {seats.map((seat) => {
                const isTaken = seat.taken;

                return (
                  <button
                    key={seat.id}
                    onClick={() => !isTaken && handleSeatClick(seat.id)}
                    disabled={isTaken}
                    className={
                      `group relative flex items-center justify-center h-10 rounded-md border-0 px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ` +
                      `${isTaken
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-200 text-gray-800 transition transform hover:-translate-y-0.5 active:scale-95"}`
                    }
                  >
                    <span className="pointer-events-none">{seat.label}</span>

                    <span
                      className={
                        `absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-150 ` +
                        (isTaken ? " w-6 bg-green-700" : " w-0 bg-transparent")
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      <br></br>
      <br></br>

      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-blue-100 text-gray-800 rounded-md font-semibold shadow-sm transition transform hover:-translate-y-0.5 active:scale-95"
      >
         Go Back
      </button>

    </div>
  );
}
