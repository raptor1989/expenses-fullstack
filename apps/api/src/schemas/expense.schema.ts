import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ExpenseCategory } from 'shared-types';

@Schema({ timestamps: true })
export class Expense {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true, enum: ExpenseCategory })
    category: ExpenseCategory;

    @Prop({ required: true })
    date: Date;

    @Prop()
    description?: string;

    @Prop({ required: true })
    userId: string;

    // These are added by Mongoose when timestamps: true
    createdAt?: Date;
    updatedAt?: Date;
}

export type ExpenseDocument = Expense & Document;

export const ExpenseSchema = SchemaFactory.createForClass(Expense);