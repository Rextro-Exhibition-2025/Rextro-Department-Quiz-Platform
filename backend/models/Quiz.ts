import mongoose, { Schema, Document } from "mongoose";

export interface IQuiz extends Document {
  quizId: number;
  name?: string;
  questions?: mongoose.Types.ObjectId[];
  isPublished?: boolean;
}

const quizSchema: Schema = new Schema({
  quizId: { type: Number, required: true, unique: true },
  name: { type: String },
  questions: [{ type: mongoose.Types.ObjectId, ref: "Question" }],
  isPublished: { type: Boolean, default: false },
});

export default mongoose.model<IQuiz>("Quiz", quizSchema);