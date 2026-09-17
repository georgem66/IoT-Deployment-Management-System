import { DatabaseService } from './database.service';

describe('database lifecycle', () => {
  it('does not report startup success after connection failure', async () => {
    const failure = new Error('Fixture connection unavailable');
    const fixture = { $connect: jest.fn().mockRejectedValue(failure) };
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(DatabaseService.prototype.onModuleInit.call(fixture)).rejects.toThrow();
    } finally { log.mockRestore(); }
  });

  it('connects before initialization completes', async () => {
    const fixture = { $connect: jest.fn().mockResolvedValue(undefined) };
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await DatabaseService.prototype.onModuleInit.call(fixture);
      expect(fixture.$connect).toHaveBeenCalledTimes(1);
    } finally { log.mockRestore(); }
  });
});
