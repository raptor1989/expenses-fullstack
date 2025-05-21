import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
    imports: [
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/household-expenses'),
        UsersModule,
        AuthModule,
        ExpensesModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
