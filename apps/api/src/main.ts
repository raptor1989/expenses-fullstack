import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    });

    // Enable validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true
        })
    );

    // Set global prefix for API
    app.setGlobalPrefix('api');

    await app.listen(process.env.PORT || 3001);
}

bootstrap().catch((err) => {
    console.error('Error during bootstrap:', err);
    process.exit(1);
});
