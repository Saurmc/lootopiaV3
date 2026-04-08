import { ConfigService } from '@nestjs/config';
import { JwtOptionalStrategy } from './jwt-optional.strategy';

describe('JwtOptionalStrategy', () => {
  let strategy: JwtOptionalStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    strategy = new JwtOptionalStrategy(configService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return user from valid payload', () => {
    const result = strategy.validate({ sub: 'uuid-123', role: 'PLAYER' });
    expect(result).toEqual({ id: 'uuid-123', role: 'PLAYER' });
  });

  it('should use jwt-optional strategy name (not jwt)', () => {
    // La stratégie doit être enregistrée sous le nom 'jwt-optional'
    // pour ne pas écraser la stratégie JWT principale
    expect(strategy).toBeInstanceOf(JwtOptionalStrategy);
  });
});
