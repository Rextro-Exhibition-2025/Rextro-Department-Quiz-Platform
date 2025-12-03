import { Question } from "./page";
import { getQuizIdFromSetName } from '@/constants/quizSets';

// Type definitions for input and output
export type InputAnswer = {
	id: string;
	text: string;
	image?: string;
};



export type OutputOption = {
	option: string;
	optionText: string;
	optionImage?: string;
	optionImagePublicId?: string;
};

export type OutputQuestion = {
	quizId: number;
	question: string;
	questionImage?: string;
	questionImagePublicId?: string;
	options: OutputOption[];
	correctOption: string;
};

// Function to transform input question to output format
export function transformQuestion(input: Question): OutputQuestion {
	const idToOption = ['A', 'B', 'C', 'D'];
	const options: OutputOption[] = input.answers.map((ans, idx) => ({
		option: idToOption[idx],
		optionText: ans.text,
		...(ans.image ? { optionImage: ans.image } : {}),
		...(ans.imagePublicId ? { optionImagePublicId: ans.imagePublicId } : {})
	}));

	const correctIdx = input.answers.findIndex(ans => ans.id === input.correctAnswer);
	const correctOption = idToOption[correctIdx];

	// quizSet is a department name; convert to numeric quizId expected by API
	const quizId = typeof input.quizSet === 'string' ? getQuizIdFromSetName(input.quizSet) : Number(input.quizSet) || 0;

	return {
		quizId,
		question: input.question,
		...(input.image ? { questionImage: input.image } : {}),
		...(input.imagePublicId ? { questionImagePublicId: input.imagePublicId } : {}),
		options,
		correctOption
	};
}
