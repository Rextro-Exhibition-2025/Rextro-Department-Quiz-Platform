import Quiz from "../models/Quiz.js";

/**
 * Previously this file wiped and created quizzes 1..4.
 * Replace that behavior with idempotent helpers that ensure
 * required quiz documents exist without deleting existing data.
 */

export const DEFAULT_QUIZ_IDS = [1, 2, 3, 4];

export const createSampleQuizzes = async () => {
  try {
    const sampleQuizzes = DEFAULT_QUIZ_IDS.map((id) => ({ quizId: id, questions: [] }));

    // Insert only missing quizzes (don't delete existing ones)
    const created: any[] = [];
    for (const q of sampleQuizzes) {
      const exists = await Quiz.findOne({ quizId: q.quizId });
      if (!exists) {
        const c = await Quiz.create(q);
        created.push(c);
      }
    }

    console.log(`✅ Ensured quizzes exist. Created ${created.length} new quizzes.`);

    return {
      success: true,
      message: `Ensured quizzes exist. Created ${created.length} new quizzes.`,
      data: created
    };
  } catch (error) {
    console.error('Error creating sample quizzes:', error);
    return {
      success: false,
      message: 'Failed to create sample quizzes',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Ensure that the given quizIds exist in the database. For each id
 * that is missing, create a Quiz document with an empty questions array.
 */
export const ensureQuizzesExist = async (quizIds: number[] = DEFAULT_QUIZ_IDS) => {
  try {
    const created: any[] = [];
    for (const id of quizIds) {
      const exists = await Quiz.findOne({ quizId: id });
      if (!exists) {
        const q = await Quiz.create({ quizId: id, questions: [] });
        created.push(q);
        console.log(`Created missing quiz with quizId ${id}`);
      }
    }

    if (created.length === 0) {
      console.log('All required quizzes already exist.');
    } else {
      console.log(`Created ${created.length} missing quizzes.`);
    }

    return { success: true, createdCount: created.length, created };
  } catch (error) {
    console.error('Error ensuring quizzes exist:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};