import { Injectable } from '@nestjs/common';
import { BadgesRepository } from './badges.repository';
import { BadgeEntity } from './entities/badge.entity';

export const BadgeType = {
  FIRST_HUNT:     'first_hunt',
  EXPLORER:       'explorer',
  ADVENTURER:     'adventurer',
  CHAMPION:       'champion',
  LEGEND:         'legend',
} as const;

export type BadgeTypeValue = typeof BadgeType[keyof typeof BadgeType];

export interface BadgeMeta {
  badge_type: string;
  label: string;
  description: string;
  emoji: string;
  required_hunts: number;
}

/** Catalogue complet des badges — source de vérité pour le front */
export const BADGE_CATALOG: BadgeMeta[] = [
  {
    badge_type: BadgeType.FIRST_HUNT,
    label: 'Première chasse',
    description: 'Vous avez complété votre première chasse au trésor. L\'aventure commence !',
    emoji: '⭐',
    required_hunts: 1,
  },
  {
    badge_type: BadgeType.EXPLORER,
    label: 'Explorateur',
    description: 'Deux chasses complétées. Vous prenez goût à l\'aventure !',
    emoji: '🗺️',
    required_hunts: 2,
  },
  {
    badge_type: BadgeType.ADVENTURER,
    label: 'Aventurier',
    description: 'Cinq chasses dans votre palmarès. Un vrai chasseur de trésors !',
    emoji: '⚔️',
    required_hunts: 5,
  },
  {
    badge_type: BadgeType.CHAMPION,
    label: 'Champion',
    description: 'Dix chasses complétées. Vous êtes une légende de Lootopia !',
    emoji: '🏆',
    required_hunts: 10,
  },
  {
    badge_type: BadgeType.LEGEND,
    label: 'Légende',
    description: 'Vingt chasses complétées. Votre nom résonne dans toute la contrée.',
    emoji: '💎',
    required_hunts: 20,
  },
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
   * Attribue tous les badges débloqués selon le nombre de chasses complétées.
   * Appelé par ProgressService à chaque fin de chasse.
   */
  async checkAndAwardHuntBadges(userId: string, completedHuntsCount: number): Promise<void> {
    const milestones = BADGE_CATALOG.filter(
      (b) => b.required_hunts <= completedHuntsCount,
    );
    await Promise.all(
      milestones.map((m) => this.awardBadge(userId, m.badge_type)),
    );
  }

  /** Retourne le catalogue complet avec, pour chaque badge, si l'utilisateur l'a obtenu */
  async getBadgeCatalogForUser(userId: string): Promise<(BadgeMeta & { earned: boolean; earned_at: string | null })[]> {
    const userBadges = await this.badgesRepository.findByUser(userId);
    const userBadgeMap = new Map(userBadges.map((b) => [b.badge_type, b]));

    return BADGE_CATALOG.map((meta) => {
      const earned = userBadgeMap.get(meta.badge_type);
      return {
        ...meta,
        earned: !!earned,
        earned_at: earned ? earned.earned_at.toISOString() : null,
      };
    });
  }

  private enrich(badge: BadgeEntity): EnrichedBadge {
    const meta = BADGE_CATALOG.find((m) => m.badge_type === badge.badge_type);
    return {
      ...badge,
      label: meta?.label ?? badge.badge_type,
      description: meta?.description ?? '',
      emoji: meta?.emoji ?? '🎖️',
    };
  }
}
