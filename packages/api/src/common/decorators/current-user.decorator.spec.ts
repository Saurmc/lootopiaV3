import { AuthenticatedUser } from './current-user.decorator';
import { Role } from '../enums/role.enum';

describe('AuthenticatedUser interface', () => {
  it('should accept a valid authenticated user shape', () => {
    const user: AuthenticatedUser = { id: 'uuid-123', role: Role.PLAYER };
    expect(user.id).toBe('uuid-123');
    expect(user.role).toBe(Role.PLAYER);
  });

  it('should accept all role values', () => {
    const roles = [Role.PLAYER, Role.PARTNER, Role.ADMIN];
    roles.forEach((role) => {
      const user: AuthenticatedUser = { id: 'uuid', role };
      expect(user.role).toBe(role);
    });
  });
});
