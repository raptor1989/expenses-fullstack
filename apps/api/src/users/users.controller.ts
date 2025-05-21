import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, ApiResponse, User } from 'shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<Omit<User, 'password'>>> {
        const user = await this.usersService.create(createUserDto);
        return {
            status: 'success',
            data: user
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ApiResponse<Omit<User, 'password'>>> {
        const user = await this.usersService.findById(id);
        return {
            status: 'success',
            data: user
        };
    }
}
