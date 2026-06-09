import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UserEntity } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const BCRYPT_ROUNDS = 12;

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
    pseudo?: string,
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
      ...(pseudo ? { pseudo } : {}),
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
   * Met à jour le pseudo et/ou l'avatar du profil joueur.
   */
  async updateProfile(
    userId: string,
    data: { pseudo?: string; avatar_url?: string },
  ): Promise<UserEntity> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updates: Partial<UserEntity> = { id: userId };
    if (data.pseudo !== undefined) updates.pseudo = data.pseudo;
    if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;
    return this.usersRepository.save({ ...user, ...updates });
  }

  /**
   * Change le mot de passe après vérification du mot de passe actuel.
   * Non accessible aux comptes invités (pas de password_hash).
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.password_hash) {
      throw new UnauthorizedException('Guest accounts cannot change password');
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersRepository.save({ ...user, password_hash: newHash });
  }

  /**
   * Invalide tous les refresh tokens existants pour cet utilisateur (logout, password change).
   */
  async invalidateRefreshTokens(userId: string): Promise<void> {
    await this.usersRepository.incrementRefreshVersion(userId);
  }

  /**
   * Supprime définitivement le compte et toutes ses données associées.
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.deleteById(userId);
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
