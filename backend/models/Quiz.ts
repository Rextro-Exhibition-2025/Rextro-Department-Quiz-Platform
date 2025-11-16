import mongoose, { Schema, Document } from "mongoose";

type QuizType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface IQuiz extends Document {
  quizId: QuizType;
  questions?: mongoose.Types.ObjectId[];
  isPublished?: boolean;
}

const quizSchema: Schema = new Schema({
  quizId: { type: Number, required: true, unique: true, enum: [1, 2, 3, 4, 5, 6, 7, 8] },
  questions: [{ type: mongoose.Types.ObjectId, ref: "Question" }],
  isPublished: { type: Boolean, default: false },
});


export default mongoose.model<IQuiz>("Quiz", quizSchema);