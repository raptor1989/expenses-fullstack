import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ApiResponse, AuthResponse, CreateUserDto } from 'shared-types';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService
    ) {}

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDto): Promise<ApiResponse<AuthResponse>> {
        const auth = await this.authService.login(loginDto);
        return {
            status: 'success',
            data: auth
        };
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<AuthResponse>> {
        const auth = await this.authService.login({
            email: createUserDto.email,
            password: createUserDto.password
        });

        return {
            status: 'success',
            data: auth
        };
    }
}
