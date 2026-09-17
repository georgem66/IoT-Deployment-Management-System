import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export function createJwtOptions(config: ConfigService): JwtModuleOptions {
  const secret = config.get<string>('JWT_SECRET');
  if (typeof secret !== 'string' || secret.replace(/\s/g, '').length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 non-whitespace characters');
  }
  return {
    secret,
    signOptions: {
      expiresIn: config.get<string>('JWT_EXPIRATION') || '24h',
      issuer: 'iot-security-system',
      audience: 'iot-users',
    },
  };
}
