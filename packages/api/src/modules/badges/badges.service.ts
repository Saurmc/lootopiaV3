import { Injectable } from '@nestjs/common';
import { BadgesRepository } from './badges.repository';
import { BadgeEntity } from './entities/badge.entity';

export const BadgeType = {
  HUNT_COMPLETED: 'hunt_completed',
  FIRST_HUNT:    'first_hunt',
  EXPLORER:      'explorer',
  SPEEDRUNNER:   'speedrunner',
  COLLECTOR:     'collector',
  LEGEND:        'legend',
} as const;

const ONE_HOUR_MS = 60 * 60 * 1000;

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
   * - hunt_completed  → toujours
   * - first_hunt      → 1ère chasse terminée
   * - explorer        → chasse avec >= 3 étapes
   * - speedrunner     → chasse terminée en moins d'1 heure
   * - collector       → >= 3 chasses terminées
   * - legend          → >= 5 chasses terminées
   */
  async checkAndAwardHuntBadges(
    userId: string,
    completedHuntsCount: number,
    stepCount: number,
    durationMs: number,
  ): Promise<void> {
    await this.awardBadge(userId, BadgeType.HUNT_COMPLETED);

    if (completedHuntsCount === 1) {
      await this.awardBadge(userId, BadgeType.FIRST_HUNT);
    }

    if (stepCount >= 3) {
      await this.awardBadge(userId, BadgeType.EXPLORER);
    }

    if (durationMs < ONE_HOUR_MS) {
      await this.awardBadge(userId, BadgeType.SPEEDRUNNER);
    }

    if (completedHuntsCount >= 3) {
      await this.awardBadge(userId, BadgeType.COLLECTOR);
    }

    if (completedHuntsCount >= 5) {
      await this.awardBadge(userId, BadgeType.LEGEND);
    }
  }
}
