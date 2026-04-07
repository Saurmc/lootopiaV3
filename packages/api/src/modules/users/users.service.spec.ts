import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UserEntity } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const mockUser = (): UserEntity => ({
  id: 'user-uuid',
  email: 'test@example.com',
  password_hash: 'hash',
  role: Role.PLAYER,
  consent_gps: false,
  created_at: new Date(),
  updated_at: new Date(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
      updateConsentGps: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new UsersService(repo);
  });

  describe('createUser', () => {
    it('should create a user with default PLAYER role', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.save.mockResolvedValue(mockUser());

      const user = await service.createUser('test@example.com', 'hash');

      expect(repo.save).toHaveBeenCalledWith({
        email: 'test@example.com',
        password_hash: 'hash',
        role: Role.PLAYER,
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
});
