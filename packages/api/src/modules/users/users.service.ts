import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserEntity } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }

  findByDeviceToken(deviceToken: string): Promise<UserEntity | null> {
    return this.usersRepository.findByDeviceToken(deviceToken);
  }

  async createUser(
    email: string,
    passwordHash: string,
    role: Role = Role.PLAYER,
  ): Promise<UserEntity> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    return this.usersRepository.save({
      email,
      password_hash: passwordHash,
      role,
      is_guest: false,
    });
  }

  /**
   * Crée un compte invité lié à un device_token, ou le retrouve s'il existe déjà.
   * Idempotent : un même device_token retourne toujours le même compte.
   */
  async findOrCreateGuest(deviceToken: string, consentGps: boolean): Promise<UserEntity> {
    const existing = await this.usersRepository.findByDeviceToken(deviceToken);
    if (existing) {
      // Met à jour le consentement GPS si nécessaire
      if (existing.consent_gps !== consentGps) {
        await this.usersRepository.save({ ...existing, consent_gps: consentGps });
        return { ...existing, consent_gps: consentGps };
      }
      return existing;
    }
    return this.usersRepository.save({
      email: null,
      password_hash: null,
      device_token: deviceToken,
      role: Role.PLAYER,
      is_guest: true,
      consent_gps: consentGps,
    });
  }

  /**
   * Convertit un compte invité en compte complet (email + password).
   * Conserve le même user_id → toutes les progressions/badges sont préservés.
   */
  async convertGuestToUser(
    userId: string,
    email: string,
    passwordHash: string,
  ): Promise<UserEntity> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.is_guest) {
      throw new ConflictException('Account is already a full user');
    }
    const emailTaken = await this.usersRepository.findByEmail(email);
    if (emailTaken) {
      throw new ConflictException('Email already in use');
    }
    return this.usersRepository.save({
      ...user,
      email,
      password_hash: passwordHash,
      is_guest: false,
    });
  }
}
