import { Injectable } from '@nestjs/common';
import { ProgressRepository } from '../progress/progress.repository';
import { BadgesService } from '../badges/badges.service';

export interface HuntHistoryItem {
  hunt_id: string;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: Date;
  completed_at: Date | null;
}

export interface PlayerStats {
  total_points: number;
  hunt_count: number;
  completed_hunts: number;
  badge_count: number;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly badgesService: BadgesService,
  ) {}

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
