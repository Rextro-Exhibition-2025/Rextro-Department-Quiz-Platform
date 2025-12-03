export interface StudentData {
  id: number;
  name: string;
  score: number;
  attempts?: number;
  totalTimeTaken?: number;
  completionTime?: string;
  studentId?: string;
  studentRef?: string;
  totalQuestions?: number;
  correctPercentage?: number;
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

export function transformLeaderboard(
  data: RawSchool[],
  options?: { ranking?: 'dense' | 'competition' }
): SchoolData[] {

    console.log(data);
    
  const ranking = options?.ranking ?? 'dense';

  
  const schools: RawSchool[] = Array.isArray(data) ? data.slice() : [];

  
  schools.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));

  
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
    
    for (let i = 0; i < schools.length; i++) {
      if (i === 0) {
        ranks[i] = 1;
      } else {
        ranks[i] = schools[i].totalScore === schools[i - 1].totalScore ? ranks[i - 1] : i + 1;
      }
    }
  }

  
  const result: SchoolData[] = schools.map((s, idx) => {
    const rawScore = Number.isFinite(s.totalScore) ? s.totalScore : 0;
    
    const roundedSchoolScore = parseFloat(rawScore.toFixed(3));

    return {
      id: idx + 1,
      
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

export function transformApiLeaderboard(raw: any): SchoolData[] {
  if (!raw) return [];

  
  const payload = Array.isArray(raw)
    ? raw
    : raw.data && Array.isArray(raw.data)
    ? raw.data
    : raw.result && Array.isArray(raw.result)
    ? raw.result
    : [];

  
  
  if (payload.length > 0 && (payload[0].studentRef || payload[0].studentId || typeof payload[0].correctCount !== 'undefined')) {
    const students = payload.map((it: any) => ({
      name: it.name ?? it.studentName ?? 'Unknown',
      score: Number(it.correctPercentage ?? it.correctCount ?? it.marks ?? it.total ?? 0) || 0,
      attempts: typeof it.attempts === 'number' ? it.attempts : Number(it.attempts ?? 0) || 0,
      totalTimeTaken: typeof it.totalTimeTaken === 'number' ? it.totalTimeTaken : Number(it.totalTimeTaken ?? 0) || 0,
      completionTime: it.completionTime ?? it.completedAt ?? null,
      studentId: it.studentId ?? null,
      studentRef: it.studentRef ?? null,
      totalQuestions: typeof it.totalQuestions === 'number' ? it.totalQuestions : Number(it.totalQuestions ?? 0) || 0,
      correctPercentage: typeof it.correctPercentage === 'number' ? it.correctPercentage : Number(it.correctPercentage ?? 0) || 0,
    }));

    
    students.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.totalTimeTaken ?? 0) - (b.totalTimeTaken ?? 0);
    });

    
    const ranks: number[] = new Array(students.length).fill(0);
    let prevScore: number | null = null;
    let currentRank = 0;
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (prevScore === null || s.score !== prevScore) {
        currentRank += 1;
        prevScore = s.score;
      }
      ranks[i] = currentRank;
    }

    const result: SchoolData[] = students.map((s: any, idx: number) => ({
      id: idx + 1,
      name: s.name,
      score: s.score,
      rank: ranks[idx],
      students: [
        {
          id: 1,
          name: s.name,
          score: s.score,
          attempts: s.attempts,
          totalTimeTaken: s.totalTimeTaken,
          completionTime: s.completionTime,
          studentId: s.studentId,
          studentRef: s.studentRef,
          totalQuestions: s.totalQuestions,
          correctPercentage: s.correctPercentage,
        },
      ],
    }));

    return result;
  }

  
  const normalized: RawSchool[] = payload.map((it: any) => {
    
    if (it.schoolName && typeof it.totalScore !== 'undefined') {
      return {
        schoolName: it.schoolName,
        totalScore: Number(it.totalScore) || 0,
        members: Array.isArray(it.members)
          ? it.members.map((m: any) => ({ studentName: m.studentName ?? m.name ?? m.student ?? 'Unknown', marks: Number(m.marks ?? m.score ?? 0) }))
          : [],
      } as RawSchool;
    }

    
    if ((it.department || it.name || it.school) && (it.total || it.totalScore || it.score)) {
      return {
        schoolName: it.department ?? it.name ?? it.school,
        totalScore: Number(it.total ?? it.totalScore ?? it.score) || 0,
        members: Array.isArray(it.students)
          ? it.students.map((s: any) => ({ studentName: s.name ?? s.fullName ?? 'Unknown', marks: Number(s.marks ?? s.score ?? 0) }))
          : [],
      } as RawSchool;
    }

    
    return {
      schoolName: String(it.name ?? it.schoolName ?? it.department ?? 'Unknown'),
      totalScore: Number(it.totalScore ?? it.total ?? it.score ?? 0) || 0,
      members: [],
    } as RawSchool;
  });

  
  return transformLeaderboard(normalized);
}




