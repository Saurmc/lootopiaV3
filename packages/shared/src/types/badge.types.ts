export type BadgeType = 'EXPLORER' | 'SPEEDRUNNER' | 'COLLECTOR';

export interface Badge {
  id: string;
  userId: string;
  badgeType: BadgeType;
  earnedAt: string;
}
