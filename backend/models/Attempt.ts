import mongoose, { Schema, Document } from "mongoose";

export interface IAttempt extends Document {
  student: mongoose.Types.ObjectId;
  studentId?: string;
  quizId: number;
  question: mongoose.Types.ObjectId;
  openTime?: Date;
  submitTime?: Date;
  answer?: string;
  isCorrect?: boolean;
  timeTaken?: number; // seconds
  createdAt?: Date;
  updatedAt?: Date;
}

const AttemptSchema: Schema = new Schema(
  {
    student: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    studentId: { type: String, required: false },
    quizId: { type: Number, required: true },
    question: { type: mongoose.Types.ObjectId, ref: "Question", required: true },
    openTime: { type: Date },
    submitTime: { type: Date },
    answer: { type: String },
    isCorrect: { type: Boolean },
    timeTaken: { type: Number },
  },
  { timestamps: true }
);

// Indexes for common queries: per-quiz per-student, and submitTime for leaderboard sorting
AttemptSchema.index({ quizId: 1, student: 1, question: 1 });
AttemptSchema.index({ submitTime: 1 });

export default mongoose.model<IAttempt>("Attempt", AttemptSchema);
