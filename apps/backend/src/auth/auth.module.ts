import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PasskeyModule } from '../passkey/passkey.module';
import { JwtModule } from '@nestjs/jwt';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const jwtSecret = process.env.JWT_SECRET;
if (nodeEnv.toLowerCase() === 'production' && !jwtSecret) {
  throw new Error('JWT_SECRET is required in production.');
}

@Module({
  imports: [
    PrismaModule,
    PasskeyModule,
    JwtModule.register({
      secret: jwtSecret || 'dev-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
