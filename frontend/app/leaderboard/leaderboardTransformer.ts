export interface StudentData {
  id: number;
  name: string;
  score: number;
}

export interface SchoolData {
  id: number;
  name: string;
  score: number;
  rank: number;
  students: StudentData[];
}

type RawMember = { studentName: string; marks: number };
type RawSchool = { schoolName: string; totalScore: number; members: RawMember[] };

/**
 * Transform raw leaderboard data into structured SchoolData with ranks and student ids.
 *
 * Assumptions:
 * - `data` is an array of objects shaped like the example in the repo: { schoolName, totalScore, members }
 * - Student IDs are generated per-school starting at 1. School IDs are assigned after sorting by score (1-based).
 * - By default uses "dense" ranking: equal scores receive the same rank and the next distinct score gets the next integer (1,2,2,3...)
 *
 * You can pass options.ranking = 'competition' to use competition ranking (1,2,2,4...).
 */
export function transformLeaderboard(
  data: RawSchool[],
  options?: { ranking?: 'dense' | 'competition' }
): SchoolData[] {

    console.log(data);
    
  const ranking = options?.ranking ?? 'dense';

  // Defensive: ensure we have an array
  const schools: RawSchool[] = Array.isArray(data) ? data.slice() : [];

  // Sort descending by totalScore
  schools.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));

  // Compute ranks
  const ranks: number[] = new Array(schools.length).fill(0);
  if (ranking === 'dense') {
    let prevScore: number | null = null;
    let currentRank = 0;
    for (let i = 0; i < schools.length; i++) {
      const s = schools[i];
      const score = s.totalScore ?? 0;
      if (prevScore === null || score !== prevScore) {
        currentRank += 1;
        prevScore = score;
      }
      ranks[i] = currentRank;
    }
  } else {
    // competition ranking: ties get same rank, next rank is position+1
    for (let i = 0; i < schools.length; i++) {
      if (i === 0) {
        ranks[i] = 1;
      } else {
        ranks[i] = schools[i].totalScore === schools[i - 1].totalScore ? ranks[i - 1] : i + 1;
      }
    }
  }

  // Map to SchoolData
  const result: SchoolData[] = schools.map((s, idx) => {
    const rawScore = Number.isFinite(s.totalScore) ? s.totalScore : 0;
    // round to 3 decimal places for display
    const roundedSchoolScore = parseFloat(rawScore.toFixed(3));

    return {
      id: idx + 1,
      // keep full name available as `fullName` for UI that needs the complete string
      name: s.schoolName,
      score: roundedSchoolScore,
      rank: ranks[idx],
      students: Array.isArray(s.members)
        ? s.members.map((m, i) => {
            const studentScore = typeof m.marks === 'number' && Number.isFinite(m.marks) ? m.marks : 0;
            return { id: i + 1, name: m.studentName, score: parseFloat(studentScore.toFixed(3)) };
          })
        : [],
    };
  });

  return result;
}

// Example usage:
// const transformed = transformLeaderboard(apiResponse.data);
// console.log(transformed[0].rank, transformed[0].students[0].id);
