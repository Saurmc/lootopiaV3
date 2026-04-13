import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RgpdService } from './rgpd.service';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const mockUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 'user-uuid',
  email: 'test@example.com',
  password_hash: 'hash',
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

describe('RgpdService', () => {
  let service: RgpdService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    usersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
      updateConsentGps: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    usersService = {
      updatePassword: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    service = new RgpdService(usersRepository, usersService);
  });

  describe('deleteAccount', () => {
    it('should delete the user account', async () => {
      usersRepository.findById.mockResolvedValue(mockUser());
      usersRepository.deleteById.mockResolvedValue(undefined);

      await service.deleteAccount('user-uuid');

      expect(usersRepository.deleteById).toHaveBeenCalledWith('user-uuid');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.deleteAccount('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGpsConsent', () => {
    it('should update GPS consent to true', async () => {
      usersRepository.findById.mockResolvedValue(mockUser());
      usersRepository.updateConsentGps.mockResolvedValue(undefined);

      await service.updateGpsConsent('user-uuid', true);

      expect(usersRepository.updateConsentGps).toHaveBeenCalledWith(
        'user-uuid',
        true,
      );
    });

    it('should update GPS consent to false (revocation)', async () => {
      const user = mockUser({ consent_gps: true });
      usersRepository.findById.mockResolvedValue(user);
      usersRepository.updateConsentGps.mockResolvedValue(undefined);

      await service.updateGpsConsent('user-uuid', false);

      expect(usersRepository.updateConsentGps).toHaveBeenCalledWith(
        'user-uuid',
        false,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateGpsConsent('unknown-id', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGpsConsent', () => {
    it('should return consent_gps status', async () => {
      const user = mockUser({ consent_gps: true });
      usersRepository.findById.mockResolvedValue(user);

      const result = await service.getGpsConsent('user-uuid');

      expect(result).toBe(true);
    });

    it('should return false when consent not given', async () => {
      usersRepository.findById.mockResolvedValue(mockUser());

      const result = await service.getGpsConsent('user-uuid');

      expect(result).toBe(false);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.getGpsConsent('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should delegate to usersService when passwords match', async () => {
      usersService.updatePassword.mockResolvedValue(undefined);

      await service.updatePassword('user-uuid', 'OldPass1!', 'NewPass1!', 'NewPass1!');

      expect(usersService.updatePassword).toHaveBeenCalledWith(
        'user-uuid',
        'OldPass1!',
        'NewPass1!',
      );
    });

    it('should throw BadRequestException when new passwords do not match', async () => {
      await expect(
        service.updatePassword('user-uuid', 'OldPass1!', 'NewPass1!', 'DifferentPass!'),
      ).rejects.toThrow(BadRequestException);

      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });

    it('should propagate UnauthorizedException from usersService (wrong current password)', async () => {
      usersService.updatePassword.mockRejectedValue(
        new UnauthorizedException('Current password is incorrect'),
      );

      await expect(
        service.updatePassword('user-uuid', 'WrongPass!', 'NewPass1!', 'NewPass1!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
