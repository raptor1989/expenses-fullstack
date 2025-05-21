import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, ApiResponse, Expense, ExpenseSummary } from 'shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
    user: {
        id: string;
        email?: string;
        [key: string]: any;
    };
}

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) {}

    @Post()
    async create(
        @Body() createExpenseDto: CreateExpenseDto,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponse<Expense>> {
        const expense = await this.expensesService.create(createExpenseDto, req.user.id);
        return {
            status: 'success',
            data: expense
        };
    }

    @Get()
    async findAll(@Request() req: AuthenticatedRequest): Promise<ApiResponse<Expense[]>> {
        const expenses = await this.expensesService.findAll(req.user.id);
        return {
            status: 'success',
            data: expenses
        };
    }

    @Get('summary')
    async getSummary(
        @Request() req: AuthenticatedRequest,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ): Promise<ApiResponse<ExpenseSummary>> {
        const summary = await this.expensesService.getSummary(req.user.id, startDate, endDate);
        return {
            status: 'success',
            data: summary
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<ApiResponse<Expense>> {
        const expense = await this.expensesService.findOne(id, req.user.id);
        return {
            status: 'success',
            data: expense
        };
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateExpenseDto: UpdateExpenseDto,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponse<Expense>> {
        const expense = await this.expensesService.update(id, updateExpenseDto, req.user.id);
        return {
            status: 'success',
            data: expense
        };
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<ApiResponse<null>> {
        await this.expensesService.remove(id, req.user.id);
        return {
            status: 'success',
            message: 'Expense deleted successfully'
        };
    }
}
