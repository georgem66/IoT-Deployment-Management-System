import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { createJwtOptions } from './jwt.config';

describe('JWT configuration', () => {
  it.each([undefined, '', '   ', 'short'])('rejects missing or insufficient signing configuration (%s)', (value) => {
    const config = new ConfigService({ JWT_SECRET: value });
    expect(() => createJwtOptions(config)).toThrow('JWT_SECRET must contain at least 32 non-whitespace characters');
  });

  it('uses the configured signing key without a fallback', () => {
    const secret = randomBytes(32).toString('hex');
    const options = createJwtOptions(new ConfigService({ JWT_SECRET: secret }));
    expect(options.secret).toBe(secret);
    expect(options.signOptions).toEqual({
      expiresIn: '24h', issuer: 'iot-security-system', audience: 'iot-users',
    });
  });

  it('supports an explicit expiration', () => {
    const options = createJwtOptions(new ConfigService({
      JWT_SECRET: randomBytes(32).toString('hex'), JWT_EXPIRATION: '1h',
    }));
    expect(options.signOptions.expiresIn).toBe('1h');
  });
});
