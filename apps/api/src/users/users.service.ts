import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto, User as UserInterface } from 'shared-types';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async create(createUserDto: CreateUserDto): Promise<Omit<UserInterface, 'password'>> {
        // Check if user with email or username already exists
        const existingUser = await this.userModel
            .findOne({
                $or: [{ email: createUserDto.email }, { username: createUserDto.username }]
            })
            .exec();

        if (existingUser) {
            throw new ConflictException('User with this email or username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

        // Create user
        const user = new this.userModel({
            username: createUserDto.username,
            email: createUserDto.email,
            password: hashedPassword
        });

        const savedUser = await user.save();
        return this.formatUser(savedUser);
    }

    async findByEmail(email: string): Promise<UserDocument> {
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        return user;
    }

    async findById(id: string): Promise<Omit<UserInterface, 'password'>> {
        let user;
        try {
            user = await this.userModel.findById(new Types.ObjectId(id)).exec();
        } catch (_error) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.formatUser(user);
    }

    private formatUser(user: UserDocument): Omit<UserInterface, 'password'> {
        const userObj = user.toObject();
        const { password, ...result } = userObj;

        return {
            id: result._id.toString(),
            username: result.username,
            email: result.email,
            createdAt: result.createdAt instanceof Date ? result.createdAt.toISOString() : String(result.createdAt),
            updatedAt: result.updatedAt instanceof Date ? result.updatedAt.toISOString() : String(result.updatedAt)
        };
    }
}
