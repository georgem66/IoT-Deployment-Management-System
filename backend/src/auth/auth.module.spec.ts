import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { DatabaseModule } from '../database/database.module';

// Real Nest dependency injection and JWT signing; database never connects.
describe('AuthModule initialization', () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  });

  const initialize = () => Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), DatabaseModule, AuthModule],
  }).overrideProvider(DatabaseService).useValue({}).compile();

  it('fails closed when no signing key is configured', async () => {
    delete process.env.JWT_SECRET;
    await expect(initialize()).rejects.toThrow('JWT_SECRET must contain at least 32');
  });

  it('initializes and signs a normal user session with configured key', async () => {
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    const module = await initialize();
    try {
      await module.init();
      const auth = module.get(AuthService);
      const session = await auth.login({ id: 'fixture', email: 'fixture@example.test', role: 'USER' });
      const payload = await auth.validateToken(session.access_token);
      expect(payload.sub).toBe('fixture');
      expect(payload.role).toBe('USER');
    } finally {
      await module.close();
    }
  });
});
