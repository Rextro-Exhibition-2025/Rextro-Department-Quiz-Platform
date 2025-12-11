import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  studentId: string;
  googleId?: string;
  authProvider?: 'local' | 'google';
  marks?: number;
  createdAt?: Date;
}

const userSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: false },
  studentId: { type: String, required: true, unique: true },
  googleId: { type: String, required: false, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  marks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>("User", userSchema);


