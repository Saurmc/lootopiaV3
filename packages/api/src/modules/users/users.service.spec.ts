import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UserEntity } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const mockUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 'user-uuid',
  email: 'test@example.com',
  password_hash: '$2b$12$hashedpassword',
  role: Role.PLAYER,
  device_token: null,
  is_guest: false,
  consent_gps: false,
  pseudo: null,
  avatar_url: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByDeviceToken: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
      updateConsentGps: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new UsersService(repo);
  });

  describe('createUser', () => {
    it('should create a user with default PLAYER role and is_guest false', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.save.mockResolvedValue(mockUser());

      const user = await service.createUser('test@example.com', 'hash');

      expect(repo.save).toHaveBeenCalledWith({
        email: 'test@example.com',
        password_hash: 'hash',
        role: Role.PLAYER,
        is_guest: false,
      });
      expect(user).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      repo.findByEmail.mockResolvedValue(mockUser());

      await expect(
        service.createUser('test@example.com', 'hash'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      repo.findByEmail.mockResolvedValue(mockUser());
      const result = await service.findByEmail('test@example.com');
      expect(result).toBeDefined();
    });

    it('should return null when not found', async () => {
      repo.findByEmail.mockResolvedValue(null);
      const result = await service.findByEmail('unknown@example.com');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update pseudo and avatar_url', async () => {
      const user = mockUser();
      repo.findById.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, pseudo: 'Explorer', avatar_url: '/uploads/avatar.png' });

      const result = await service.updateProfile('user-uuid', {
        pseudo: 'Explorer',
        avatar_url: '/uploads/avatar.png',
      });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ pseudo: 'Explorer', avatar_url: '/uploads/avatar.png' }),
      );
      expect(result.pseudo).toBe('Explorer');
    });

    it('should throw NotFoundException when user not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('unknown-uuid', { pseudo: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('should throw UnauthorizedException for guest accounts (no password_hash)', async () => {
      repo.findById.mockResolvedValue(mockUser({ password_hash: null, is_guest: true }));

      await expect(
        service.updatePassword('user-uuid', 'anything', 'NewPass1!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updatePassword('unknown-uuid', 'OldPass!', 'NewPass1!'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
