import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const mockUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 'user-uuid',
  email: 'test@example.com',
  password_hash: '$2b$12$hashedpassword',
  role: Role.PLAYER,
  consent_gps: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    } as unknown as jest.Mocked<JwtService>;

    service = new AuthService(usersService, jwtService);
  });

  describe('register', () => {
    it('should hash password and return access_token', async () => {
      usersService.createUser.mockResolvedValue(mockUser());

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'signed-jwt-token' });
      expect(usersService.createUser).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringMatching(/^\$2b\$/),
        Role.PLAYER,
      );
    });

    it('should use provided role if given', async () => {
      usersService.createUser.mockResolvedValue(mockUser({ role: Role.PARTNER }));

      await service.register({
        email: 'partner@example.com',
        password: 'password123',
        role: Role.PARTNER,
      });

      expect(usersService.createUser).toHaveBeenCalledWith(
        'partner@example.com',
        expect.any(String),
        Role.PARTNER,
      );
    });

    it('should propagate ConflictException from usersService', async () => {
      usersService.createUser.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 12);
      usersService.findByEmail.mockResolvedValue(mockUser({ password_hash: hash }));

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'signed-jwt-token' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hash = await bcrypt.hash('correctpassword', 12);
      usersService.findByEmail.mockResolvedValue(mockUser({ password_hash: hash }));

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not leak whether user exists or password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      let error1: UnauthorizedException | undefined;
      try {
        await service.login({ email: 'x@x.com', password: 'pass' });
      } catch (e) {
        error1 = e as UnauthorizedException;
      }

      const hash = await bcrypt.hash('correct', 12);
      usersService.findByEmail.mockResolvedValue(mockUser({ password_hash: hash }));
      let error2: UnauthorizedException | undefined;
      try {
        await service.login({ email: 'test@example.com', password: 'wrong' });
      } catch (e) {
        error2 = e as UnauthorizedException;
      }

      expect(error1?.message).toBe(error2?.message);
    });
  });
});
