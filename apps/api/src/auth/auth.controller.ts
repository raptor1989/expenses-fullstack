import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ApiResponse, AuthResponse } from 'shared-types';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDto): Promise<ApiResponse<AuthResponse>> {
        const auth = await this.authService.login(loginDto);
        return {
            status: 'success',
            data: auth
        };
    }
}
