import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class RgpdService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
}
