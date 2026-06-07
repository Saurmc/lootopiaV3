import { Injectable } from '@nestjs/common';
import { BadgesRepository } from './badges.repository';
import { BadgeEntity } from './entities/badge.entity';

export const BadgeType = {
  HUNT_COMPLETED: 'hunt_completed',
  FIRST_HUNT:     'first_hunt',
  EXPLORER:       'explorer',
  SPEEDRUNNER:    'speedrunner',
  COLLECTOR:      'collector',
  ADVENTURER:     'adventurer',
  CHAMPION:       'champion',
  LEGEND:         'legend',
} as const;

export type BadgeTypeValue = typeof BadgeType[keyof typeof BadgeType];

const ONE_HOUR_MS = 60 * 60 * 1000;

export interface BadgeMeta {
  badge_type: string;
  label: string;
  description: string;
  emoji: string;
}

export const BADGE_CATALOG: BadgeMeta[] = [
  { badge_type: BadgeType.FIRST_HUNT,     label: 'Première chasse',   description: 'Vous avez complété votre première chasse au trésor !',            emoji: '⭐' },
  { badge_type: BadgeType.HUNT_COMPLETED, label: 'Chasse complétée',  description: 'Vous avez terminé une chasse au trésor.',                          emoji: '🎯' },
  { badge_type: BadgeType.EXPLORER,       label: 'Explorateur',        description: 'Vous avez complété une chasse avec au moins 3 étapes.',            emoji: '🗺️' },
  { badge_type: BadgeType.SPEEDRUNNER,    label: 'Speedrunner',        description: 'Vous avez terminé une chasse en moins d\'une heure !',             emoji: '⚡' },
  { badge_type: BadgeType.COLLECTOR,      label: 'Collectionneur',     description: 'Vous avez complété 3 chasses au trésor.',                          emoji: '🏅' },
  { badge_type: BadgeType.ADVENTURER,     label: 'Aventurier',         description: 'Vous avez complété 5 chasses au trésor.',                          emoji: '⚔️' },
  { badge_type: BadgeType.CHAMPION,       label: 'Champion',           description: 'Vous avez complété 10 chasses au trésor !',                        emoji: '🏆' },
  { badge_type: BadgeType.LEGEND,         label: 'Légende',            description: 'Vous avez complété 20 chasses. Vous êtes une légende !',           emoji: '💎' },
];

export interface EnrichedBadge extends BadgeEntity {
  label: string;
  description: string;
  emoji: string;
}

@Injectable()
export class BadgesService {
  constructor(private readonly badgesRepository: BadgesRepository) {}

  async getUserBadges(userId: string): Promise<EnrichedBadge[]> {
    const badges = await this.badgesRepository.findByUser(userId);
    return badges.map((b) => this.enrich(b));
  }

  async hasBadge(userId: string, badgeType: string): Promise<boolean> {
    const badge = await this.badgesRepository.findByUserAndType(userId, badgeType);
    return badge !== null;
  }

  async awardBadge(userId: string, badgeType: string): Promise<BadgeEntity | null> {
    const already = await this.badgesRepository.findByUserAndType(userId, badgeType);
    if (already) return null;
    return this.badgesRepository.save({ user_id: userId, badge_type: badgeType });
  }

  /**
   * Attribue automatiquement les badges à la complétion d'une chasse.
   * @param completedHuntsCount nb total de chasses terminées
   * @param stepCount           nb d'étapes de la chasse terminée
   * @param durationMs          durée en ms pour terminer la chasse
   */
  async checkAndAwardHuntBadges(
    userId: string,
    completedHuntsCount: number,
    stepCount: number,
    durationMs: number,
  ): Promise<void> {
    await this.awardBadge(userId, BadgeType.HUNT_COMPLETED);
    if (completedHuntsCount === 1) await this.awardBadge(userId, BadgeType.FIRST_HUNT);
    if (stepCount >= 3)             await this.awardBadge(userId, BadgeType.EXPLORER);
    if (durationMs < ONE_HOUR_MS)   await this.awardBadge(userId, BadgeType.SPEEDRUNNER);
    if (completedHuntsCount >= 3)   await this.awardBadge(userId, BadgeType.COLLECTOR);
    if (completedHuntsCount >= 5)   await this.awardBadge(userId, BadgeType.ADVENTURER);
    if (completedHuntsCount >= 10)  await this.awardBadge(userId, BadgeType.CHAMPION);
    if (completedHuntsCount >= 20)  await this.awardBadge(userId, BadgeType.LEGEND);
  }

  async getBadgeCatalogForUser(userId: string): Promise<(BadgeMeta & { earned: boolean; earned_at: string | null })[]> {
    const userBadges = await this.badgesRepository.findByUser(userId);
    const map = new Map(userBadges.map((b) => [b.badge_type, b]));
    return BADGE_CATALOG.map((meta) => {
      const earned = map.get(meta.badge_type);
      return { ...meta, earned: !!earned, earned_at: earned ? earned.earned_at.toISOString() : null };
    });
  }

  private enrich(badge: BadgeEntity): EnrichedBadge {
    const meta = BADGE_CATALOG.find((m) => m.badge_type === badge.badge_type);
    return { ...badge, label: meta?.label ?? badge.badge_type, description: meta?.description ?? '', emoji: meta?.emoji ?? '🎖️' };
  }
}
