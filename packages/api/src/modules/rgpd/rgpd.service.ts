import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class RgpdService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // La suppression CASCADE sur UserEntity propage aux hunts, progress et badges
    await this.usersRepository.deleteById(userId);
  }

  async updateGpsConsent(userId: string, consent: boolean): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.updateConsentGps(userId, consent);
  }

  async getGpsConsent(userId: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.consent_gps;
  }

  /**
   * Change le mot de passe après vérification du mot de passe actuel.
   * Vérifie la confirmation du nouveau mot de passe avant de déléguer au service.
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
  ): Promise<void> {
    if (newPassword !== newPasswordConfirm) {
      throw new BadRequestException('New passwords do not match');
    }
    await this.usersService.updatePassword(userId, currentPassword, newPassword);
  }
}
