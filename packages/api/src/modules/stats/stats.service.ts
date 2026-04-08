import { Injectable } from '@nestjs/common';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ProgressRepository } from '../progress/progress.repository';
import { Role } from '../../common/enums/role.enum';

export interface HuntStatRow {
  hunt_id: string;
  title: string;
  is_active: boolean;
  participant_count: number;
  completed_count: number;
  completion_rate: number;
  average_points: number;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly huntsRepository: HuntsRepository,
    private readonly progressRepository: ProgressRepository,
  ) {}

  async getHuntsStats(userId: string, role: string): Promise<HuntStatRow[]> {
    // Admin voit toutes les chasses, partenaire voit seulement les siennes
    const hunts = await this.huntsRepository.findAllForStats(
      role === Role.ADMIN ? undefined : userId,
    );

    const rows = await Promise.all(
      hunts.map(async (hunt) => {
        const progresses = await this.progressRepository.findAllByHunt(hunt.id);
        const participant_count = progresses.length;
        const completed_count = progresses.filter((p) => p.completed_at !== null).length;
        const completion_rate =
          participant_count > 0
            ? Math.round((completed_count / participant_count) * 100)
            : 0;
        const average_points =
          participant_count > 0
            ? Math.round(
                progresses.reduce((sum, p) => sum + p.total_points, 0) / participant_count,
              )
            : 0;

        return {
          hunt_id: hunt.id,
          title: hunt.title,
          is_active: hunt.is_active,
          participant_count,
          completed_count,
          completion_rate,
          average_points,
        };
      }),
    );

    return rows;
  }
}
