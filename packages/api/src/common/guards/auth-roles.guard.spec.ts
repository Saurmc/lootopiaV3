import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

// Tests fonctionnels sur RolesGuard (le cœur du mécanisme Auth+Roles)
describe('Auth decorator + RolesGuard integration', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function mockContext(user?: { id: string; role: string }): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow ADMIN to access ADMIN-only endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = mockContext({ id: 'uuid', role: Role.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny PLAYER access to ADMIN-only endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = mockContext({ id: 'uuid', role: Role.PLAYER });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow PARTNER access to PARTNER+ADMIN endpoint', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.PARTNER, Role.ADMIN]);
    const ctx = mockContext({ id: 'uuid', role: Role.PARTNER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny PLAYER access to PARTNER+ADMIN endpoint', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.PARTNER, Role.ADMIN]);
    const ctx = mockContext({ id: 'uuid', role: Role.PLAYER });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow any authenticated user when no roles specified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = mockContext({ id: 'uuid', role: Role.PLAYER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny unauthenticated request (no user on request)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PARTNER]);
    expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
  });
});
