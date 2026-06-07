import { Injectable } from '@nestjs/common';
import { ProgressRepository } from '../progress/progress.repository';
import { BadgesService } from '../badges/badges.service';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StorageService } from '../files/storage.service';

export interface HuntHistoryItem {
  hunt_id: string;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: Date;
  completed_at: Date | null;
}

export interface ActiveProgressItem {
  progress_id: string;
  hunt_id: string;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: Date;
}

export interface PlayerStats {
  total_points: number;
  hunt_count: number;
  completed_hunts: number;
  badge_count: number;
}

export interface PlayerProfile {
  id: string;
  email: string | null;
  pseudo: string | null;
  avatar_url: string | null;
  role: string;
  is_guest: boolean;
  consent_gps: boolean;
  created_at: Date;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly badgesService: BadgesService,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  async getProfile(userId: string): Promise<PlayerProfile> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const avatarUrl = user.avatar_url
      ? await this.storageService.getPresignedUrl(user.avatar_url)
      : null;
    return {
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
      avatar_url: avatarUrl,
      role: user.role,
      is_guest: user.is_guest,
      consent_gps: user.consent_gps,
      created_at: user.created_at,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PlayerProfile> {
    const updated = await this.usersService.updateProfile(userId, {
      pseudo: dto.pseudo,
      avatar_url: dto.avatar_url,
    });
    const avatarUrl = updated.avatar_url
      ? await this.storageService.getPresignedUrl(updated.avatar_url)
      : null;
    return {
      id: updated.id,
      email: updated.email,
      pseudo: updated.pseudo,
      avatar_url: avatarUrl,
      role: updated.role,
      is_guest: updated.is_guest,
      consent_gps: updated.consent_gps,
      created_at: updated.created_at,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    await this.usersService.updatePassword(userId, dto.current_password, dto.new_password);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.usersService.deleteAccount(userId);
  }

  async getStats(userId: string): Promise<PlayerStats> {
    const allProgress = await this.progressRepository.findAllByUser(userId);
    const badges = await this.badgesService.getUserBadges(userId);

    const total_points = allProgress.reduce((sum, p) => sum + p.total_points, 0);
    const completed_hunts = allProgress.filter((p) => p.completed_at !== null).length;

    return {
      total_points,
      hunt_count: allProgress.length,
      completed_hunts,
      badge_count: badges.length,
    };
  }

  /**
   * Retourne les chasses en cours (non terminées) pour permettre la reprise.
   * Mode invité : non applicable (endpoint protégé par @Auth).
   */
  async getActiveProgresses(userId: string): Promise<ActiveProgressItem[]> {
    const allProgress = await this.progressRepository.findAllByUser(userId);
    return allProgress
      .filter((p) => p.completed_at === null)
      .map((p) => ({
        progress_id: p.id,
        hunt_id: p.hunt_id,
        current_step: p.current_step,
        completed_steps: p.completed_steps,
        total_points: p.total_points,
        started_at: p.started_at,
      }));
  }

  async getHuntHistory(userId: string): Promise<HuntHistoryItem[]> {
    const allProgress = await this.progressRepository.findAllByUser(userId);
    return allProgress.map((p) => ({
      hunt_id: p.hunt_id,
      current_step: p.current_step,
      completed_steps: p.completed_steps,
      total_points: p.total_points,
      started_at: p.started_at,
      completed_at: p.completed_at,
    }));
  }
}
