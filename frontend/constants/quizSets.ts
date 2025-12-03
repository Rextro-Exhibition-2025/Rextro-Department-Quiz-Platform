export const QUIZ_SETS = [
  'Department of Civil and Environmental Engineering',
  'Department of Electrical and Information Engineering',
  'Department of Mechanical and Manufacturing Engineering',
  'Department of Marine and Naval Architecture',
];

export const getQuizSetName = (quizId: number) => {
  if (!quizId || quizId < 1) return QUIZ_SETS[0];
  // Support quizId values beyond the defined length by wrapping them to the available sets
  const idx = (quizId - 1) % QUIZ_SETS.length;
  return QUIZ_SETS[idx];
};

export const getQuizIdFromSetName = (setName: string) => {
  const idx = QUIZ_SETS.findIndex((s) => s === setName);
  return idx === -1 ? 1 : idx + 1;
};
