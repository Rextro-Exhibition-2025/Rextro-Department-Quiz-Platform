"use client";
import React, { useEffect, useState } from 'react';
import { Trophy, Star, Menu, ChevronDown, X } from 'lucide-react';
import { createStudentApi } from '@/interceptors/student';
import { useUser } from '@/contexts/UserContext';
import { transformLeaderboard } from './leaderboardTransformer';

interface StudentData {
  id: number;
  name: string;
  score: number;
}

interface SchoolData {
  id: number;
  name: string;
  score: number;
  rank: number;
  students: StudentData[];
}

const Leaderboard: React.FC = () => {
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  // const [userQuizResult, setUserQuizResult] = useState<any>(null);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const user = useUser();

  useEffect(() => {
    console.log("callingggggggg");
    
    // Fetch leaderboard data from backend API
    const fetchLeaderboard = async () => {

      try {

        const api = await createStudentApi({ token: user.user?.authToken || '' });
        const response: any = await api.get(`/quizzes/get-leaderboard`);

        
        setSchools(transformLeaderboard(response.data.data));

      } catch (error) {

        console.error('Error fetching leaderboard data:', error);

      }


  

    


    }

    fetchLeaderboard();
  }, []);

  // React.useEffect(() => {
  //   if (document.fullscreenElement && document.exitFullscreen) {
  //     document.exitFullscreen();
  //   }

  // Check for user's quiz result
  //   const quizResult = localStorage.getItem('quizResult');
  //   if (quizResult) {
  //     try {
  //       const parsedResult = JSON.parse(quizResult);
  //       setUserQuizResult(parsedResult);
  //       // Clear the result after showing it
  //       setTimeout(() => {
  //         localStorage.removeItem('quizResult');
  //       }, 5000); // Remove after 5 seconds
  //     } catch (error) {
  //       console.error('Error parsing quiz result:', error);
  //     }
  //   }
  // }, []);
  // const [schools] = useState<SchoolData[]>([
  //   {
  //     id: 1,
  //     name: "St. Mary's International School",
  //     score: 150,
  //     rank: 1,
  //     students: [
  //       { id: 1, name: "Emma Johnson", score: 50 },
  //       { id: 2, name: "Liam Smith", score: 50 },
  //       { id: 3, name: "Olivia Davis", score: 50 }
  //     ]
  //   },
  //   {
  //     id: 2,
  //     name: "Greenwood Academy",
  //     score: 149,
  //     rank: 2,
  //     students: [
  //       { id: 4, name: "Noah Wilson", score: 50 },
  //       { id: 5, name: "Ava Brown", score: 49 },
  //       { id: 6, name: "Ethan Taylor", score: 50 }
  //     ]
  //   },
  //   {
  //     id: 3,
  //     name: "Riverside High School",
  //     score: 148,
  //     rank: 3,
  //     students: [
  //       { id: 7, name: "Sophia Anderson", score: 49 },
  //       { id: 8, name: "Mason Thomas", score: 50 },
  //       { id: 9, name: "Isabella Jackson", score: 49 }
  //     ]
  //   },
  //   {
  //     id: 4,
  //     name: "Oakwood Preparatory School",
  //     score: 146,
  //     rank: 4,
  //     students: [
  //       { id: 10, name: "William White", score: 48 },
  //       { id: 11, name: "Charlotte Harris", score: 49 },
  //       { id: 12, name: "James Martin", score: 49 }
  //     ]
  //   },
  //   {
  //     id: 5,
  //     name: "Sunrise Elementary School",
  //     score: 143,
  //     rank: 5,
  //     students: [
  //       { id: 13, name: "Benjamin Garcia", score: 47 },
  //       { id: 14, name: "Amelia Martinez", score: 48 },
  //       { id: 15, name: "Lucas Rodriguez", score: 48 }
  //     ]
  //   },
  //   {
  //     id: 6,
  //     name: "Mountain View School",
  //     score: 142,
  //     rank: 6,
  //     students: [
  //       { id: 16, name: "Mia Lopez", score: 47 },
  //       { id: 17, name: "Alexander Lee", score: 47 },
  //       { id: 18, name: "Harper Gonzalez", score: 48 }
  //     ]
  //   },
  //   {
  //     id: 7,
  //     name: "Central High School",
  //     score: 138,
  //     rank: 7,
  //     students: [
  //       { id: 19, name: "Evelyn Wilson", score: 46 },
  //       { id: 20, name: "Sebastian Moore", score: 46 },
  //       { id: 21, name: "Abigail Taylor", score: 46 }
  //     ]
  //   },
  //   {
  //     id: 8,
  //     name: "Northside Academy",
  //     score: 135,
  //     rank: 8,
  //     students: [
  //       { id: 22, name: "Michael Anderson", score: 45 },
  //       { id: 23, name: "Emily Thomas", score: 45 },
  //       { id: 24, name: "Daniel Jackson", score: 45 }
  //     ]
  //   }
  //   ,
  //   {
  //     id: 9, name: "Eastwood School", score: 132, rank: 9, students: [
  //       { id: 25, name: "Ella King", score: 44 },
  //       { id: 26, name: "Henry Wright", score: 44 },
  //       { id: 27, name: "Grace Scott", score: 44 }
  //     ]
  //   },
  //   {
  //     id: 10, name: "Westfield Academy", score: 130, rank: 10, students: [
  //       { id: 28, name: "Jack Young", score: 43 },
  //       { id: 29, name: "Lily Green", score: 43 },
  //       { id: 30, name: "Samuel Hall", score: 44 }
  //     ]
  //   },
  //   {
  //     id: 11, name: "Southgate School", score: 128, rank: 11, students: [
  //       { id: 31, name: "Chloe Adams", score: 43 },
  //       { id: 32, name: "Matthew Nelson", score: 42 },
  //       { id: 33, name: "Sofia Carter", score: 43 }
  //     ]
  //   },
  //   {
  //     id: 12, name: "Hillcrest Academy", score: 126, rank: 12, students: [
  //       { id: 34, name: "Ryan Mitchell", score: 42 },
  //       { id: 35, name: "Zoe Perez", score: 42 },
  //       { id: 36, name: "David Roberts", score: 42 }
  //     ]
  //   },
  //   {
  //     id: 13, name: "Lakeside School", score: 124, rank: 13, students: [
  //       { id: 37, name: "Layla Turner", score: 41 },
  //       { id: 38, name: "Luke Phillips", score: 41 },
  //       { id: 39, name: "Scarlett Campbell", score: 42 }
  //     ]
  //   },
  //   {
  //     id: 14, name: "Maplewood Academy", score: 122, rank: 14, students: [
  //       { id: 40, name: "Mila Parker", score: 41 },
  //       { id: 41, name: "Nathan Evans", score: 40 },
  //       { id: 42, name: "Avery Edwards", score: 41 }
  //     ]
  //   },
  //   {
  //     id: 15, name: "Brookside School", score: 120, rank: 15, students: [
  //       { id: 43, name: "Eleanor Collins", score: 40 },
  //       { id: 44, name: "Gabriel Stewart", score: 40 },
  //       { id: 45, name: "Victoria Morris", score: 40 }
  //     ]
  //   },
  //   {
  //     id: 16, name: "Cedar Grove Academy", score: 118, rank: 16, students: [
  //       { id: 46, name: "Penelope Rogers", score: 39 },
  //       { id: 47, name: "Julian Reed", score: 39 },
  //       { id: 48, name: "Hazel Cook", score: 40 }
  //     ]
  //   },
  //   {
  //     id: 17, name: "Silver Oak School", score: 116, rank: 17, students: [
  //       { id: 49, name: "Aurora Morgan", score: 39 },
  //       { id: 50, name: "Adam Bailey", score: 38 },
  //       { id: 51, name: "Savannah Bell", score: 39 }
  //     ]
  //   }
  // ]);

  const getRankBadgeStyle = (rank: number): string => {
    if (rank <= 3) {
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg transform scale-110';
    }
    return 'bg-gray-100 text-gray-600';
  };

  // lock body scroll and restore on modal close
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    if (selectedSchool) {
      // compensate for scrollbar width to avoid layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [selectedSchool]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br p-4 relative"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* White background container for image */}
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
      {/* Background image nested inside white background */}
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
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(255,255,255,0.6)',
        zIndex: 1
      }} />
      <div className="max-w-4xl mx-auto" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div className=" mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#651321' }}>
            Leaderboard
          </h1>
          <p className="text-gray-600">Quiz Rankings</p>
        </div>



        {/* Top 3 Podium */}
        <div className="flex justify-center items-end mb-12 space-x-6">
          {/* Second Place */}
          <div className="text-center bg-white p-8 shadow-lg flex flex-col items-center justify-center w-44 md:w-56" style={{ borderRadius: '50px' }}>
            <div className="relative flex items-center justify-center">
              <img
                src="/Rank_2.png"
                alt="Second Place"
                className="w-20 md:w-24 h-auto block mx-auto"
              />
            </div>
            <h3
              title={schools[1]?.name}
              className="font-semibold text-sm md:text-base text-center text-gray-800 mb-2 max-w-[10rem] md:max-w-[16rem] whitespace-normal break-words leading-tight"
            >
              {schools[1]?.name}
            </h3>
          </div>

          {/* First Place */}
          <div className="text-center mb-10 p-10 bg-white shadow-xl flex flex-col items-center justify-center w-56 md:w-72" style={{ borderRadius: '50px' }}>
            <div className="relative flex items-center justify-center">
              <img
                src="/Rank_1.png"
                alt="First Place"
                className="w-24 md:w-32 h-auto block mx-auto"
              />
            </div>
            <h3
              title={schools[0]?.name}
              className="font-semibold text-base md:text-lg text-center text-gray-800 mb-2 max-w-[12rem] md:max-w-[20rem] whitespace-normal break-words leading-tight"
            >
              {schools[0]?.name}
            </h3>
          </div>

          {/* Third Place */}
          <div className="text-center bg-white p-8 shadow-lg flex flex-col items-center justify-center w-44 md:w-56" style={{ borderRadius: '50px' }}>
            <div className="relative flex items-center justify-center">
              <img
                src="/Rank_3.png"
                alt="First Place"
                className="w-20 md:w-24 h-auto block mx-auto"
              />
            </div>
            <h3
              title={schools[2]?.name}
              className="font-semibold text-sm md:text-base text-center text-gray-800 mb-2 max-w-[10rem] md:max-w-[16rem] whitespace-normal break-words leading-tight"
            >
              {schools[2]?.name}
            </h3>
          </div>
        </div>

        {/* Full Rankings Table */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b flex justify-center items-center" style={{ backgroundColor: '#651321' }}>
            <h2 className="text-xl font-bold text-white">Ranks</h2>
          </div>

          {/* Add a max height and make it scrollable */}
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {schools.map((school, index) => (
              <div
                key={school.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
                onClick={() => setSelectedSchool(school)}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank Badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm${school.rank <= 3 ? '' : ' ' + getRankBadgeStyle(school.rank)}`}>
                    {school.rank === 1 ? (
                      <img src="/Rank_1.png" alt="1st Place" className="w-8 h-8 object-contain" />
                    ) : school.rank === 2 ? (
                      <img src="/Rank_2.png" alt="2nd Place" className="w-8 h-8 object-contain" />
                    ) : school.rank === 3 ? (
                      <img src="/Rank_3.png" alt="3rd Place" className="w-8 h-8 object-contain" />
                    ) : (
                      school.rank
                    )}
                  </div>

                  {/* School Name */}
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                      {school.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Score */}
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: '#df7500' }}>
                      {school.score}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Details Modal */}
        {selectedSchool && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            {/* blurred translucent backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />

            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 z-10">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b" >
                <h3 className="font-bold text-lg" style={{ color: '#651321' }}>
                  {selectedSchool.name}
                </h3>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                >
                  <X size={20} style={{ color: '#651321' }} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4" >
                <div className="flex items-center gap-6">
                  {/* Trophy Icon (Left) */}
                  <div>
                    <div>
                      {selectedSchool.rank === 1 ? (
                        <img src="/Rank_1.png" alt="1st Place" className="w-25 h-25 object-contain" />
                      ) : selectedSchool.rank === 2 ? (
                        <img src="/Rank_2.png" alt="2nd Place" className="w-25 h-25 object-contain" />
                      ) : selectedSchool.rank === 3 ? (
                        <img src="/Rank_3.png" alt="3rd Place" className="w-25 h-25 object-contain" />
                      ) : (
                        <Trophy size={60} color="#DF7500" />
                      )}
                    </div>
                  </div>
                  {/* Students List (Right) */}
                  <div className="flex-1 space-y-3">
                    {selectedSchool.students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between py-2 px-3 bg-white bg-opacity-70 rounded-lg">
                        <span className="text-gray-800 font-medium">
                          {student.name}
                        </span>
                        <span className="font-bold text-lg" style={{ color: '#df7500' }}>
                          {student.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* School Total */}
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg" style={{ color: '#651321' }}>
                      School Total:
                    </span>
                    <span className="font-bold text-2xl" style={{ color: '#df7500' }}>
                      {selectedSchool.score}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;