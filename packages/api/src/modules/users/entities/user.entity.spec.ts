import { UserEntity } from './user.entity';
import { Role } from '../../../common/enums/role.enum';
import { getMetadataArgsStorage } from 'typeorm';

describe('UserEntity', () => {
  it('should be defined', () => {
    const user = new UserEntity();
    expect(user).toBeDefined();
  });

  it('should have correct default values', () => {
    const user = new UserEntity();
    expect(user.consent_gps).toBeUndefined();
    expect(user.role).toBeUndefined();
  });

  it('should accept all Role enum values', () => {
    const user = new UserEntity();
    user.role = Role.PLAYER;
    expect(user.role).toBe('PLAYER');
    user.role = Role.PARTNER;
    expect(user.role).toBe('PARTNER');
    user.role = Role.ADMIN;
    expect(user.role).toBe('ADMIN');
  });

  it('should be registered as a TypeORM entity on table "users"', () => {
    const tables = getMetadataArgsStorage().tables;
    const userTable = tables.find((t) => t.target === UserEntity);
    expect(userTable).toBeDefined();
    expect(userTable!.name).toBe('users');
  });

  it('should have the required columns', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === UserEntity,
    );
    const columnNames = columns.map((c) => c.propertyName);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('consent_gps');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });
});
