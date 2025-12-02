import mongoose, { Schema, Document } from 'mongoose';


type OptionType = 'A' | 'B' | 'C' | 'D';

interface Option {
    option: OptionType;
    optionText?: string;
    optionImage?: string;
    optionImagePublicId?: string;
}


export interface IQuestion extends Document {
    quizid: number;
    question: string;
    questionImage?: string;
    questionImagePublicId?: string;
    options: Option[];
    correctOption: OptionType;
}

const OptionSchema: Schema = new Schema({
    option: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
    optionText: { type: String, required: false },
    optionImage: { type: String, required: false },
    optionImagePublicId: { type: String, required: false },
});

// Note: Validation for optionText/optionImage is handled at the controller level
// Pre-validation hooks don't execute for subdocuments in arrays

const QuestionSchema: Schema = new Schema({
    quizId: { type: Number, required: true },
    question: { type: String, required: true },
    questionImage: { type: String, required: false },
    questionImagePublicId: { type: String, required: false },
    options: { type: [OptionSchema], required: true, validate: [(val: Option[]) => val.length === 4, 'Exactly 4 options required'] },
    correctOption: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
});

export default mongoose.model<IQuestion>("Question", QuestionSchema);






