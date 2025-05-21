import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    Expense as ExpenseInterface,
    CreateExpenseDto,
    UpdateExpenseDto,
    ExpenseCategory,
    ExpenseSummary
} from 'shared-types';
import { Expense, ExpenseDocument } from './expense.schema';

@Injectable()
export class ExpensesService {
    constructor(@InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>) {}

    async create(createExpenseDto: CreateExpenseDto, userId: string): Promise<ExpenseInterface> {
        const expense = new this.expenseModel({
            title: createExpenseDto.title,
            amount: createExpenseDto.amount,
            category: createExpenseDto.category,
            date: new Date(createExpenseDto.date),
            description: createExpenseDto.description,
            userId: new Types.ObjectId(userId)
        });

        const savedExpense = await expense.save();
        return this.formatExpense(savedExpense);
    }

    async findAll(userId: string): Promise<ExpenseInterface[]> {
        const expenses = await this.expenseModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ date: -1 })
            .exec();

        return expenses.map((expense) => this.formatExpense(expense));
    }

    async findOne(id: string, userId: string): Promise<ExpenseInterface> {
        const expense = await this.expenseModel
            .findOne({
                _id: new Types.ObjectId(id),
                userId: new Types.ObjectId(userId)
            })
            .exec();

        if (!expense) {
            throw new NotFoundException(`Expense with ID ${id} not found`);
        }

        return this.formatExpense(expense);
    }

    async update(id: string, updateExpenseDto: UpdateExpenseDto, userId: string): Promise<ExpenseInterface> {
        // Check if expense exists and belongs to the user
        await this.findOne(id, userId);

        const updateData: Partial<ExpenseDocument> = {};
        if (updateExpenseDto.title !== undefined) updateData.title = updateExpenseDto.title;
        if (updateExpenseDto.amount !== undefined) updateData.amount = updateExpenseDto.amount;
        if (updateExpenseDto.category !== undefined) updateData.category = updateExpenseDto.category;
        if (updateExpenseDto.date !== undefined) updateData.date = new Date(updateExpenseDto.date);
        if (updateExpenseDto.description !== undefined) updateData.description = updateExpenseDto.description;

        const updatedExpense = await this.expenseModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

        if (!updatedExpense) {
            throw new NotFoundException(`Expense with ID ${id} not found`);
        }

        return this.formatExpense(updatedExpense);
    }

    async remove(id: string, userId: string): Promise<void> {
        // Check if expense exists and belongs to the user
        await this.findOne(id, userId);

        const result = await this.expenseModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Expense with ID ${id} not found`);
        }
    }

    async getSummary(userId: string, startDate: string, endDate: string): Promise<ExpenseSummary> {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const expenses = await this.expenseModel
            .find({
                userId: new Types.ObjectId(userId),
                date: {
                    $gte: start,
                    $lte: end
                }
            })
            .exec();

        let totalExpenses = 0;
        const categorySummary: { [key in ExpenseCategory]?: number } = {};

        expenses.forEach((expense) => {
            totalExpenses += expense.amount;

            const category = expense.category;
            if (categorySummary[category]) {
                categorySummary[category] += expense.amount;
            } else {
                categorySummary[category] = expense.amount;
            }
        });

        return {
            totalExpenses,
            categorySummary,
            dateRange: {
                start: startDate,
                end: endDate
            }
        };
    }

    private formatExpense(expense: ExpenseDocument): ExpenseInterface {
        const expenseObj = expense.toObject({ getters: true, virtuals: false }) as Expense & { _id: Types.ObjectId };
        return {
            id: expenseObj._id.toString(),
            title: expenseObj.title,
            amount: expenseObj.amount,
            category: expenseObj.category,
            date: expenseObj.date.toISOString(),
            description: expenseObj.description || '',
            userId: expenseObj.userId.toString(),
            createdAt: expenseObj.createdAt ? new Date(expenseObj.createdAt).toISOString() : '',
            updatedAt: expenseObj.updatedAt ? new Date(expenseObj.updatedAt).toISOString() : ''
        };
    }
}
