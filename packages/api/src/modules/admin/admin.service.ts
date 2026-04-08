import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ProgressRepository } from '../progress/progress.repository';

export interface AdminStatsDto {
  user_count: number;
  hunt_count: number;
  participant_count: number;
  completed_count: number;
  completion_rate: number;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly huntsRepository: HuntsRepository,
    private readonly progressRepository: ProgressRepository,
  ) {}

  async getGlobalStats(): Promise<AdminStatsDto> {
    const [users, hunt_count, progresses] = await Promise.all([
      this.usersRepository.findAll(),
      this.huntsRepository.count(),
      this.progressRepository.findAll(),
    ]);

    const participant_count = progresses.length;
    const completed_count = progresses.filter((p) => p.completed_at !== null).length;
    const completion_rate =
      participant_count > 0
        ? Math.round((completed_count / participant_count) * 100)
        : 0;

    return {
      user_count: users.length,
      hunt_count,
      participant_count,
      completed_count,
      completion_rate,
    };
  }
}
