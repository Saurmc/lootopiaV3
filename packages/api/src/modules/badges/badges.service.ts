import { Injectable } from '@nestjs/common';
import { BadgesRepository } from './badges.repository';
import { BadgeEntity } from './entities/badge.entity';

export const BadgeType = {
  HUNT_COMPLETED: 'hunt_completed',
  FIRST_HUNT: 'first_hunt',
} as const;

@Injectable()
export class BadgesService {
  constructor(private readonly badgesRepository: BadgesRepository) {}

  getUserBadges(userId: string): Promise<BadgeEntity[]> {
    return this.badgesRepository.findByUser(userId);
  }

  async hasBadge(userId: string, badgeType: string): Promise<boolean> {
    const badge = await this.badgesRepository.findByUserAndType(userId, badgeType);
    return badge !== null;
  }

  /**
   * Attribue un badge à l'utilisateur si il ne le possède pas déjà.
   * Retourne null si déjà obtenu, le badge sinon.
   */
  async awardBadge(userId: string, badgeType: string): Promise<BadgeEntity | null> {
    const already = await this.badgesRepository.findByUserAndType(userId, badgeType);
    if (already) return null;
    return this.badgesRepository.save({ user_id: userId, badge_type: badgeType });
  }

  /**
   * Vérifie et attribue automatiquement les badges liés à la complétion d'une chasse.
   * Appelé par ProgressService quand une chasse est terminée.
   */
  async checkAndAwardHuntBadges(userId: string, completedHuntsCount: number): Promise<void> {
    await this.awardBadge(userId, BadgeType.HUNT_COMPLETED);
    if (completedHuntsCount === 1) {
      await this.awardBadge(userId, BadgeType.FIRST_HUNT);
    }
  }
}
