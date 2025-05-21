import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, AuthResponse } from 'shared-types';
import * as bcrypt from 'bcrypt';

interface UserInfo {
    id: string;
    username: string;
    email: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    [key: string]: any;
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async validateUser(email: string, pass: string): Promise<UserInfo | null> {
        try {
            const user = await this.usersService.findByEmail(email);

            if (user && (await bcrypt.compare(pass, user.password))) {
                // Convert mongoose document to plain object
                const userObj = user.toObject ? user.toObject() : user;

                // Return user with properly formatted id
                return {
                    id: userObj._id.toString(),
                    username: userObj.username,
                    email: userObj.email,
                    createdAt:
                        userObj.createdAt instanceof Date ? userObj.createdAt.toISOString() : String(userObj.createdAt),
                    updatedAt:
                        userObj.updatedAt instanceof Date ? userObj.updatedAt.toISOString() : String(userObj.updatedAt)
                };
            }

            return null;
        } catch (_error) {
            // If any error occurs during validation, return null
            return null;
        }
    }

    async login(loginDto: LoginDto): Promise<AuthResponse> {
        const { email, password } = loginDto;
        const user = await this.validateUser(email, password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user.id };

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
                updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt)
            },
            token: this.jwtService.sign(payload)
        };
    }
}
