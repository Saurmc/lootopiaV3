import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProgressRepository } from './progress.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ProgressEntity } from './entities/progress.entity';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly huntsRepository: HuntsRepository,
  ) {}

  async joinHunt(userId: string, huntId: string): Promise<ProgressEntity> {
    const hunt = await this.huntsRepository.findById(huntId);
    if (!hunt || !hunt.is_active) {
      throw new NotFoundException(`Hunt ${huntId} not found or inactive`);
    }

    const existing = await this.progressRepository.findByUserAndHunt(userId, huntId);
    if (existing) {
      throw new ConflictException('Already joined this hunt');
    }

    return this.progressRepository.save({
      user_id: userId,
      hunt_id: huntId,
      current_step: 0,
      completed_steps: [],
      total_points: 0,
    });
  }

  async getProgress(userId: string, huntId: string): Promise<ProgressEntity> {
    const progress = await this.progressRepository.findByUserAndHunt(userId, huntId);
    if (!progress) {
      throw new NotFoundException('No progress found for this hunt');
    }
    return progress;
  }
}
