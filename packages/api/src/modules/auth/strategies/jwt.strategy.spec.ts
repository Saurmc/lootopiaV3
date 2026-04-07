import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    strategy = new JwtStrategy(configService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return user object from JWT payload', () => {
    const payload = { sub: 'user-uuid-123', role: 'PLAYER' };
    const result = strategy.validate(payload);
    expect(result).toEqual({ id: 'user-uuid-123', role: 'PLAYER' });
  });

  it('should map sub to id and preserve role', () => {
    const payload = { sub: 'admin-uuid', role: 'ADMIN' };
    const result = strategy.validate(payload);
    expect(result.id).toBe('admin-uuid');
    expect(result.role).toBe('ADMIN');
  });
});
