import { NotFoundException } from '@nestjs/common';
import { RgpdService } from './rgpd.service';
import { UsersRepository } from '../users/users.repository';
import { UserEntity } from '../users/entities/user.entity';
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

describe('RgpdService', () => {
  let service: RgpdService;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    usersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
      updateConsentGps: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new RgpdService(usersRepository);
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
      const user = mockUser();
      user.consent_gps = true;
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
      const user = mockUser();
      user.consent_gps = true;
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
});
