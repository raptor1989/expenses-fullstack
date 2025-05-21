import mongoose, { Document, Schema } from 'mongoose';
import { Expense as ExpenseType, ExpenseCategory } from 'shared-types';

export interface ExpenseDocument extends Document, Omit<ExpenseType, 'id'> {
    _id: mongoose.Types.ObjectId;
}

const ExpenseSchema = new Schema<ExpenseDocument>(
    {
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        category: {
            type: String,
            enum: Object.values(ExpenseCategory),
            required: true
        },
        date: { type: Date, required: true },
        description: { type: String },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Create indexes for better query performance
ExpenseSchema.index({ userId: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ date: 1 });

export const Expense = mongoose.model<ExpenseDocument>('Expense', ExpenseSchema);
