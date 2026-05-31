import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Enable rawBody so we can verify HMAC over raw bytes for webhooks
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // CORS: allow list from env CORS_ORIGINS (comma-separated)
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
  });

  // Swagger for documentation (available in development)
  const config = new DocumentBuilder()
    .setTitle('Stellaro DeFi API')
    .setDescription(
      'Enterprise-grade API for the Stellaro DeFi platform on Stellar/Soroban.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('actions', 'DeFi Transaction Orchestration')
    .addTag('payments', 'PIX and Card Payment Integrations')
    .addTag('compliance', 'AML and KYC Services')
    .addTag('risk', 'AI-powered Risk Management')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
