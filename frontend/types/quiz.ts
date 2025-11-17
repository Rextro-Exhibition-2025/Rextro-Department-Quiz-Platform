// Backend API response types
export interface QuizApiOption {
	option: string;
	optionText: string;
	optionImage?: string;
	_id?: string;
}

export interface QuizApiQuestion {
	_id: string;
	quizId: number;
	question: string;
	questionImage?: string;
	options: QuizApiOption[];
	correctOption?: string;
	__v: number;
}

// API response shape that includes the correct option identifier from the backend
export interface QuestionApiResponse {
  _id: string;
  quizId: number;
  question: string;
  questionImage?: string;
  options: QuizApiOption[];
  correctOption?: string; // e.g. 'A', 'B', 'C' from backend
  __v: number;
}

export interface QuizApiResponse {
	_id: string;
	quizId: number;
	questions: QuizApiQuestion[];
	__v: number;
}
export interface Answer {
	id: string;
	text: string | null;
	image?: string | null;
	imagePublicId?: string;
}

export interface QuizQuestion {
	id: number;
	question: string;
	image: string | null;
	answers: Answer[];
}

// New local/frontend-friendly question types matching the shape used in manage-questions
export interface QuestionOption {
	id: string;
	text: string;
	image?: string;
	imagePublicId?: string;
}

export interface QuestionItem {
	id: string;
	question: string;
	questionImage?: string;
	quizSet: string;
	answers: QuestionOption[];
	correctAnswer: string; // id of the correct option (e.g. 'a')
}


export interface Question {
  id?: string;
  question: string;
  image?: string;
  imagePublicId?: string;
  answers: Answer[];
  correctAnswer: string;
  quizSet: string;
}